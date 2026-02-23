// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/tokens/PATToken.sol";

contract PATTokenTest is Test {
    PATToken public token;
    address public admin = address(1);
    address public minter = address(2);
    address public user = address(3);

    function setUp() public {
        token = new PATToken(admin);
        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(admin);
        token.grantRole(minterRole, minter);
    }

    function testInitialState() public {
        assertEq(token.name(), "PulseAid Token");
        assertEq(token.symbol(), "PAT");
        assertEq(token.totalSupply(), 0);
        assertEq(token.MAX_SUPPLY(), 100_000_000 * 10**18);
    }

    function testMintForDonation() public {
        uint256 dollarAmount = 100 * 10**18; // $100
        
        vm.prank(minter);
        token.mintForDonation(user, dollarAmount);
        
        assertEq(token.balanceOf(user), 100 * 10**18); // 1 PAT per $1
        assertEq(token.totalMinted(), 100 * 10**18);
    }

    function testMintForVoting() public {
        vm.prank(minter);
        token.mintForVoting(user);
        
        assertEq(token.balanceOf(user), 10 * 10**18);
    }

    function testMintForAccurateVote() public {
        vm.prank(minter);
        token.mintForAccurateVote(user);
        
        assertEq(token.balanceOf(user), 50 * 10**18);
    }

    function testCannotExceedMaxSupply() public {
        uint256 maxAmount = token.MAX_SUPPLY();
        
        vm.prank(admin);
        token.mintCustomReward(user, maxAmount, "Max mint");
        
        vm.expectRevert();
        vm.prank(minter);
        token.mintForVoting(user);
    }

    function testOnlyMinterCanMint() public {
        vm.expectRevert();
        token.mintForDonation(user, 100 * 10**18);
    }

    function testPauseStopsTransfers() public {
        vm.prank(minter);
        token.mintForDonation(user, 100 * 10**18);
        
        vm.prank(admin);
        token.pause();
        
        vm.expectRevert();
        vm.prank(user);
        token.transfer(address(4), 10 * 10**18);
        
        vm.prank(admin);
        token.unpause();
        
        vm.prank(user);
        token.transfer(address(4), 10 * 10**18);
        assertEq(token.balanceOf(address(4)), 10 * 10**18);
    }
}
