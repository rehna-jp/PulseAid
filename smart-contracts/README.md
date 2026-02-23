# PulseAid Smart Contracts ⛓️

The core logic of the PulseAid platform, built with **Foundry**. These contracts handle everything from institution registration to fund escrow and ZK-proof validation.

## 🧱 Core Contracts

-   **`CampaignFactory.sol`**: Creates and manages fundraising campaigns. Tracks total platform stats.
-   **`EscrowManager.sol`**: Securely holds funds and handles releases/refunds.
-   **`InstitutionRegistry.sol`**: Manages verified institutions and their on-chain reputation.
-   **`ProofValidator.sol`**: Validates impact proofs and handles dispute resolution.
-   **`UserRegistry.sol`**: Stores user role preferences and global user counts.
-   **`PATToken.sol`**: The governance token of the ecosystem.
-   **`DonationNFT.sol`**: On-chain receipts for donors.

## 🛠 Usage

### Build
```shell
forge build
```

### Test
```shell
forge test
```

### Deploy (Arbitrum Sepolia)
```shell
forge script script/Deploy.s.sol --rpc-url <rpc_url> --private-key <pk> --broadcast
```

## 🔒 Security
The system uses **OpenZeppelin** implementation for AccessControl, Pausable, and token standards. It is designed to be non-custodial and trustless via cryptographic verification.
