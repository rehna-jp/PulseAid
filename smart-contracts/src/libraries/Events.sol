// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Events
 * @notice Centralized event definitions for PulseAid platform
 */
library Events {
    // === Institution Registry Events ===
    event InstitutionRegistered(
        address indexed institution,
        string name,
        uint256 stakeAmount,
        uint256 timestamp
    );
    
    event InstitutionVerified(
        address indexed institution,
        bool isVerified,
        uint256 timestamp
    );
    
    event InstitutionChallenged(
        address indexed institution,
        address indexed challenger,
        string reason,
        uint256 challengeId,
        uint256 timestamp
    );
    
    event InstitutionBanned(
        address indexed institution,
        string reason,
        uint256 timestamp
    );
    
    event StakeSlashed(
        address indexed institution,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    event StakeWithdrawn(
        address indexed institution,
        uint256 amount,
        uint256 timestamp
    );
    
    event ReputationUpdated(
        address indexed institution,
        int256 change,
        uint256 newScore,
        string reason
    );

    // === Campaign Events ===
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed institution,
        string title,
        uint256 goal,
        uint256 deadline,
        uint256 timestamp
    );
    
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );
    
    event CampaignGoalReached(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 timestamp
    );
    
    event CampaignEnded(
        uint256 indexed campaignId,
        bool successful,
        uint256 totalRaised,
        uint256 timestamp
    );
    
    event CampaignCancelled(
        uint256 indexed campaignId,
        string reason,
        uint256 timestamp
    );
    
    event StakeCut(
        uint256 indexed campaignId,
        uint256 amount,
        uint256 timestamp
    );

    // === Proof Validation Events ===
    event ProofSubmitted(
        uint256 indexed campaignId,
        string ipfsHash,
        uint256 timestamp
    );
    
    event ProofValidated(
        uint256 indexed campaignId,
        bool isValid,
        bool autoApproved,
        uint256 timestamp
    );
    
    event ProofChallenged(
        uint256 indexed campaignId,
        address indexed challenger,
        string reason,
        uint256 disputeId,
        uint256 timestamp
    );
    
    event ProofDisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed campaignId,
        bool approved,
        uint256 timestamp
    );

    event ProofFinalized(
        uint256 indexed campaignId,
        bool approved,
        uint256 timestamp
    );

    // === Escrow Events ===
    event FundsLocked(
        uint256 indexed campaignId,
        uint256 amount,
        uint256 timestamp
    );
    
    event FundsReleased(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event FundsRefunded(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );

    // === Governance Events ===
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 votingEnds,
        uint256 timestamp
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight,
        uint256 timestamp
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success,
        uint256 timestamp
    );
    
    event DisputeVoteCast(
        uint256 indexed disputeId,
        address indexed voter,
        bool approve,
        uint256 weight,
        uint256 timestamp
    );

    // === Token Events ===
    event TokensMinted(
        address indexed recipient,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    event RewardClaimed(
        address indexed user,
        uint256 amount,
        string rewardType,
        uint256 timestamp
    );

    // === Treasury Events ===
    event TreasuryDeposit(
        address indexed from,
        uint256 amount,
        string source,
        uint256 timestamp
    );
    
    event TreasuryWithdrawal(
        address indexed to,
        uint256 amount,
        string purpose,
        uint256 timestamp
    );

    // === System Events ===
    event PlatformPaused(uint256 timestamp);
    event PlatformUnpaused(uint256 timestamp);
    event EmergencyWithdrawal(address indexed token, uint256 amount, uint256 timestamp);
}