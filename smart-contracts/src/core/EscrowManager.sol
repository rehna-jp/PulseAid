// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";

/**
 * @title EscrowManager
 * @notice Securely holds donated funds per campaign and releases them
 *         only after proof approval. Tracks total locked funds so fee
 *         withdrawals never touch donor money.
 */
contract EscrowManager is AccessControl, ReentrancyGuard, Pausable {

    bytes32 public constant CAMPAIGN_ROLE        = keccak256("CAMPAIGN_ROLE");
    bytes32 public constant PROOF_VALIDATOR_ROLE = keccak256("PROOF_VALIDATOR_ROLE");

    uint256 public constant PLATFORM_FEE_BPS = 10; // 0.1 %

    struct EscrowAccount {
        uint256 balance;
        uint256 totalDeposited;
        bool    refundEnabled;
        bool    fundsReleased;
        address recipient;
        mapping(address => uint256) donorBalances;
        address[] donors;
    }

    mapping(uint256 => EscrowAccount) public escrowAccounts;

    // Global counter so we can answer "how much ETH is owed to campaigns?"
    // without iterating every account.
    uint256 public totalLockedFunds;

    address public treasury;
    uint256 public totalFeesCollected;

    event RefundsEnabled(uint256 indexed campaignId);
    event FeeCollected  (uint256 indexed campaignId, uint256 amount);

    constructor(address _treasury, address admin) {
        if (_treasury == address(0) || admin == address(0)) revert Errors.ZeroAddress();
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CAMPAIGN_ROLE, admin);
        _grantRole(PROOF_VALIDATOR_ROLE, admin);
    }

    // ── Deposit ───────────────────────────────────────────────────────────────

    /**
     * @notice Lock a donation into escrow for a campaign
     * @param campaignId Campaign receiving the donation
     * @param donor      Address of the donor
     */
    function lockFunds(uint256 campaignId, address donor)
        external payable
        onlyRole(CAMPAIGN_ROLE)
        whenNotPaused
        nonReentrant
    {
        if (msg.value == 0)       revert Errors.InvalidAmount();
        if (donor == address(0))  revert Errors.ZeroAddress();

        EscrowAccount storage acct = escrowAccounts[campaignId];

        if (acct.donorBalances[donor] == 0) {
            acct.donors.push(donor);
        }

        acct.donorBalances[donor] += msg.value;
        acct.balance              += msg.value;
        acct.totalDeposited       += msg.value;

        totalLockedFunds += msg.value; // ← global tracker updated

        emit Events.FundsLocked(campaignId, msg.value, block.timestamp);
    }

    // ── Release ───────────────────────────────────────────────────────────────

    /**
     * @notice Release funds to institution after proof approval
     * @param campaignId Campaign whose funds are released
     * @param recipient  Institution address
     */
    function releaseFunds(uint256 campaignId, address recipient)
        external
        onlyRole(PROOF_VALIDATOR_ROLE)        whenNotPaused        nonReentrant
    {
        if (recipient == address(0)) revert Errors.InvalidRecipient();

        EscrowAccount storage acct = escrowAccounts[campaignId];
        if (acct.balance == 0)       revert Errors.InsufficientBalance();
        if (acct.fundsReleased)      revert Errors.FundsAlreadyReleased();
        if (acct.refundEnabled)      revert Errors.RefundNotAvailable();

        acct.recipient      = recipient;
        acct.fundsReleased  = true;

        uint256 total              = acct.balance;
        uint256 fee                = (total * PLATFORM_FEE_BPS) / 10_000;
        uint256 amountToRecipient  = total - fee;

        acct.balance     = 0;
        totalLockedFunds -= total; // ← global tracker updated

        (bool ok,) = payable(recipient).call{value: amountToRecipient}("");
        if (!ok) revert Errors.TransferFailed();

        if (fee > 0) {
            (bool feeOk,) = payable(treasury).call{value: fee}("");
            if (!feeOk) revert Errors.TransferFailed();
            totalFeesCollected += fee;
            emit FeeCollected(campaignId, fee);
        }

        emit Events.FundsReleased(campaignId, recipient, amountToRecipient, block.timestamp);
    }

    // ── Refunds ───────────────────────────────────────────────────────────────

    /**
     * @notice Enable refunds for a failed or cancelled campaign
     */
    function enableRefunds(uint256 campaignId) external {
        if (!hasRole(CAMPAIGN_ROLE, msg.sender) && !hasRole(PROOF_VALIDATOR_ROLE, msg.sender)) {
            revert Errors.Unauthorized();
        }
        EscrowAccount storage acct = escrowAccounts[campaignId];
        if (acct.fundsReleased) revert Errors.FundsAlreadyReleased();
        acct.refundEnabled = true;
        emit RefundsEnabled(campaignId);
    }

    /**
     * @notice Donor claims a refund for a failed campaign
     */
    function claimRefund(uint256 campaignId) external whenNotPaused nonReentrant {
        EscrowAccount storage acct = escrowAccounts[campaignId];
        if (!acct.refundEnabled)  revert Errors.RefundNotAvailable();
        if (acct.fundsReleased)   revert Errors.FundsAlreadyReleased();

        uint256 amount = acct.donorBalances[msg.sender];
        if (amount == 0) revert Errors.InsufficientBalance();

        acct.donorBalances[msg.sender]  = 0;
        acct.balance                   -= amount;
        totalLockedFunds               -= amount; // ← global tracker updated

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert Errors.TransferFailed();

        emit Events.FundsRefunded(campaignId, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Admin batch-refund donors (gas-efficient for large donor lists)
     */
    function batchRefund(uint256 campaignId, address[] calldata donors)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
        nonReentrant
    {
        EscrowAccount storage acct = escrowAccounts[campaignId];
        if (!acct.refundEnabled) revert Errors.RefundNotAvailable();
        if (acct.fundsReleased)  revert Errors.FundsAlreadyReleased();

        for (uint256 i = 0; i < donors.length; i++) {
            address donor  = donors[i];
            uint256 amount = acct.donorBalances[donor];
            if (amount == 0) continue;

            acct.donorBalances[donor]  = 0;
            acct.balance              -= amount;
            totalLockedFunds          -= amount;

            (bool ok,) = payable(donor).call{value: amount}("");
            if (!ok) revert Errors.TransferFailed();
            emit Events.FundsRefunded(campaignId, donor, amount, block.timestamp);
        }
    }

    // ── View Functions ────────────────────────────────────────────────────────

    function getBalance(uint256 campaignId) external view returns (uint256) {
        return escrowAccounts[campaignId].balance;
    }

    function getDonorBalance(uint256 campaignId, address donor) external view returns (uint256) {
        return escrowAccounts[campaignId].donorBalances[donor];
    }

    function getDonors(uint256 campaignId) external view returns (address[] memory) {
        return escrowAccounts[campaignId].donors;
    }

    function isRefundEnabled(uint256 campaignId) external view returns (bool) {
        return escrowAccounts[campaignId].refundEnabled;
    }

    function areFundsReleased(uint256 campaignId) external view returns (bool) {
        return escrowAccounts[campaignId].fundsReleased;
    }

    function getEscrowInfo(uint256 campaignId)
        external view
        returns (
            uint256 balance, uint256 totalDeposited,
            bool refundEnabled, bool fundsReleased,
            address recipient, uint256 donorCount
        )
    {
        EscrowAccount storage acct = escrowAccounts[campaignId];
        return (
            acct.balance, acct.totalDeposited,
            acct.refundEnabled, acct.fundsReleased,
            acct.recipient, acct.donors.length
        );
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function updateTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert Errors.ZeroAddress();
        treasury = newTreasury;
    }

    /**
     * @notice Withdraw accumulated platform fees.
     *         Uses totalLockedFunds to ensure donor funds are never touched.
     */
    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 contractBalance  = address(this).balance;
        uint256 availableFees    = contractBalance > totalLockedFunds
                                   ? contractBalance - totalLockedFunds
                                   : 0;
        if (availableFees == 0) revert Errors.InsufficientTreasuryFunds();

        (bool ok,) = payable(treasury).call{value: availableFees}("");
        if (!ok) revert Errors.TransferFailed();

        emit Events.TreasuryWithdrawal(treasury, availableFees, "Fee Withdrawal", block.timestamp);
    }

    /**
     * @notice Emergency drain — only while paused, sends everything to treasury
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert Errors.InsufficientBalance();
        totalLockedFunds = 0;
        (bool ok,) = payable(treasury).call{value: balance}("");
        if (!ok) revert Errors.TransferFailed();
        emit Events.EmergencyWithdrawal(treasury, balance, block.timestamp);
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause();   emit Events.PlatformPaused(block.timestamp); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); emit Events.PlatformUnpaused(block.timestamp); }

    receive() external payable {}
}