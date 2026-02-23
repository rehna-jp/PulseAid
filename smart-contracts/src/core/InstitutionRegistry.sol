// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IReclaim.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "../tokens/PATToken.sol";
import "./UserRegistry.sol";

/**
 * @title InstitutionRegistry
 * @notice Manages institution registration, verification, and reputation using ZK proofs
 * @dev Implements optimistic verification with challenge period and Reclaim Protocol integration
 */
contract InstitutionRegistry is AccessControl, ReentrancyGuard, Pausable {
    // === Constants ===
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    uint256 public constant VERIFICATION_STAKE = 0.05 ether; // ~$150 at $3000/ETH (update with oracle in production)
    uint256 public constant CHALLENGE_WINDOW = 7 days;
    uint256 public constant VOTING_PERIOD = 5 days;
    uint256 public constant INITIAL_REPUTATION = 1000;
    
    // Reputation thresholds
    uint256 public constant ELITE_THRESHOLD = 1500;
    uint256 public constant GOOD_THRESHOLD = 1000;
    uint256 public constant MODERATE_THRESHOLD = 500;
    uint256 public constant POOR_THRESHOLD = 100;

    // === Enums ===
    enum VerificationStatus {
        NotRegistered,
        Tentative,      // Optimistically approved, challenge period active
        Verified,       // Fully verified (challenge period passed or vote approved)
        Challenged,     // Under community review
        Rejected,       // Challenge successful
        Banned          // Fraudulent activity confirmed
    }

    enum ReputationTier {
        Banned,         // 0-99
        Poor,           // 100-499
        Moderate,       // 500-999
        Good,           // 1000-1499
        Elite           // 1500-2000
    }

    // === Structs ===
    struct Institution {
        string name;
        string category; // education, health, emergency, etc.
        string country;
        string website;
        bytes32 zkProofHash; // Hash of the ZK proof data
        VerificationStatus status;
        uint256 reputation;
        uint256 stakeAmount;
        uint256 registrationTime;
        uint256 challengeWindowEnd;
        uint256 successfulCampaigns;
        uint256 totalCampaigns;
        uint256 totalRaised;
        bool isActive;
    }

    struct Challenge {
        address challenger;
        address institution;
        string reason;
        uint256 startTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool resolved;
        bool approved; // true = institution approved, false = rejected
        mapping(address => bool) hasVoted;
    }

    // === State Variables ===
    IReclaim public reclaimProtocol;
    PATToken public patToken;
    UserRegistry public userRegistry; // v5.0: Role-based experience
    
    mapping(address => Institution) public institutions;
    mapping(uint256 => Challenge) public challenges;
    uint256 public challengeCounter;
    
    address[] public institutionList;
    mapping(address => bool) public isInstitution;

    // === Constructor ===
    constructor(
        address _reclaimProtocol,
        address _patToken,
        address _userRegistry,
        address admin
    ) {
        if (_reclaimProtocol == address(0) || _patToken == address(0) || 
            _userRegistry == address(0) || admin == address(0)) {
            revert Errors.ZeroAddress();
        }
        
        reclaimProtocol = IReclaim(_reclaimProtocol);
        patToken = PATToken(_patToken);
        userRegistry = UserRegistry(payable(_userRegistry));
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    // === Registration Functions ===

    /**
     * @notice Register as an institution with ZK proof verification
     * @param name Institution name
     * @param category Type of institution (education, health, etc.)
     * @param country Country of operation
     * @param website Institution website
     * @param zkProof Reclaim Protocol ZK proof of legitimacy
     */
    function registerInstitution(
        string memory name,
        string memory category,
        string memory country,
        string memory website,
        IReclaim.SignedClaim memory zkProof
    ) external payable nonReentrant whenNotPaused {
        if (isInstitution[msg.sender]) revert Errors.InstitutionAlreadyExists();
        if (msg.value != VERIFICATION_STAKE) revert Errors.InvalidStakeAmount();
        if (bytes(name).length == 0) revert Errors.InvalidParameter();
        
        // Verify ZK proof through Reclaim Protocol
        bool proofValid = reclaimProtocol.verifyProof(zkProof);
        if (!proofValid) revert Errors.InvalidZKProof();
        
        // Validate claim data can be extracted
        reclaimProtocol.extractClaimData(zkProof);
        
        // Store institution data
        Institution storage institution = institutions[msg.sender];
        institution.name = name;
        institution.category = category;
        institution.country = country;
        institution.website = website;
        institution.zkProofHash = keccak256(abi.encode(zkProof));
        institution.status = VerificationStatus.Tentative; // Optimistic approval
        institution.reputation = INITIAL_REPUTATION;
        institution.stakeAmount = msg.value;
        institution.registrationTime = block.timestamp;
        institution.challengeWindowEnd = block.timestamp + CHALLENGE_WINDOW;
        institution.isActive = true;
        
        isInstitution[msg.sender] = true;
        institutionList.push(msg.sender);
        
        emit Events.InstitutionRegistered(msg.sender, name, msg.value, block.timestamp);
        
        // Mint PAT tokens for verification (non-critical)
        try patToken.mintForVerification(msg.sender) {} catch {}

        // v5.0: Update UserRegistry for smart role detection
        // Wrapped in try/catch so a UserRegistry failure never blocks registration
        try userRegistry.markAsStaked(msg.sender) {} catch {}
    }

    /**
     * @notice Finalize verification after challenge window
     * @dev Can be called by anyone after challenge window expires
     */
    function finalizeVerification(address institution) external whenNotPaused {
        Institution storage inst = institutions[institution];
        
        if (inst.status != VerificationStatus.Tentative) {
            revert Errors.NotInTentativeStatus();
        }
        if (block.timestamp < inst.challengeWindowEnd) {
            revert Errors.ChallengeWindowActive();
        }
        
        inst.status = VerificationStatus.Verified;
        
        emit Events.InstitutionVerified(institution, true, block.timestamp);
    }

    // === Challenge Functions ===

    /**
     * @notice Challenge an institution's verification
     * @param institution Address of institution to challenge
     * @param reason Reason for challenge
     */
    function challengeVerification(address institution, string memory reason) 
        external 
        whenNotPaused 
    {
        Institution storage inst = institutions[institution];
        
        if (inst.status != VerificationStatus.Tentative) {
            revert Errors.NotInTentativeStatus();
        }
        if (block.timestamp >= inst.challengeWindowEnd) {
            revert Errors.ChallengeWindowExpired();
        }
        if (patToken.balanceOf(msg.sender) < 1000 * 10**18) {
            revert Errors.InsufficientVotingPower();
        }
        
        // Update institution status
        inst.status = VerificationStatus.Challenged;
        
        // Create challenge
        uint256 challengeId = challengeCounter++;
        Challenge storage challenge = challenges[challengeId];
        challenge.challenger = msg.sender;
        challenge.institution = institution;
        challenge.reason = reason;
        challenge.startTime = block.timestamp;
        
        emit Events.InstitutionChallenged(
            institution,
            msg.sender,
            reason,
            challengeId,
            block.timestamp
        );
    }

    /**
     * @notice Vote on a challenged institution
     * @param challengeId ID of the challenge
     * @param approve true to approve institution, false to reject
     */
    function voteOnChallenge(uint256 challengeId, bool approve) external whenNotPaused {
        Challenge storage challenge = challenges[challengeId];

        if (challenge.resolved) revert Errors.DisputeAlreadyResolved();
        if (challenge.hasVoted[msg.sender]) revert Errors.AlreadyVoted();
        if (block.timestamp >= challenge.startTime + VOTING_PERIOD) {
            revert Errors.VotingPeriodEnded();
        }

        uint256 votingPower = patToken.balanceOf(msg.sender);
        if (votingPower == 0) revert Errors.InsufficientVotingPower();

        challenge.hasVoted[msg.sender] = true;

        if (approve) {
            challenge.forVotes += votingPower;
        } else {
            challenge.againstVotes += votingPower;
        }

        // Mint tokens for voting participation (non-critical)
        try patToken.mintForVoting(msg.sender) {} catch {}
    }

    /**
     * @notice Resolve a challenge after voting period
     * @param challengeId ID of the challenge to resolve
     */
    function resolveChallenge(uint256 challengeId) external whenNotPaused {
        Challenge storage challenge = challenges[challengeId];

        if (challenge.resolved) revert Errors.DisputeAlreadyResolved();
        if (block.timestamp <= challenge.startTime + VOTING_PERIOD) {
            revert Errors.VotingPeriodNotEnded();
        }

        challenge.resolved = true;

        Institution storage inst = institutions[challenge.institution];

        // Determine outcome
        if (challenge.forVotes > challenge.againstVotes) {
            // Institution approved
            inst.status = VerificationStatus.Verified;
            challenge.approved = true;

            emit Events.InstitutionVerified(challenge.institution, true, block.timestamp);
        } else {
            // Institution rejected
            inst.status = VerificationStatus.Rejected;
            inst.isActive = false;
            challenge.approved = false;

            // Slash stake (50% to challenger, 50% to treasury)
            uint256 slashAmount = inst.stakeAmount;
            inst.stakeAmount = 0;

            if (slashAmount > 0) {
                (bool ok, ) = payable(challenge.challenger).call{value: slashAmount / 2}("");
                if (!ok) revert Errors.TransferFailed();
                // Other half stays in contract (treasury)
            }

            emit Events.StakeSlashed(
                challenge.institution,
                slashAmount,
                "Challenge Successful",
                block.timestamp
            );
            emit Events.InstitutionVerified(challenge.institution, false, block.timestamp);
        }
    }

    // === Reputation Management ===

    /**
     * @notice Update institution reputation (called by campaign contracts)
     * @param institution Address of institution
     * @param change Amount to change reputation (can be negative)
     * @param reason Reason for change
     */
    function updateReputation(
        address institution,
        int256 change,
        string memory reason
    ) external onlyRole(GOVERNANCE_ROLE) {
        Institution storage inst = institutions[institution];
        
        if (!isInstitution[institution]) revert Errors.InstitutionNotFound();
        
        if (change > 0) {
            inst.reputation += uint256(change);
            if (inst.reputation > 2000) inst.reputation = 2000; // Cap at 2000
        } else if (change < 0) {
            uint256 decrease = uint256(-change);
            if (decrease > inst.reputation) {
                inst.reputation = 0;
            } else {
                inst.reputation -= decrease;
            }
        }
        
        emit Events.ReputationUpdated(institution, change, inst.reputation, reason);
    }

    /**
     * @notice Record a successful campaign for an institution (called by CampaignFactory on completion)
     * @param institution Address of the institution
     * @param amountRaised Total ETH raised by the campaign (in wei)
     */
    function recordCampaignSuccess(
        address institution,
        uint256 amountRaised
    ) external onlyRole(GOVERNANCE_ROLE) {
        Institution storage inst = institutions[institution];
        if (!isInstitution[institution]) revert Errors.InstitutionNotFound();
        inst.totalCampaigns += 1;
        inst.successfulCampaigns += 1;
        inst.totalRaised += amountRaised;
    }

    /**
     * @notice Record a failed/cancelled campaign for an institution (does not count as successful)
     * @param institution Address of the institution
     */
    function recordCampaignFailure(address institution) external onlyRole(GOVERNANCE_ROLE) {
        Institution storage inst = institutions[institution];
        if (!isInstitution[institution]) revert Errors.InstitutionNotFound();
        inst.totalCampaigns += 1;
    }

    /**
     * @notice Ban an institution for fraud
     * @param institution Address to ban
     * @param reason Reason for ban
     */
    function banInstitution(address institution, string memory reason) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        Institution storage inst = institutions[institution];
        
        if (!isInstitution[institution]) revert Errors.InstitutionNotFound();
        
        inst.status = VerificationStatus.Banned;
        inst.reputation = 0;
        inst.isActive = false;
        
        // Slash entire stake
        uint256 slashAmount = inst.stakeAmount;
        inst.stakeAmount = 0;
        // Stake goes to treasury (stays in contract)
        
        emit Events.InstitutionBanned(institution, reason, block.timestamp);
        emit Events.StakeSlashed(institution, slashAmount, reason, block.timestamp);
    }

    /**
     * @notice Withdraw stake after verification or campaign completion
     * @dev Only available if institution is verified and has no active disputes
     */
    function withdrawStake() external whenNotPaused nonReentrant {
        Institution storage inst = institutions[msg.sender];
        
        if (!isInstitution[msg.sender]) revert Errors.InstitutionNotFound();
        if (inst.status != VerificationStatus.Verified) {
            revert Errors.InstitutionNotVerified();
        }
        if (inst.stakeAmount == 0) revert Errors.StakeAlreadyWithdrawn();
        
        uint256 amount = inst.stakeAmount;
        inst.stakeAmount = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert Errors.TransferFailed();
        
        emit Events.StakeWithdrawn(msg.sender, amount, block.timestamp);
    }

    // === View Functions ===

    /**
     * @notice Get institution details
     */
    function getInstitution(address institution) 
        external 
        view 
        returns (
            string memory name,
            string memory category,
            string memory country,
            VerificationStatus status,
            uint256 reputation,
            uint256 successfulCampaigns,
            uint256 totalCampaigns,
            uint256 totalRaised,
            bool isActive
        ) 
    {
        Institution storage inst = institutions[institution];
        return (
            inst.name,
            inst.category,
            inst.country,
            inst.status,
            inst.reputation,
            inst.successfulCampaigns,
            inst.totalCampaigns,
            inst.totalRaised,
            inst.isActive
        );
    }

    /**
     * @notice Get reputation tier for an institution
     */
    function getReputationTier(address institution) public view returns (ReputationTier) {
        uint256 rep = institutions[institution].reputation;
        
        if (rep >= ELITE_THRESHOLD) return ReputationTier.Elite;
        if (rep >= GOOD_THRESHOLD) return ReputationTier.Good;
        if (rep >= MODERATE_THRESHOLD) return ReputationTier.Moderate;
        if (rep >= POOR_THRESHOLD) return ReputationTier.Poor;
        return ReputationTier.Banned;
    }

    /**
     * @notice Check if institution can create campaigns
     */
    function canCreateCampaign(address institution) external view returns (bool) {
        Institution storage inst = institutions[institution];
        return inst.isActive && 
               (inst.status == VerificationStatus.Verified || 
                inst.status == VerificationStatus.Tentative);
    }

    /**
     * @notice Get all institutions (paginated)
     */
    function getInstitutions(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 length = institutionList.length;
        if (offset >= length) return new address[](0);
        
        uint256 end = offset + limit > length ? length : offset + limit;
        uint256 size = end - offset;
        
        address[] memory result = new address[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = institutionList[offset + i];
        }
        
        return result;
    }

    /**
     * @notice Get total number of institutions
     */
    function getTotalInstitutions() external view returns (uint256) {
        return institutionList.length;
    }

    // === Admin Functions ===

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Update Reclaim Protocol address (if needed)
     */
    function updateReclaimProtocol(address newReclaim) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        if (newReclaim == address(0)) revert Errors.ZeroAddress();
        reclaimProtocol = IReclaim(newReclaim);
    }

    // === Receive ETH ===
    receive() external payable {}
}