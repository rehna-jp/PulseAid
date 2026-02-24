// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "./EscrowManager.sol";
import "./CampaignFactory.sol";
import "./InstitutionRegistry.sol";
import "../tokens/PATToken.sol";
import "../tokens/DonationNFT.sol";

/**
 * @title ProofValidator
 * @notice Manages proof submission, validation, and dispute resolution
 * @dev Implements auto-validation with 48h challenge period.
 *      Voters claim rewards individually (pull pattern) to keep gas bounded.
 */
contract ProofValidator is AccessControl, ReentrancyGuard, Pausable {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    uint256 public constant CHALLENGE_PERIOD      = 48 hours;
    uint256 public constant DISPUTE_VOTING_PERIOD = 5 days;
    uint256 public constant STORAGE_FEE           = 0.00001 ether;
    uint256 public constant MIN_CHALLENGE_STAKE   = 1_000 * 10**18;

    enum ProofStatus { NotSubmitted, Submitted, AutoValidated, Challenged, Approved, Rejected }

    struct Proof {
        uint256     campaignId;
        address     institution;
        string      ipfsHash;
        string      receiptsHash;
        string      photosHash;
        string      metricsHash;
        uint256     submittedAt;
        uint256     challengePeriodEnd;
        ProofStatus status;
        bool        autoValidationPassed;
        uint256     disputeId;
    }

    struct Dispute {
        uint256 campaignId;
        address challenger;
        string  reason;
        uint256 startTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool    resolved;
        bool    approved;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice;
        mapping(address => bool) rewardClaimed;
    }

    EscrowManager       public escrowManager;
    CampaignFactory     public campaignFactory;
    InstitutionRegistry public institutionRegistry;
    PATToken            public patToken;
    DonationNFT         public donationNFT;
    address             public treasury;

    mapping(uint256 => Proof)   public proofs;
    mapping(uint256 => Dispute) public disputes;
    uint256 public disputeCounter;
    // Sentinel: track whether proof dispute was internally created to avoid ID-0 slot collision
    mapping(uint256 => bool) public internalDisputeCreated;

    event VoterRewardAvailable(uint256 indexed disputeId, bool winningVote, uint256 timestamp);
    event VoterRewardClaimed(uint256 indexed disputeId, address indexed voter, uint256 amount, uint256 timestamp);

    constructor(
        address _escrowManager,
        address _campaignFactory,
        address _institutionRegistry,
        address _patToken,
        address _donationNFT,
        address _treasury,
        address admin
    ) {
        if (_escrowManager == address(0) || _campaignFactory == address(0) ||
            _institutionRegistry == address(0) || _patToken == address(0) ||
            _donationNFT == address(0) || _treasury == address(0) || admin == address(0))
            revert Errors.ZeroAddress();

        escrowManager       = EscrowManager(payable(_escrowManager));
        campaignFactory     = CampaignFactory(payable(_campaignFactory));
        institutionRegistry = InstitutionRegistry(payable(_institutionRegistry));
        patToken            = PATToken(_patToken);
        donationNFT         = DonationNFT(_donationNFT);
        treasury            = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    // ── Proof Submission ─────────────────────────────────────────────────────

    function submitProof(
        uint256 campaignId,
        string memory ipfsHash,
        string memory receiptsHash,
        string memory photosHash,
        string memory metricsHash
    ) external payable nonReentrant whenNotPaused {
        (address institution,,,,,,,CampaignFactory.CampaignStatus status) = 
            campaignFactory.getCampaign(campaignId);

        if (institution != msg.sender)                              revert Errors.UnauthorizedCampaignCreator();
        if (status != CampaignFactory.CampaignStatus.Ended)        revert Errors.CampaignNotActive();
        if (proofs[campaignId].status != ProofStatus.NotSubmitted)  revert Errors.ProofAlreadySubmitted();
        if (msg.value < STORAGE_FEE)                               revert Errors.InvalidAmount();
        if (bytes(ipfsHash).length == 0)                           revert Errors.InvalidIPFSHash();

        Proof storage proof          = proofs[campaignId];
        proof.campaignId             = campaignId;
        proof.institution            = msg.sender;
        proof.ipfsHash               = ipfsHash;
        proof.receiptsHash           = receiptsHash;
        proof.photosHash             = photosHash;
        proof.metricsHash            = metricsHash;
        proof.submittedAt            = block.timestamp;
        proof.challengePeriodEnd     = block.timestamp + CHALLENGE_PERIOD;
        proof.status                 = ProofStatus.Submitted;

        (bool ok,) = payable(treasury).call{value: msg.value}("");
        if (!ok) revert Errors.TransferFailed();

        emit Events.ProofSubmitted(campaignId, ipfsHash, block.timestamp);
        _autoValidateProof(campaignId);
    }

    function _autoValidateProof(uint256 campaignId) internal {
        Proof storage proof = proofs[campaignId];
        bool hasReceipts = bytes(proof.receiptsHash).length > 0;
        bool hasPhotos   = bytes(proof.photosHash).length   > 0;
        bool hasMetrics  = bytes(proof.metricsHash).length  > 0;

        // Basic validation: ensure all components are present
        if (hasReceipts && hasPhotos && hasMetrics) {
            proof.autoValidationPassed = true;
            proof.status               = ProofStatus.AutoValidated;
            emit Events.ProofValidated(campaignId, true,  true,  block.timestamp);
        } else {
            proof.autoValidationPassed = false;
            // status remains Submitted, but autoValidationPassed is false
            emit Events.ProofValidated(campaignId, false, false, block.timestamp);
        }
    }

    function finalizeProof(uint256 campaignId) external nonReentrant whenNotPaused {
        Proof storage proof = proofs[campaignId];
        if (proof.status != ProofStatus.AutoValidated && proof.status != ProofStatus.Submitted)
            revert Errors.InvalidProofData();
        if (block.timestamp < proof.challengePeriodEnd)
            revert Errors.ChallengeWindowActive();

        if (proof.autoValidationPassed && proof.status != ProofStatus.Challenged) {
            proof.status = ProofStatus.Approved;
            _releaseFunds(campaignId);
        } else if (proof.status != ProofStatus.Challenged) {
            // If auto-validation failed and it wasn't challenged, it still needs manual/DAO resolution
            // but for now, we mark as Challenged to force a vote or governance action
            proof.status = ProofStatus.Challenged;
            // Create a default "Auto-validation failed" dispute if none exists
        // Create internal dispute only once per proof (guard using campaign-scoped flag)
            if (!internalDisputeCreated[campaignId]) {
                internalDisputeCreated[campaignId] = true;
                 _createInternalDispute(campaignId, "Auto-validation failed: Missing components");
            }
        }
    }

    // ── Challenge & Dispute ───────────────────────────────────────────────────

    function _createInternalDispute(uint256 campaignId, string memory reason) internal {
        Proof storage proof = proofs[campaignId];
        uint256 disputeId = disputeCounter++;
        proof.disputeId   = disputeId;

        Dispute storage d = disputes[disputeId];
        d.campaignId = campaignId;
        d.challenger = address(this); // Internal challenge
        d.reason     = reason;
        d.startTime  = block.timestamp;

        emit Events.ProofChallenged(campaignId, address(this), reason, disputeId, block.timestamp);
    }

    function challengeProof(uint256 campaignId, string memory reason) external whenNotPaused {
        Proof storage proof = proofs[campaignId];
        if (proof.status != ProofStatus.Submitted && proof.status != ProofStatus.AutoValidated)
            revert Errors.ProofNotSubmitted();
        if (block.timestamp >= proof.challengePeriodEnd)                revert Errors.ChallengeWindowExpired();
        if (patToken.balanceOf(msg.sender) < MIN_CHALLENGE_STAKE)       revert Errors.InsufficientVotingPower();

        proof.status = ProofStatus.Challenged;

        uint256 disputeId = disputeCounter++;
        proof.disputeId   = disputeId;

        Dispute storage d = disputes[disputeId];
        d.campaignId = campaignId;
        d.challenger = msg.sender;
        d.reason     = reason;
        d.startTime  = block.timestamp;

        emit Events.ProofChallenged(campaignId, msg.sender, reason, disputeId, block.timestamp);
    }

    function voteOnDispute(uint256 disputeId, bool approve) external whenNotPaused {
        Dispute storage d = disputes[disputeId];
        if (d.resolved)                                              revert Errors.DisputeAlreadyResolved();
        if (d.hasVoted[msg.sender])                                  revert Errors.AlreadyVoted();
        if (block.timestamp >= d.startTime + DISPUTE_VOTING_PERIOD)  revert Errors.VotingPeriodEnded();

        // v5.0: Reputation-weighted voting
        uint256 power = patToken.balanceOf(msg.sender);
        if (power == 0) revert Errors.InsufficientVotingPower();

        // Elite status multiplier (2x)
        if (institutionRegistry.getReputationTier(msg.sender) == InstitutionRegistry.ReputationTier.Elite) {
            power *= 2;
        }

        d.hasVoted[msg.sender]   = true;
        d.voteChoice[msg.sender] = approve;

        if (approve) d.forVotes     += power;
        else         d.againstVotes += power;

        emit Events.DisputeVoteCast(disputeId, msg.sender, approve, power, block.timestamp);
        try patToken.mintForVoting(msg.sender) {} catch {}
    }

    function resolveDispute(uint256 disputeId) external nonReentrant whenNotPaused {
        Dispute storage d = disputes[disputeId];
        if (d.resolved) revert Errors.DisputeAlreadyResolved();
        if (block.timestamp <= d.startTime + DISPUTE_VOTING_PERIOD) revert Errors.VotingPeriodNotEnded();

        d.resolved = true;
        bool approved = d.forVotes > d.againstVotes;
        d.approved = approved;

        uint256 campaignId = d.campaignId;
        proofs[campaignId].status = approved ? ProofStatus.Approved : ProofStatus.Rejected;

        if (approved) { 
            _releaseFunds(campaignId);  
            _rewardVoters(disputeId, true);  
        } else {          
            _handleRejection(campaignId); 
            _rewardVoters(disputeId, false); 
        }

        emit Events.ProofDisputeResolved(disputeId, campaignId, approved, block.timestamp);
    }

    /**
     * @notice Emit event signalling reward is available — voters pull via claimVotingReward()
     */
    function _rewardVoters(uint256 disputeId, bool winningVote) internal {
        emit VoterRewardAvailable(disputeId, winningVote, block.timestamp);
    }

    /**
     * @notice Voters on the winning side claim their accurate-vote bonus here
     */
    function claimVotingReward(uint256 disputeId) external nonReentrant whenNotPaused {
        Dispute storage d = disputes[disputeId];
        if (!d.resolved)                             revert Errors.DisputeNotResolved();
        if (!d.hasVoted[msg.sender])                  revert Errors.Unauthorized();
        if (d.rewardClaimed[msg.sender])              revert Errors.RewardAlreadyClaimed();
        if (d.voteChoice[msg.sender] != d.approved)   revert Errors.Unauthorized();

        uint256 rewardAmount = patToken.ACCURATE_VOTE_REWARD();
        try patToken.mintForAccurateVote(msg.sender) {
            d.rewardClaimed[msg.sender] = true;
            emit VoterRewardClaimed(disputeId, msg.sender, rewardAmount, block.timestamp);
        } catch {
            revert Errors.TransferFailed();
        }
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────

    function _releaseFunds(uint256 campaignId) internal {
        Proof storage proof = proofs[campaignId];
        
        // 1. Release funds in EscrowManager
        escrowManager.releaseFunds(campaignId, proof.institution);
        
        // 2. Mark campaign as completed in Factory (updates reputation + institution stats)
        campaignFactory.completeCampaign(campaignId);

        // 3. Mint DonationNFT receipts for all campaign donors
        //    Fetching the donor list + amounts from CampaignFactory then batch-minting.
        //    Wrapped in try/catch so an NFT failure never blocks fund release.
        try campaignFactory.getCampaignDonationData(campaignId) returns (
            address[] memory donors,
            uint256[] memory amounts,
            string memory title
        ) {
            if (donors.length > 0) {
                // Prepare dummy timestamps (since CampaignFactory doesn't store them per-donor yet)
                uint256[] memory timestamps = new uint256[](donors.length);
                for (uint256 i = 0; i < donors.length; i++) {
                    timestamps[i] = proof.submittedAt;
                }
                
                try donationNFT.batchMintReceipts(
                    campaignId,
                    donors,
                    amounts,
                    timestamps,
                    title,
                    proof.ipfsHash
                ) {} catch {}
            }
        } catch {}

        emit Events.ProofFinalized(campaignId, true, block.timestamp);
    }

    function _handleRejection(uint256 campaignId) internal {
        Proof storage proof = proofs[campaignId];

        // 1. Enable refunds in EscrowManager
        escrowManager.enableRefunds(campaignId);

        // 2. Slash institution reputation
        institutionRegistry.updateReputation(
            proof.institution,
            -200,
            "Proof rejected - fraudulent or insufficient impact evidence"
        );

        emit Events.ProofFinalized(campaignId, false, block.timestamp);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    function getProof(uint256 campaignId)
        external view
        returns (
            address institution, string memory ipfsHash,
            string memory receiptsHash, string memory photosHash,
            ProofStatus status, bool autoValidationPassed,
            uint256 submittedAt, uint256 challengePeriodEnd
        )
    {
        Proof storage p = proofs[campaignId];
        return (p.institution, p.ipfsHash, p.receiptsHash, p.photosHash,
                p.status, p.autoValidationPassed, p.submittedAt, p.challengePeriodEnd);
    }

    function getDispute(uint256 disputeId)
        external view
        returns (
            uint256 campaignId, address challenger, string memory reason,
            uint256 forVotes, uint256 againstVotes, bool resolved, bool approved
        )
    {
        Dispute storage d = disputes[disputeId];
        return (d.campaignId, d.challenger, d.reason, d.forVotes, d.againstVotes, d.resolved, d.approved);
    }

    function hasVoted(uint256 disputeId, address voter)         external view returns (bool) { return disputes[disputeId].hasVoted[voter]; }
    function hasClaimedReward(uint256 disputeId, address voter) external view returns (bool) { return disputes[disputeId].rewardClaimed[voter]; }

    // ── Admin ────────────────────────────────────────────────────────────────

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function updateTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert Errors.ZeroAddress();
        treasury = newTreasury;
    }

    receive() external payable {}
}