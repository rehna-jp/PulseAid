// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
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
 * @title DeployPulseAid
 * @notice Deployment script for the complete PulseAid platform
 * @dev Deploy contracts in correct order with proper configuration
 */
contract DeployPulseAid is Script {
    // Deployment addresses (will be filled during deployment)
    PATToken public patToken;
    DonationNFT public donationNFT;
    Treasury public treasury;
    UserRegistry public userRegistry;
    InstitutionRegistry public institutionRegistry;
    EscrowManager public escrowManager;
    CampaignFactory public campaignFactory;
    ProofValidator public proofValidator;
    GovernanceDAO public governanceDAO;

    // Configuration
    address public deployer;
    address public admin;
    address public reclaimProtocol;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        admin = vm.envAddress("INITIAL_ADMIN");
        reclaimProtocol = vm.envOr("RECLAIM_PROTOCOL_ADDRESS", address(0));
        
        deployer = vm.addr(deployerPrivateKey);
        
        console.log("=====================================");
        console.log("PulseAid Platform Deployment");
        console.log("=====================================");
        console.log("Deployer:", deployer);
        console.log("Admin:", admin);
        console.log("Network:", block.chainid);
        console.log("=====================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy PAT Token
        console.log("1. Deploying PATToken...");
        patToken = new PATToken(deployer);
        console.log("   PATToken deployed at:", address(patToken));

        // Step 2: Deploy DonationNFT (ERC721 receipts)
        console.log("\n2. Deploying DonationNFT...");
        donationNFT = new DonationNFT(deployer);
        console.log("   DonationNFT deployed at:", address(donationNFT));

        // Step 3: Deploy Treasury
        console.log("\n3. Deploying Treasury...");
        treasury = new Treasury(deployer);
        console.log("   Treasury deployed at:", address(treasury));

        // Step 4: Deploy UserRegistry (v5.0 - Role-based experience)
        console.log("\n4. Deploying UserRegistry...");
        userRegistry = new UserRegistry(deployer);
        console.log("   UserRegistry deployed at:", address(userRegistry));

        // Step 5: Deploy Institution Registry
        console.log("\n5. Deploying InstitutionRegistry...");
        if (reclaimProtocol == address(0)) {
            console.log("   WARNING: No Reclaim Protocol address provided");
            console.log("   Using placeholder - update before mainnet!");
            reclaimProtocol = address(0xdead);
        }
        institutionRegistry = new InstitutionRegistry(
            reclaimProtocol,
            address(patToken),
            address(userRegistry),
            deployer
        );
        console.log("   InstitutionRegistry deployed at:", address(institutionRegistry));

        // Step 6: Deploy Escrow Manager
        console.log("\n6. Deploying EscrowManager...");
        escrowManager = new EscrowManager(address(treasury), deployer);
        console.log("   EscrowManager deployed at:", address(escrowManager));

        // Step 7: Deploy Campaign Factory
        console.log("\n7. Deploying CampaignFactory...");
        campaignFactory = new CampaignFactory(
            address(institutionRegistry),
            address(escrowManager),
            address(patToken),
            address(userRegistry),
            deployer
        );
        console.log("   CampaignFactory deployed at:", address(campaignFactory));

        // Step 8: Deploy Proof Validator
        console.log("\n8. Deploying ProofValidator...");
        proofValidator = new ProofValidator(
            address(escrowManager),
            address(campaignFactory),
            address(institutionRegistry),
            address(patToken),
            address(donationNFT),
            address(treasury),
            deployer
        );
        console.log("   ProofValidator deployed at:", address(proofValidator));

        // Step 9: Deploy Governance DAO
        console.log("\n9. Deploying GovernanceDAO...");
        governanceDAO = new GovernanceDAO(
            address(patToken),
            address(institutionRegistry),
            deployer
        );
        console.log("   GovernanceDAO deployed at:", address(governanceDAO));

        // Step 10: Configure roles and permissions
        console.log("\n10. Configuring roles and permissions...");
        _configureRoles();
        console.log("   Roles configured successfully");
        
        // Step 11: Transfer ownership/admin roles to the target admin
        console.log("\n11. Transferring roles to target admin...");
        _transferRoles();
        console.log("    Roles transferred successfully");

        vm.stopBroadcast();

        // Step 12: Print deployment summary
        _printDeploymentSummary();

        // Step 13: Save deployment addresses
        _saveDeploymentAddresses();
    }

    function _transferRoles() internal {
        // Transfer roles for each contract
        _transferContractRoles(address(patToken));
        _transferContractRoles(address(donationNFT));
        _transferContractRoles(address(treasury));
        _transferContractRoles(address(userRegistry));
        _transferContractRoles(address(institutionRegistry));
        _transferContractRoles(address(escrowManager));
        _transferContractRoles(address(campaignFactory));
        _transferContractRoles(address(proofValidator));
        _transferContractRoles(address(governanceDAO));
    }

    function _transferContractRoles(address contractAddr) internal {
        AccessControl ac = AccessControl(contractAddr);
        bytes32 adminRole = ac.DEFAULT_ADMIN_ROLE();
        
        // Grant to target admin
        ac.grantRole(adminRole, admin);
        
        // Renounce from deployer
        ac.renounceRole(adminRole, deployer);
    }

    function _configureRoles() internal {
        // Grant PAT Token minting roles
        patToken.grantRole(patToken.MINTER_ROLE(), address(institutionRegistry));
        patToken.grantRole(patToken.MINTER_ROLE(), address(campaignFactory));
        patToken.grantRole(patToken.MINTER_ROLE(), address(proofValidator));
        patToken.grantRole(patToken.MINTER_ROLE(), address(governanceDAO));

        // Grant Escrow Manager roles
        escrowManager.grantRole(escrowManager.CAMPAIGN_ROLE(), address(campaignFactory));
        escrowManager.grantRole(escrowManager.PROOF_VALIDATOR_ROLE(), address(proofValidator));

        // Grant Institution Registry governance role
        institutionRegistry.grantRole(
            institutionRegistry.GOVERNANCE_ROLE(),
            address(campaignFactory)
        );
        institutionRegistry.grantRole(
            institutionRegistry.GOVERNANCE_ROLE(),
            address(proofValidator)
        );

        // Grant Campaign Factory governance role
        campaignFactory.grantRole(
            campaignFactory.GOVERNANCE_ROLE(),
            address(proofValidator)
        );

        // Grant Treasury roles
        treasury.grantRole(treasury.GOVERNANCE_ROLE(), address(governanceDAO));
        treasury.grantRole(treasury.WITHDRAWER_ROLE(), address(governanceDAO));

        // Grant GovernanceDAO the GOVERNANCE_ROLE on CampaignFactory and InstitutionRegistry
        // so governance proposals can call completeCampaign, updateReputation, banInstitution, etc.
        campaignFactory.grantRole(
            campaignFactory.GOVERNANCE_ROLE(),
            address(governanceDAO)
        );
        institutionRegistry.grantRole(
            institutionRegistry.GOVERNANCE_ROLE(),
            address(governanceDAO)
        );

        // v5.0: Wire UserRegistry to CampaignFactory and InstitutionRegistry
        userRegistry.setContractAddresses(
            address(campaignFactory),
            address(institutionRegistry)
        );

        // Grant DonationNFT minting role to ProofValidator (mints after fund release)
        donationNFT.grantRole(donationNFT.MINTER_ROLE(), address(proofValidator));
        // Also grant to CampaignFactory so it can mint immediately after donation if needed
        donationNFT.grantRole(donationNFT.MINTER_ROLE(), address(campaignFactory));

        console.log("   - PAT Token minting roles granted");
        console.log("   - DonationNFT minting roles granted");
        console.log("   - Escrow Manager roles granted");
        console.log("   - Institution Registry roles granted");
        console.log("   - Campaign Factory roles granted");
        console.log("   - Treasury roles granted");
        console.log("   - UserRegistry wired to CampaignFactory + InstitutionRegistry");
    }

    function _printDeploymentSummary() internal view {
        console.log("\n=====================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("=====================================");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Admin:", admin);
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------");
        console.log("PATToken:", address(patToken));
        console.log("DonationNFT:", address(donationNFT));
        console.log("Treasury:", address(treasury));
        console.log("UserRegistry:", address(userRegistry));
        console.log("InstitutionRegistry:", address(institutionRegistry));
        console.log("EscrowManager:", address(escrowManager));
        console.log("CampaignFactory:", address(campaignFactory));
        console.log("ProofValidator:", address(proofValidator));
        console.log("GovernanceDAO:", address(governanceDAO));
        console.log("");
        console.log("Configuration:");
        console.log("--------------");
        console.log("Reclaim Protocol:", reclaimProtocol);
        console.log("Verification Stake:", vm.toString(institutionRegistry.VERIFICATION_STAKE()), "wei");
        console.log("Campaign Stake: 0.025 ETH");
        console.log("Platform Fee: 0.1%");
        console.log("=====================================\n");
    }

    function _saveDeploymentAddresses() internal {
        string memory chainIdStr = vm.toString(block.chainid);
        string memory outputPath = string.concat("deployments/", chainIdStr, ".json");

        string memory json = string.concat(
            '{\n',
            '  "network": "', chainIdStr, '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "admin": "', vm.toString(admin), '",\n',
            '  "PATToken": "', vm.toString(address(patToken)), '",\n',
            '  "DonationNFT": "', vm.toString(address(donationNFT)), '",\n',
            '  "Treasury": "', vm.toString(address(treasury)), '",\n',
            '  "UserRegistry": "', vm.toString(address(userRegistry)), '",\n',
            '  "InstitutionRegistry": "', vm.toString(address(institutionRegistry)), '",\n',
            '  "EscrowManager": "', vm.toString(address(escrowManager)), '",\n',
            '  "CampaignFactory": "', vm.toString(address(campaignFactory)), '",\n',
            '  "ProofValidator": "', vm.toString(address(proofValidator)), '",\n',
            '  "GovernanceDAO": "', vm.toString(address(governanceDAO)), '",\n',
            '  "ReclaimProtocol": "', vm.toString(reclaimProtocol), '"\n',
            '}'
        );

        vm.writeFile(outputPath, json);
        console.log("Deployment addresses saved to:", outputPath);
    }}
