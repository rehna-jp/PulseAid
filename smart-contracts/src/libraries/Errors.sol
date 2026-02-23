// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Errors
 * @notice Centralized error definitions for PulseAid platform
 */
library Errors {
    // === Institution Registry Errors ===
    error InstitutionAlreadyExists();
    error InstitutionNotFound();
    error InstitutionNotVerified();
    error InstitutionBanned();
    error InvalidStakeAmount();
    error InsufficientStake();
    error StakeAlreadyWithdrawn();
    error InvalidZKProof();
    error ChallengeWindowActive();
    error ChallengeWindowExpired();
    error NotInTentativeStatus();
    error AlreadyChallenged();
    error InvalidChallengeReason();

    // === Campaign Errors ===
    error CampaignNotFound();
    error CampaignNotActive();
    error CampaignAlreadyEnded();
    error CampaignGoalReached();
    error DeadlinePassed();
    error DeadlineNotReached();
    error InvalidCampaignGoal();
    error InvalidDeadline();
    error UnauthorizedCampaignCreator();
    error CampaignStillActive();
    error GoalNotReached();

    // === Escrow Errors ===
    error InsufficientBalance();
    error InvalidWithdrawalAmount();
    error FundsAlreadyReleased();
    error FundsNotReleased();
    error FundsLocked();
    error RefundNotAvailable();
    error InvalidRecipient();

    // === Proof Validation Errors ===
    error ProofAlreadySubmitted();
    error ProofNotSubmitted();
    error InvalidProofData();
    error ProofValidationFailed();
    error ChallengeNotAllowed();
    error DisputeAlreadyResolved();
    error DisputeNotResolved();
    error InvalidIPFSHash();

    // === Governance Errors ===
    error InsufficientVotingPower();
    error ProposalNotActive();
    error ProposalAlreadyExecuted();
    error ProposalExecutionFailed();
    error VotingPeriodNotEnded();
    error VotingPeriodEnded();
    error QuorumNotReached();
    error AlreadyVoted();
    error RewardAlreadyClaimed();
    error InvalidVoteType();

    // === Token Errors ===
    error MintCapExceeded();
    error InvalidMintAmount();
    error TransferNotAllowed();
    error InsufficientTokenBalance();

    // === Treasury Errors ===
    error UnauthorizedWithdrawal();
    error InvalidTreasuryOperation();
    error InsufficientTreasuryFunds();

    // === General Errors ===
    error Unauthorized();
    error ZeroAddress();
    error InvalidAmount();
    error TransferFailed();
    error ContractPaused();
    error InvalidParameter();
    error ArrayLengthMismatch();
}