// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/UserRegistry.sol";

contract UserRegistryTest is Test {
    UserRegistry public registry;
    address public admin = address(1);
    address public campaignFactory = address(2);
    address public institutionRegistry = address(3);
    address public user1 = address(10);
    address public user2 = address(11);

    function setUp() public {
        registry = new UserRegistry(admin);
        vm.prank(admin);
        registry.setContractAddresses(campaignFactory, institutionRegistry);
    }

    function testSelectRoleFirstTime() public {
        vm.prank(user1);
        registry.selectRole(UserRegistry.UserRole.Donor);
        
        assertEq(uint(registry.getRole(user1)), uint(UserRegistry.UserRole.Donor));
        assertTrue(registry.hasSelectedRole(user1));
        
        (uint256 total, uint256 institutions, uint256 donors) = registry.getPlatformStats();
        assertEq(total, 1);
        assertEq(donors, 1);
        assertEq(institutions, 0);
    }

    function testSwitchRole() public {
        vm.prank(user1);
        registry.selectRole(UserRegistry.UserRole.Donor);
        
        vm.prank(user1);
        registry.selectRole(UserRegistry.UserRole.Institution);
        
        assertEq(uint(registry.getRole(user1)), uint(UserRegistry.UserRole.Institution));
        
        (uint256 total, uint256 institutions, uint256 donors) = registry.getPlatformStats();
        assertEq(total, 1);
        assertEq(institutions, 1);
        assertEq(donors, 0);
    }

    function testSwitchToPreviousRole() public {
        vm.prank(user1);
        registry.selectRole(UserRegistry.UserRole.Donor);
        
        vm.prank(user1);
        registry.selectRole(UserRegistry.UserRole.Institution);
        
        vm.prank(user1);
        registry.switchToPreviousRole();
        
        assertEq(uint(registry.getRole(user1)), uint(UserRegistry.UserRole.Donor));
    }

    function testSmartDetection() public {
        // Mark as donated
        vm.prank(campaignFactory);
        registry.markAsDonated(user1);
        
        (UserRegistry.UserRole suggested, string memory reason) = registry.suggestRole(user1);
        assertEq(uint(suggested), uint(UserRegistry.UserRole.Donor));
        
        // Mark as staked
        vm.prank(institutionRegistry);
        registry.markAsStaked(user2);
        
        (suggested, reason) = registry.suggestRole(user2);
        assertEq(uint(suggested), uint(UserRegistry.UserRole.Institution));
    }

    function testOnlyAuthorizedCanMarkActions() public {
        vm.expectRevert();
        registry.markAsDonated(user1);
        
        vm.expectRevert();
        registry.markAsStaked(user1);
    }
}
