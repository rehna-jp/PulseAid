// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";

/**
 * @title Treasury
 * @notice Manages platform fees and DAO-controlled funds
 * @dev Controlled by governance for fund allocation
 */
contract Treasury is AccessControl, ReentrancyGuard, Pausable {
    // === Constants ===
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    // === State Variables ===
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    
    mapping(address => uint256) public deposits; // Track deposits by source
    mapping(string => uint256) public allocationsByPurpose;

    // === Constructor ===
    constructor(address admin) {
        if (admin == address(0)) revert Errors.ZeroAddress();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
        _grantRole(WITHDRAWER_ROLE, admin);
    }

    /**
     * @notice Grant `WITHDRAWER_ROLE` to an address so it can perform withdrawals
     * @dev Callable by admin only.
     */
    function assignWithdrawer(address delegate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (delegate == address(0)) revert Errors.ZeroAddress();
        _grantRole(WITHDRAWER_ROLE, delegate);
    }

    // === Deposit Functions ===

    /**
     * @notice Deposit funds to treasury
     * @param source Description of fund source
     */
    function deposit(string memory source) external payable nonReentrant {
        if (paused()) revert Errors.ContractPaused();
        if (msg.value == 0) revert Errors.InvalidAmount();
        
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Events.TreasuryDeposit(msg.sender, msg.value, source, block.timestamp);
    }

    // === Withdrawal Functions ===

    /**
     * @notice Withdraw funds for a specific purpose (requires governance approval)
     * @param recipient Address receiving funds
     * @param amount Amount to withdraw
     * @param purpose Purpose of withdrawal
     */
    function withdraw(
        address recipient,
        uint256 amount,
        string memory purpose
    ) external onlyRole(WITHDRAWER_ROLE) nonReentrant {
        if (paused()) revert Errors.ContractPaused();
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();
        if (amount > address(this).balance) revert Errors.InsufficientTreasuryFunds();
        
        totalWithdrawals += amount;
        allocationsByPurpose[purpose] += amount;
        
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert Errors.TransferFailed();
        
        emit Events.TreasuryWithdrawal(recipient, amount, purpose, block.timestamp);
    }

    /**
     * @notice Batch withdrawal for multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @param purpose Purpose of withdrawals
     */
    function batchWithdraw(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string memory purpose
    ) external onlyRole(WITHDRAWER_ROLE) nonReentrant {
        if (paused()) revert Errors.ContractPaused();
        if (recipients.length != amounts.length) revert Errors.ArrayLengthMismatch();
        if (recipients.length == 0) revert Errors.InvalidParameter();
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        if (totalAmount > address(this).balance) {
            revert Errors.InsufficientTreasuryFunds();
        }
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert Errors.ZeroAddress();
            if (amounts[i] == 0) continue;
            
            (bool success, ) = payable(recipients[i]).call{value: amounts[i]}("");
            if (!success) revert Errors.TransferFailed();
            
            emit Events.TreasuryWithdrawal(
                recipients[i],
                amounts[i],
                purpose,
                block.timestamp
            );
        }
        
        totalWithdrawals += totalAmount;
        allocationsByPurpose[purpose] += totalAmount;
    }

    // === View Functions ===

    /**
     * @notice Get treasury balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get treasury statistics
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 balance,
            uint256 depositsTotal,
            uint256 withdrawalsTotal
        ) 
    {
        return (
            address(this).balance,
            totalDeposits,
            totalWithdrawals
        );
    }

    /**
     * @notice Get allocations for a specific purpose
     */
    function getAllocation(string memory purpose) 
        external 
        view 
        returns (uint256) 
    {
        return allocationsByPurpose[purpose];
    }

    // === Receive ETH ===
    receive() external payable {
        if (paused()) revert Errors.ContractPaused();
        totalDeposits += msg.value;
        deposits[msg.sender] += msg.value;

        emit Events.TreasuryDeposit(msg.sender, msg.value, "Direct Transfer", block.timestamp);
    }

    /**
     * @notice Pause treasury operations in emergencies
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause treasury operations
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Rescue ERC20 tokens accidentally sent to the treasury
     * @param token ERC20 token address
     * @param recipient Recipient of rescued tokens
     * @param amount Amount to rescue
     */
    function withdrawERC20(address token, address recipient, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();

        SafeERC20.safeTransfer(IERC20(token), recipient, amount);
    }
}