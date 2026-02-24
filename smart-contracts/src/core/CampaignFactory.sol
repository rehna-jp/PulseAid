// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "./InstitutionRegistry.sol";
import "./EscrowManager.sol";
import "./UserRegistry.sol";
import "../tokens/PATToken.sol";

/**
 * @title CampaignFactory
 * @notice Creates and manages fundraising campaigns for verified institutions
 */
contract CampaignFactory is AccessControl, ReentrancyGuard, Pausable {
    // === Constants ===
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    uint256 public constant CAMPAIGN_STAKE = 0.000025 ether; // ~$75-100
    uint256 public constant MIN_CAMPAIGN_DURATION = 7 days;
    uint256 public constant MAX_CAMPAIGN_DURATION = 180 days;
    uint256 public constant MIN_GOAL = 0.00001 ether; // ~$30
    uint256 public constant MAX_GOAL = 100 ether; // ~$300,000

    // === Enums ===
    enum CampaignStatus {
        Active,
        GoalReached,
        Ended,
        Cancelled,
        Completed  // After proof approved and funds released
    }

    // === Structs ===
    struct Campaign {
        uint256 id;
        address institution;
        string title;
        string description;
        string category; // education, health, emergency, etc.
        string ipfsMetadata; // Detailed campaign info on IPFS
        uint256 goal;
        uint256 deadline;
        uint256 raised;
        uint256 stakeAmount;
        uint256 createdAt;
        CampaignStatus status;
        bool fundsReleased;
        uint256 donorCount;
    }

    // === State Variables ===
    InstitutionRegistry public institutionRegistry;
    EscrowManager public escrowManager;
    PATToken public patToken;
    UserRegistry public userRegistry; // v5.0: Role-based experience
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => address[]) public campaignDonors;
    mapping(uint256 => mapping(address => uint256)) public donations; // campaignId => donor => amount
    
    uint256 public campaignCounter;
    uint256[] public activeCampaignIds;
    mapping(uint256 => uint256) public campaignActiveIndex; // campaignId => index in activeCampaignIds
    mapping(address => uint256[]) public institutionCampaigns;
    
    uint256 public totalPlatformRaised;

    // === Constructor ===
    constructor(
        address _institutionRegistry,
        address _escrowManager,
        address _patToken,
        address _userRegistry,
        address admin
    ) {
        if (_institutionRegistry == address(0) || 
            _escrowManager == address(0) || 
            _patToken == address(0) ||
            _userRegistry == address(0) ||
            admin == address(0)) {
            revert Errors.ZeroAddress();
        }
        
        institutionRegistry = InstitutionRegistry(payable(_institutionRegistry));
        escrowManager = EscrowManager(payable(_escrowManager));
        patToken = PATToken(_patToken);
        userRegistry = UserRegistry(_userRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    // === Campaign Creation ===

    /**
     * @notice Create a new fundraising campaign
     * @param title Campaign title
     * @param description Short description
     * @param category Campaign category
     * @param ipfsMetadata IPFS hash with detailed info
     * @param goal Fundraising goal in wei
     * @param duration Campaign duration in seconds
     */
    function createCampaign(
        string memory title,
        string memory description,
        string memory category,
        string memory ipfsMetadata,
        uint256 goal,
        uint256 duration
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        // Validation
        if (!institutionRegistry.canCreateCampaign(msg.sender)) {
            revert Errors.InstitutionNotVerified();
        }
        if (msg.value != CAMPAIGN_STAKE) revert Errors.InvalidStakeAmount();
        if (goal < MIN_GOAL || goal > MAX_GOAL) revert Errors.InvalidCampaignGoal();
        if (duration < MIN_CAMPAIGN_DURATION || duration > MAX_CAMPAIGN_DURATION) {
            revert Errors.InvalidDeadline();
        }
        if (bytes(title).length == 0 || bytes(description).length == 0) {
            revert Errors.InvalidParameter();
        }
        
        uint256 campaignId = campaignCounter++;
        uint256 deadline = block.timestamp + duration;
        
        Campaign storage campaign = campaigns[campaignId];
        campaign.id = campaignId;
        campaign.institution = msg.sender;
        campaign.title = title;
        campaign.description = description;
        campaign.category = category;
        campaign.ipfsMetadata = ipfsMetadata;
        campaign.goal = goal;
        campaign.deadline = deadline;
        campaign.stakeAmount = msg.value;
        campaign.status = CampaignStatus.Active;
        campaign.createdAt = block.timestamp;
        
        activeCampaignIds.push(campaignId);
        campaignActiveIndex[campaignId] = activeCampaignIds.length - 1;
        institutionCampaigns[msg.sender].push(campaignId);
        
        emit Events.CampaignCreated(
            campaignId,
            msg.sender,
            title,
            goal,
            deadline,
            block.timestamp
        );
        
        return campaignId;
    }

    // === Donation Functions ===

    /**
     * @notice Donate to a campaign
     * @param campaignId ID of the campaign
     */
    function donate(uint256 campaignId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Campaign storage campaign = campaigns[campaignId];
        
        if (campaign.id != campaignId) revert Errors.CampaignNotFound();
        if (campaign.status != CampaignStatus.Active && 
            campaign.status != CampaignStatus.GoalReached) {
            revert Errors.CampaignNotActive();
        }
        if (block.timestamp > campaign.deadline) revert Errors.DeadlinePassed();
        if (msg.value == 0) revert Errors.InvalidAmount();
        
        // Record donation
        if (donations[campaignId][msg.sender] == 0) {
            campaign.donorCount++;
            campaignDonors[campaignId].push(msg.sender);
        }
        
        donations[campaignId][msg.sender] += msg.value;
        campaign.raised += msg.value;
        
        // Transfer to escrow
        escrowManager.lockFunds{value: msg.value}(campaignId, msg.sender);
        
        emit Events.DonationReceived(campaignId, msg.sender, msg.value, block.timestamp);
        
        totalPlatformRaised += msg.value;
        
        // Check if goal reached
        if (campaign.raised >= campaign.goal && 
            campaign.status == CampaignStatus.Active) {
            campaign.status = CampaignStatus.GoalReached;
            emit Events.CampaignGoalReached(campaignId, campaign.raised, block.timestamp);
        }
        
        // Mint PAT tokens for donor (1 PAT per $1, assuming 1 ETH = $3000).
        // dollarAmount must be expressed in 10^18 units (i.e. $1 = 1e18).
        // msg.value is in wei (1 ETH = 1e18 wei), so:
        //   dollarAmount = (msg.value * 3000 * 1e18) / 1e18 = msg.value * 3000
        // But mintForDonation divides by 1e18, so we must keep the full 1e18 scale:
        //   dollarAmount = msg.value * 3000  (already in the 1e18-scaled dollar unit)
        // Note: In production, replace 3000 with a Chainlink oracle price feed.
        uint256 dollarAmount = (msg.value * 3000); // scaled: 1 ETH => 3000 * 1e18 "dollar units"
        try patToken.mintForDonation(msg.sender, dollarAmount) {} catch {}

        // v5.0: Update UserRegistry for smart role detection
        // Wrapped in try/catch so a UserRegistry failure never blocks donations
        try userRegistry.markAsDonated(msg.sender) {} catch {}
    }

    // === Campaign Management ===

    /**
     * @notice End a campaign (callable by anyone after deadline)
     * @param campaignId ID of the campaign
     */
    function endCampaign(uint256 campaignId) external whenNotPaused {
        Campaign storage campaign = campaigns[campaignId];
        
        if (campaign.institution == address(0)) revert Errors.CampaignNotFound();
        if (campaign.status == CampaignStatus.Ended || 
            campaign.status == CampaignStatus.Cancelled ||
            campaign.status == CampaignStatus.Completed) {
            revert Errors.CampaignAlreadyEnded();
        }
        if (block.timestamp < campaign.deadline) revert Errors.DeadlineNotReached();
        
        bool successful = campaign.raised >= campaign.goal;
        campaign.status = CampaignStatus.Ended;
        
        // Remove from active campaigns
        _removeFromActiveCampaigns(campaignId);
        
        emit Events.CampaignEnded(campaignId, successful, campaign.raised, block.timestamp);
        
        // If not successful, enable refunds
        if (!successful) {
            escrowManager.enableRefunds(campaignId);
        }
    }

    /**
     * @notice Cancel a campaign (only by institution, before deadline)
     * @param campaignId ID of the campaign
     * @param reason Reason for cancellation
     */
    function cancelCampaign(uint256 campaignId, string memory reason) external {
        Campaign storage campaign = campaigns[campaignId];
        
        if (campaign.institution != msg.sender) revert Errors.UnauthorizedCampaignCreator();
        if (campaign.status != CampaignStatus.Active) revert Errors.CampaignNotActive();
        
        campaign.status = CampaignStatus.Cancelled;
        
        // Enable refunds
        escrowManager.enableRefunds(campaignId);
        
        // Slash 50% of stake for cancellation
        uint256 slashAmount = campaign.stakeAmount / 2;
        campaign.stakeAmount -= slashAmount;
        // Slashed amount stays in contract (treasury)
        emit Events.StakeCut(campaignId, slashAmount, block.timestamp);
        
        // Reduce reputation
        institutionRegistry.updateReputation(
            msg.sender,
            -100,
            "Campaign Cancelled"
        );
        
        _removeFromActiveCampaigns(campaignId);
        
        emit Events.CampaignCancelled(campaignId, reason, block.timestamp);
    }

    /**
     * @notice Mark campaign as completed after funds released
     * @param campaignId ID of the campaign
     */
    function completeCampaign(uint256 campaignId) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        Campaign storage campaign = campaigns[campaignId];
        
        if (campaign.status != CampaignStatus.Ended) revert Errors.CampaignNotActive();
        if (!escrowManager.areFundsReleased(campaignId)) revert Errors.FundsNotReleased();
        
        campaign.status = CampaignStatus.Completed;
        
        // Return stake to institution
        uint256 stakeAmount = campaign.stakeAmount;
        campaign.stakeAmount = 0;
        (bool ok,) = payable(campaign.institution).call{value: stakeAmount}("");
        if (!ok) revert Errors.TransferFailed();
        
        // Update reputation
        institutionRegistry.updateReputation(
            campaign.institution,
            50,
            "Campaign Completed Successfully"
        );

        // Update institution's campaign statistics in InstitutionRegistry
        try institutionRegistry.recordCampaignSuccess(
            campaign.institution,
            campaign.raised
        ) {} catch {}
        
        // Mint completion reward
        patToken.mintForCampaignCompletion(campaign.institution);
    }

    // === View Functions ===

    /**
     * @notice Get campaign details
     */
    function getCampaign(uint256 campaignId) 
        external 
        view 
        returns (
            address institution,
            string memory title,
            string memory description,
            string memory category,
            uint256 goal,
            uint256 raised,
            uint256 deadline,
            CampaignStatus status
        ) 
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.institution,
            campaign.title,
            campaign.description,
            campaign.category,
            campaign.goal,
            campaign.raised,
            campaign.deadline,
            campaign.status
        );
    }

    /**
     * @notice Get campaign donors
     */
    function getCampaignDonors(uint256 campaignId) 
        external 
        view 
        returns (address[] memory) 
    {
        return campaignDonors[campaignId];
    }

    /**
     * @notice Get donation amount for a specific donor
     */
    function getDonationAmount(uint256 campaignId, address donor) 
        external 
        view 
        returns (uint256) 
    {
        return donations[campaignId][donor];
    }

    /**
     * @notice Get all campaigns for an institution
     */
    function getInstitutionCampaigns(address institution) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return institutionCampaigns[institution];
    }

    /**
     * @notice Get active campaigns (paginated)
     */
    function getActiveCampaigns(uint256 offset, uint256 limit) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 length = activeCampaignIds.length;
        if (offset >= length) return new uint256[](0);
        
        uint256 end = offset + limit > length ? length : offset + limit;
        uint256 size = end - offset;
        
        uint256[] memory result = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = activeCampaignIds[offset + i];
        }
        
        return result;
    }

    /**
     * @notice Get campaign progress percentage
     */
    function getCampaignProgress(uint256 campaignId) 
        external 
        view 
        returns (uint256) 
    {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.goal == 0) return 0;
        return (campaign.raised * 100) / campaign.goal;
    }

    // === Internal Functions ===

    function _removeFromActiveCampaigns(uint256 campaignId) internal {
        uint256 index = campaignActiveIndex[campaignId];
        uint256 lastIndex = activeCampaignIds.length - 1;
        
        if (index < lastIndex) {
            uint256 lastCampaignId = activeCampaignIds[lastIndex];
            activeCampaignIds[index] = lastCampaignId;
            campaignActiveIndex[lastCampaignId] = index;
        }
        
        activeCampaignIds.pop();
        delete campaignActiveIndex[campaignId];
    }

    // === Admin Functions ===

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function updateEscrowManager(address newEscrow) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        if (newEscrow == address(0)) revert Errors.ZeroAddress();
        escrowManager = EscrowManager(payable(newEscrow));
    }

    // === Receive ETH ===
    receive() external payable {}
    /**
     * @notice Get global platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalRaised,
        uint256 totalInstitutions,
        uint256 activeCampaignsCount,
        uint256 totalDonors
    ) {
        return (
            totalPlatformRaised,
            institutionRegistry.getTotalInstitutions(),
            activeCampaignIds.length,
            userRegistry.totalDonorUsers()
        );
    }
}