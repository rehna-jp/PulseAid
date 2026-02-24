// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/tokens/PATToken.sol";
import "../src/tokens/DonationNFT.sol";
import "../src/core/Treasury.sol";
import "../src/core/UserRegistry.sol";
import "../src/core/InstitutionRegistry.sol";
import "../src/core/EscrowManager.sol";
import "../src/core/CampaignFactory.sol";
import "../src/core/ProofValidator.sol";
import "../src/governance/GovernanceDAO.sol";

/**
 * @title MockReclaim
 * @notice Simplified mock for testing Reclaim integration
 */
contract MockReclaim is IReclaim {
    function verifyProof(SignedClaim memory) external pure returns (bool) { return true; }
    function extractClaimData(SignedClaim memory) external pure returns (ClaimInfo memory) {
        return ClaimInfo("provider", "params", "context");
    }
}

/**
 * @title FullIntegrationTest
 * @notice Tests the complete flow: Register → Create Campaign → Donate → Submit Proof → Release Funds
 */
contract FullIntegrationTest is Test {
    PATToken public patToken;
    DonationNFT public donationNFT;
    Treasury public treasury;
    UserRegistry public userRegistry;
    InstitutionRegistry public institutionRegistry;
    EscrowManager public escrowManager;
    CampaignFactory public campaignFactory;
    ProofValidator public proofValidator;
    GovernanceDAO public governanceDAO;

    address public admin = address(1);
    address public institution = address(100);
    address public donor1 = address(200);
    address public donor2 = address(201);
    
    MockReclaim public mockReclaim;

    function setUp() public {
        // Deploy all contracts
        patToken = new PATToken(admin);
        donationNFT = new DonationNFT(admin);
        treasury = new Treasury(admin);
        userRegistry = new UserRegistry(admin);
        
        mockReclaim = new MockReclaim();
        institutionRegistry = new InstitutionRegistry(address(mockReclaim), address(patToken), address(userRegistry), admin);
        
        escrowManager = new EscrowManager(address(treasury), admin);
        campaignFactory = new CampaignFactory(
            address(institutionRegistry),
            address(escrowManager),
            address(patToken),
            address(userRegistry),
            admin
        );
        proofValidator = new ProofValidator(
            address(escrowManager),
            address(campaignFactory),
            address(institutionRegistry),
            address(patToken),
            address(donationNFT),
            address(treasury),
            admin
        );
        governanceDAO = new GovernanceDAO(address(patToken), address(institutionRegistry), admin);

        // Configure roles
        vm.startPrank(admin);
        patToken.grantRole(patToken.MINTER_ROLE(), address(institutionRegistry));
        patToken.grantRole(patToken.MINTER_ROLE(), address(campaignFactory));
        patToken.grantRole(patToken.MINTER_ROLE(), address(proofValidator));
        patToken.grantRole(patToken.MINTER_ROLE(), address(governanceDAO)); // To mint voting rewards
        
        donationNFT.grantRole(donationNFT.MINTER_ROLE(), address(proofValidator));
        
        escrowManager.grantRole(escrowManager.CAMPAIGN_ROLE(), address(campaignFactory));
        escrowManager.grantRole(escrowManager.PROOF_VALIDATOR_ROLE(), address(proofValidator));
        
        institutionRegistry.grantRole(institutionRegistry.GOVERNANCE_ROLE(), address(campaignFactory));
        institutionRegistry.grantRole(institutionRegistry.GOVERNANCE_ROLE(), address(proofValidator));
        
        campaignFactory.grantRole(campaignFactory.GOVERNANCE_ROLE(), address(proofValidator));
        
        userRegistry.setContractAddresses(address(campaignFactory), address(institutionRegistry));
        vm.stopPrank();

        // Fund test accounts
        vm.deal(institution, 10 ether);
        vm.deal(donor1, 10 ether);
        vm.deal(donor2, 10 ether);
    }

    function testFullDonationFlow() public {
        uint256 goal = 5 ether;
        uint256 duration = 30 days;
        
        // 1. Institution registers
        uint256 stakeAmount = institutionRegistry.VERIFICATION_STAKE();
        vm.prank(institution);
        IReclaim.SignedClaim memory mockClaim;
        institutionRegistry.registerInstitution{value: stakeAmount}(
            "Red Cross", "Health", "Global", "redcross.org", mockClaim
        );
        
        // 2. Clear challenge window
        vm.warp(block.timestamp + 8 days);
        vm.prank(admin);
        institutionRegistry.finalizeVerification(institution);
        
        // 3. Create campaign
        vm.prank(institution);
        uint256 campaignId = campaignFactory.createCampaign{value: 0.000025 ether}(
            "Emergency Relief", "Help us", "Emergency", "ipfs://meta", goal, duration
        );
        assertEq(campaignId, 0);
        
        // 4. Donate
        vm.prank(donor1);
        campaignFactory.donate{value: 5 ether}(campaignId);
        
        // Check escrow balance
        assertEq(escrowManager.getBalance(campaignId), 5 ether);
        
        // 5. End campaign
        vm.warp(block.timestamp + duration + 1);
        campaignFactory.endCampaign(campaignId);
        
        // 6. Submit proof
        vm.prank(institution);
        proofValidator.submitProof{value: 0.00001 ether}(campaignId, "ipfs://proof", "ipfs://receipts", "ipfs://photos", "ipfs://metrics");
        
        // 7. Verify automated approval after challenge period (e.g. 48h)
        vm.warp(block.timestamp + 49 hours);
        proofValidator.finalizeProof(campaignId);
        
        // 8. Check funds released to institution (minus fee, proof stake, but includes campaign stake refund)
        uint256 expected = 5 ether - (5 ether * 10 / 10000);
        assertEq(institution.balance, 10 ether - institutionRegistry.VERIFICATION_STAKE() - 0.00001 ether + expected);
        
        // 9. Check reputation increase
        (,,,,,,uint256 reputation,,,,,,,) = institutionRegistry.institutions(institution);
        assertEq(reputation, 1000 + 50);
    }

    function testProofRejectionReputationSlashAndRefund() public {
        uint256 goal = 5 ether;
        uint256 duration = 30 days;
        
        // 1. Institution registers
        uint256 stakeAmount = institutionRegistry.VERIFICATION_STAKE();
        vm.prank(institution);
        IReclaim.SignedClaim memory mockClaim;
        institutionRegistry.registerInstitution{value: stakeAmount}(
            "Red Cross", "Health", "Global", "redcross.org", mockClaim
        );
        
        // 2. Clear challenge window
        vm.warp(block.timestamp + 8 days);
        vm.prank(admin);
        institutionRegistry.finalizeVerification(institution);
        
        // 3. Create campaign
        vm.prank(institution);
        uint256 campaignId = campaignFactory.createCampaign{value: 0.000025 ether}(
            "Emergency Relief", "Help us", "Emergency", "ipfs://meta", goal, duration
        );
        
        // 4. Donate
        vm.prank(donor1);
        campaignFactory.donate{value: 1 ether}(campaignId);
        
        // 5. End campaign
        vm.warp(block.timestamp + duration + 1);
        campaignFactory.endCampaign(campaignId);
        
        // 6. Submit proof
        vm.prank(institution);
        proofValidator.submitProof{value: 0.00001 ether}(campaignId, "ipfs://bad", "ipfs://bad", "ipfs://bad", "ipfs://bad");
        
        // Start a challenge/dispute
        // Mint some tokens to donor1 so they can challenge
        vm.prank(admin);
        patToken.mintCustomReward(donor1, 10000 * 10**18, "Testing");
        
        vm.prank(donor1);
        proofValidator.challengeProof(campaignId, "Fake receipts");
        
        // Skip voting period and resolve Against
        vm.warp(block.timestamp + 6 days);
        proofValidator.resolveDispute(0); // first dispute
        
        // Check reputation slashed
        (,,,,,,uint256 reputation,,,,,,,) = institutionRegistry.institutions(institution);
        assertEq(reputation, 1000 - 200);
        
        // Check refund enabled
        assertTrue(escrowManager.isRefundEnabled(campaignId));
        
        // Donor1 claims refund
        uint256 oldBal = donor1.balance;
        vm.prank(donor1);
        escrowManager.claimRefund(campaignId);
        assertEq(donor1.balance, oldBal + 1 ether);
    }

    function testReputationWeightedVotingPower() public {
        uint256 goal = 5 ether;
        uint256 duration = 30 days;
        
        // 1. Institution registers
        uint256 stakeAmount = institutionRegistry.VERIFICATION_STAKE();
        vm.prank(institution);
        IReclaim.SignedClaim memory mockClaim;
        institutionRegistry.registerInstitution{value: stakeAmount}(
            "Red Cross", "Health", "Global", "redcross.org", mockClaim
        );
        
        // 2. Clear challenge window
        vm.warp(block.timestamp + 8 days);
        vm.prank(admin);
        institutionRegistry.finalizeVerification(institution);
        
        // 3. Promote to Elite
        vm.prank(admin);
        institutionRegistry.updateReputation(institution, 1000, "Elite Tier Promotion");
        
        // 4. Create campaign and donate
        vm.prank(institution);
        uint256 campaignId = campaignFactory.createCampaign{value: 0.000025 ether}(
            "Title", "Desc", "Cat", "ipfs", goal, duration
        );
        
        vm.prank(donor1);
        campaignFactory.donate{value: 0.1 ether}(campaignId);
        
        // 5. End campaign
        vm.warp(block.timestamp + duration + 1);
        campaignFactory.endCampaign(campaignId);
        
        // 6. Submit and challenge proof
        vm.prank(institution);
        proofValidator.submitProof{value: 0.00001 ether}(campaignId, "H", "H", "H", "H");
        
        vm.startPrank(admin);
        patToken.mintCustomReward(donor1, 1000 * 10**18, "Seed");
        patToken.mintCustomReward(institution, 1000 * 10**18, "Seed");
        patToken.mintCustomReward(admin, 1000 * 10**18, "Seed"); // Challenger needs stake
        proofValidator.challengeProof(campaignId, "Manual test");
        vm.stopPrank();
        
        uint256 disputeId = 0;
        
        // Donor votes FOR (1000 weight)
        vm.prank(donor1);
        proofValidator.voteOnDispute(disputeId, true);
        
        // Institution votes AGAINST (Elite = 2x weight = 2000)
        vm.prank(institution);
        proofValidator.voteOnDispute(disputeId, false);
        
        (,,,uint256 forVotes, uint256 againstVotes,,) = proofValidator.getDispute(disputeId);
        assertEq(forVotes, 1300 * 10**18); // 1000 seed + 300 from 0.1 ETH donation
        assertEq(againstVotes, 2200 * 10**18); // (1000 seed + 100 registration) * 2
    }

    function testEscrowLockAndRelease() public {
        uint256 campaignId = 99; // Arbitrary ID for direct lock
        uint256 donationAmount = 1 ether;
        
        // Simulate donation through campaign factory role
        vm.deal(address(campaignFactory), donationAmount);
        vm.prank(address(campaignFactory));
        escrowManager.lockFunds{value: donationAmount}(campaignId, donor1);
        
        assertEq(escrowManager.getBalance(campaignId), donationAmount);
        assertEq(escrowManager.totalLockedFunds(), donationAmount);
        
        // Release funds
        vm.prank(address(proofValidator));
        escrowManager.releaseFunds(campaignId, institution);
        
        // Check institution received funds minus 0.1% fee
        uint256 fee = (donationAmount * 10) / 10_000;
        uint256 expected = donationAmount - fee;
        assertEq(institution.balance, 10 ether + expected);
        
        // Check locked funds updated
        assertEq(escrowManager.totalLockedFunds(), 0);
    }

    function testPATTokenMintingInFlow() public {
        uint256 dollarAmount = 100 * 10**18;
        
        vm.prank(address(campaignFactory));
        patToken.mintForDonation(donor1, dollarAmount);
        
        assertEq(patToken.balanceOf(donor1), 100 * 10**18);
    }

    function testUserRegistryIntegration() public {
        // Select role
        vm.prank(donor1);
        userRegistry.selectRole(UserRegistry.UserRole.Donor);
        
        assertEq(uint(userRegistry.getRole(donor1)), uint(UserRegistry.UserRole.Donor));
        
        // Mark as donated (simulating campaign factory call)
        vm.prank(address(campaignFactory));
        userRegistry.markAsDonated(donor1);
        
        // Check smart detection
        (UserRegistry.UserRole suggested,) = userRegistry.suggestRole(donor1);
        assertEq(uint(suggested), uint(UserRegistry.UserRole.Donor));
    }

    function testDonationNFTMinting() public {
        vm.prank(address(proofValidator));
        uint256 tokenId = donationNFT.mintReceipt(
            1, // campaignId
            donor1,
            1 ether,
            block.timestamp,
            "School Books Campaign",
            "QmTest123"
        );
        
        assertEq(donationNFT.ownerOf(tokenId), donor1);
        assertEq(tokenId, 1);
        
        uint256[] memory tokens = donationNFT.getDonorReceipts(donor1);
        assertEq(tokens.length, 1);
        assertEq(tokens[0], 1);
    }

    function testCannotDoubleClaimNFT() public {
        vm.startPrank(address(proofValidator));
        
        uint256 tokenId1 = donationNFT.mintReceipt(1, donor1, 1 ether, block.timestamp, "Campaign", "QmHash");
        uint256 tokenId2 = donationNFT.mintReceipt(1, donor1, 1 ether, block.timestamp, "Campaign", "QmHash");
        
        vm.stopPrank();
        
        // Should return same token ID (idempotent)
        assertEq(tokenId1, tokenId2);
        assertEq(donationNFT.balanceOf(donor1), 1); // Only 1 NFT minted
    }
}
