// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";

/**
 * @title PATToken
 * @notice PulseAid Token (PAT) - Governance token for the PulseAid platform
 * @dev Fixed supply of 100M tokens with controlled minting based on platform actions
 */
contract PATToken is ERC20, AccessControl, Pausable {
    // === Constants ===
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    uint256 public constant TOKENS_PER_DOLLAR = 1 * 10**18; // 1 PAT per $1 donated
    uint256 public constant VOTE_REWARD = 10 * 10**18; // 10 PAT per vote
    uint256 public constant ACCURATE_VOTE_REWARD = 50 * 10**18; // 50 PAT for accurate votes
    uint256 public constant VERIFICATION_REWARD = 100 * 10**18; // 100 PAT for verification
    uint256 public constant CAMPAIGN_COMPLETION_REWARD = 100 * 10**18; // 100 PAT for campaign completion

    // === State Variables ===
    uint256 public totalMinted;
    
    // Tracking for users
    mapping(address => uint256) public totalEarned;
    mapping(address => uint256) public donationTokens;
    mapping(address => uint256) public votingTokens;
    mapping(address => uint256) public campaignTokens;

    // === Constructor ===
    constructor(address admin) ERC20("PulseAid Token", "PAT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // === Minting Functions ===

    /**
     * @notice Mint tokens for donation (1 PAT per $1)
     * @param donor Address receiving tokens
     * @param dollarAmount Amount donated in dollars (in wei, e.g., $100 = 100 * 10^18)
     */
    function mintForDonation(address donor, uint256 dollarAmount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        if (donor == address(0)) revert Errors.ZeroAddress();
        
        uint256 amount = (dollarAmount * TOKENS_PER_DOLLAR) / 10**18;
        _mintTokens(donor, amount, "Donation Reward");
        
        donationTokens[donor] += amount;
    }

    /**
     * @notice Mint tokens for voting participation
     * @param voter Address of the voter
     */
    function mintForVoting(address voter) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        if (voter == address(0)) revert Errors.ZeroAddress();
        
        _mintTokens(voter, VOTE_REWARD, "Voting Participation");
        votingTokens[voter] += VOTE_REWARD;
    }

    /**
     * @notice Mint tokens for accurate voting (voting with majority)
     * @param voter Address of the voter
     */
    function mintForAccurateVote(address voter) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        if (voter == address(0)) revert Errors.ZeroAddress();
        
        _mintTokens(voter, ACCURATE_VOTE_REWARD, "Accurate Vote Reward");
        votingTokens[voter] += ACCURATE_VOTE_REWARD;
    }

    /**
     * @notice Mint tokens for institution verification
     * @param institution Address of verified institution
     */
    function mintForVerification(address institution) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        if (institution == address(0)) revert Errors.ZeroAddress();
        
        _mintTokens(institution, VERIFICATION_REWARD, "Verification Reward");
    }

    /**
     * @notice Mint tokens for campaign completion
     * @param institution Address of institution that completed campaign
     */
    function mintForCampaignCompletion(address institution) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        if (institution == address(0)) revert Errors.ZeroAddress();
        
        _mintTokens(institution, CAMPAIGN_COMPLETION_REWARD, "Campaign Completion");
        campaignTokens[institution] += CAMPAIGN_COMPLETION_REWARD;
    }

    /**
     * @notice Custom mint function for special rewards
     * @param recipient Address receiving tokens
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting
     */
    function mintCustomReward(address recipient, uint256 amount, string memory reason) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenNotPaused 
    {
        if (recipient == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidMintAmount();
        
        _mintTokens(recipient, amount, reason);
    }

    // === Internal Functions ===

    /**
     * @notice Internal function to mint tokens with supply cap check
     */
    function _mintTokens(address recipient, uint256 amount, string memory reason) internal {
        if (totalMinted + amount > MAX_SUPPLY) revert Errors.MintCapExceeded();
        
        _mint(recipient, amount);
        totalMinted += amount;
        totalEarned[recipient] += amount;
        
        emit Events.TokensMinted(recipient, amount, reason, block.timestamp);
    }

    // === View Functions ===

    /**
     * @notice Get comprehensive token statistics for an address
     */
    function getUserTokenStats(address user) 
        external 
        view 
        returns (
            uint256 balance,
            uint256 earned,
            uint256 fromDonations,
            uint256 fromVoting,
            uint256 fromCampaigns
        ) 
    {
        return (
            balanceOf(user),
            totalEarned[user],
            donationTokens[user],
            votingTokens[user],
            campaignTokens[user]
        );
    }

    /**
     * @notice Get remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }

    // === Admin Functions ===

    /**
     * @notice Pause token transfers (emergency)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit Events.PlatformPaused(block.timestamp);
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit Events.PlatformUnpaused(block.timestamp);
    }

    // === Overrides ===

    /**
     * @notice Override transfer to add pause functionality
     */
    function _update(address from, address to, uint256 value) internal override(ERC20) whenNotPaused { super._update(from, to, value); }
}