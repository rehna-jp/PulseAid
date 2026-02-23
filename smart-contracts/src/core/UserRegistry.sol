// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";

/**
 * @title UserRegistry
 * @notice Manages user role preferences for the PulseAid platform
 * @dev Stores on-chain role selection (Institution or Donor) so preferences
 *      persist across devices and sessions. Role is UX-only - it does NOT
 *      restrict what a wallet can do on-chain, only what the frontend shows.
 */
contract UserRegistry is AccessControl, Pausable {

    // === Enums ===

    enum UserRole {
        None,         // Not yet selected (first-time user)
        Institution,  // Represents an NGO, school, or clinic
        Donor         // Donates to campaigns and tracks impact
    }

    // === Structs ===

    struct UserProfile {
        UserRole role;
        UserRole previousRole; // Enables quick role switching back
        uint256 registeredAt;
        uint256 lastRoleChangeAt;
        bool hasEverDonated;     // Used for smart detection
        bool hasEverStaked;      // Used for smart detection
    }

    // === Events ===

    event RoleSelected(
        address indexed user,
        UserRole role,
        bool isFirstTime,
        uint256 timestamp
    );

    event RoleSwitched(
        address indexed user,
        UserRole fromRole,
        UserRole toRole,
        uint256 timestamp
    );

    event ProfileUpdated(
        address indexed user,
        bool hasEverDonated,
        bool hasEverStaked,
        uint256 timestamp
    );

    // === State Variables ===

    mapping(address => UserProfile) public profiles;
    address[] public registeredUsers;
    mapping(address => bool) public isRegistered;

    // Authorized contracts that can update donation/staking flags
    address public campaignFactory;
    address public institutionRegistry;

    uint256 public totalUsers;
    uint256 public totalInstitutionUsers;
    uint256 public totalDonorUsers;

    // === Constructor ===

    constructor(address admin) {
        if (admin == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // === Role Selection ===

    /**
     * @notice Select or update your platform role
     * @dev First call = role selection screen. Subsequent calls = role switch.
     *      Role is UX-only and does not restrict on-chain actions.
     * @param role The role to assign (1 = Institution, 2 = Donor)
     */
    function selectRole(UserRole role) external whenNotPaused {
        require(role == UserRole.Institution || role == UserRole.Donor, "Invalid role");

        UserProfile storage profile = profiles[msg.sender];
        bool isFirstTime = !isRegistered[msg.sender];

        if (isFirstTime) {
            // First-time registration
            profile.registeredAt = block.timestamp;
            profile.role = role;
            profile.lastRoleChangeAt = block.timestamp;

            isRegistered[msg.sender] = true;
            registeredUsers.push(msg.sender);
            totalUsers++;

            if (role == UserRole.Institution) totalInstitutionUsers++;
            else totalDonorUsers++;

            emit RoleSelected(msg.sender, role, true, block.timestamp);

        } else {
            // Role switch
            require(profile.role != role, "Already on this role");

            UserRole oldRole = profile.role;
            profile.previousRole = oldRole;
            profile.role = role;
            profile.lastRoleChangeAt = block.timestamp;

            // Update counters
            if (oldRole == UserRole.Institution) {
                totalInstitutionUsers--;
                totalDonorUsers++;
            } else {
                totalDonorUsers--;
                totalInstitutionUsers++;
            }

            emit RoleSwitched(msg.sender, oldRole, role, block.timestamp);
        }
    }

    /**
     * @notice Quick-switch back to previous role (one-click toggle in nav bar)
     */
    function switchToPreviousRole() external whenNotPaused {
        UserProfile storage profile = profiles[msg.sender];
        require(isRegistered[msg.sender], "Not registered");
        require(
            profile.previousRole != UserRole.None,
            "No previous role to switch to"
        );

        UserRole oldRole = profile.role;
        UserRole newRole = profile.previousRole;

        profile.previousRole = oldRole;
        profile.role = newRole;
        profile.lastRoleChangeAt = block.timestamp;

        if (oldRole == UserRole.Institution) {
            totalInstitutionUsers--;
            totalDonorUsers++;
        } else {
            totalDonorUsers--;
            totalInstitutionUsers++;
        }

        emit RoleSwitched(msg.sender, oldRole, newRole, block.timestamp);
    }

    // === Smart Detection ===

    /**
     * @notice Suggest a role based on wallet history
     * @dev Called by frontend on first connection to pre-select a role.
     *      Returns Institution if wallet has staked, Donor if wallet has donated,
     *      None if truly new user.
     * @param user Wallet address to check
     * @return suggested The suggested role
     * @return reason Human-readable reason for the suggestion
     */
    function suggestRole(address user)
        external
        view
        returns (UserRole suggested, string memory reason)
    {
        UserProfile storage profile = profiles[user];

        // Already registered - return their saved role
        if (isRegistered[user]) {
            return (profile.role, "Returning user - using saved role");
        }

        // New user - detect from on-chain activity
        if (profile.hasEverStaked) {
            return (UserRole.Institution, "Wallet has staked for institution verification");
        }

        if (profile.hasEverDonated) {
            return (UserRole.Donor, "Wallet has donated to campaigns before");
        }

        // Truly new - no suggestion
        return (UserRole.None, "New user - please select your role");
    }

    /**
     * @notice Get full user profile for frontend
     * @param user Wallet address
     */
    function getProfile(address user)
        external
        view
        returns (
            UserRole role,
            UserRole previousRole,
            bool isFirstTimeUser,
            bool hasEverDonated,
            bool hasEverStaked,
            uint256 registeredAt,
            uint256 lastRoleChangeAt
        )
    {
        UserProfile storage profile = profiles[user];
        return (
            profile.role,
            profile.previousRole,
            !isRegistered[user],
            profile.hasEverDonated,
            profile.hasEverStaked,
            profile.registeredAt,
            profile.lastRoleChangeAt
        );
    }

    /**
     * @notice Check if user has completed role selection
     * @param user Wallet address
     */
    function hasSelectedRole(address user) external view returns (bool) {
        return isRegistered[user];
    }

    /**
     * @notice Get current role for a user
     * @param user Wallet address
     */
    function getRole(address user) external view returns (UserRole) {
        return profiles[user].role;
    }

    /**
     * @notice Get platform-wide role distribution stats
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 total,
            uint256 institutions,
            uint256 donors
        )
    {
        return (totalUsers, totalInstitutionUsers, totalDonorUsers);
    }

    // === Called by Other Contracts ===

    /**
     * @notice Mark wallet as having staked (called by InstitutionRegistry)
     * @dev Used to improve smart role detection for returning wallets
     */
    function markAsStaked(address user) external {
        if (msg.sender != institutionRegistry) revert Errors.Unauthorized();
        if (paused()) revert Errors.ContractPaused();
        profiles[user].hasEverStaked = true;
        emit ProfileUpdated(user, profiles[user].hasEverDonated, true, block.timestamp);
    }

    /**
     * @notice Mark wallet as having donated (called by CampaignFactory)
     * @dev Used to improve smart role detection for returning wallets
     */
    function markAsDonated(address user) external {
        if (msg.sender != campaignFactory) revert Errors.Unauthorized();
        if (paused()) revert Errors.ContractPaused();
        profiles[user].hasEverDonated = true;
        emit ProfileUpdated(user, true, profiles[user].hasEverStaked, block.timestamp);
    }

    // === Admin ===

    /**
     * @notice Set authorized contract addresses
     */
    function setContractAddresses(
        address _campaignFactory,
        address _institutionRegistry
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_campaignFactory == address(0) || _institutionRegistry == address(0)) revert Errors.ZeroAddress();
        campaignFactory = _campaignFactory;
        institutionRegistry = _institutionRegistry;
        emit RoleSwitched(address(this), UserRole.None, UserRole.None, block.timestamp); // lightweight hook for indexing
    }

    /**
     * @notice Get registered users with pagination
     */
    function getRegisteredUsers(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 length = registeredUsers.length;
        if (offset >= length) return new address[](0);
        uint256 end = offset + limit > length ? length : offset + limit;
        uint256 size = end - offset;
        address[] memory result = new address[](size);
        for (uint256 i = 0; i < size; i++) result[i] = registeredUsers[offset + i];
        return result;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}