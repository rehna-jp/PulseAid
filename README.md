# PulseAid 🌍

**PulseAid** is a decentralized charitable giving platform that ensures every donation reaches its intended destination. By leveraging blockchain transparency and **Zero-Knowledge Proofs (ZKPs)**, PulseAid eliminates the "black box" of traditional charity.

## 🚀 Key Features

-   **ZK-Verified Institutions**: Organizations must be verified via Reclaim Protocol to create campaigns.
-   **Escrow-Gated Funds**: Donations are locked in a smart contract escrow and only released upon successful cryptographic proof of impact.
-   **Proof of Impact**: Institutions submit verifiable proofs (e.g., government certificates, GPS data) to unlock milestone funds.
-   **Automatic Refunds**: If a campaign is cancelled or fails to provide proof within the deadline, donors can claim their full refund.
-   **PAT Ecosystem**: Donors earn **PulseAction Tokens (PAT)** for every donation, granting governance rights in the PulseAid DAO.
-   **DonationNFTs**: Each donation mints a unique on-chain receipt as an NFT, documenting the specific impact made.

## 🛠 Tech Stack

### Frontend
-   **Framework**: [Next.js 15](https://nextjs.org/)
-   **Blockchain Interaction**: [Wagmi](https://wagmi.sh/) & [Viem](https://viem.sh/)
-   **Wallet Connection**: [ConnectKit](https://docs.family.co/connectkit)
-   **Styling**: Vanilla CSS with modern Glassmorphism aesthetics
-   **Icons**: [Lucide React](https://lucide.dev/)

### Smart Contracts
-   **Language**: Solidity ^0.8.24
-   **Framework**: [Foundry](https://book.getfoundry.sh/)
-   **Libraries**: OpenZeppelin (AccessControl, ERC20, ERC721, Pausable)
-   **Verification**: [Reclaim Protocol](https://www.reclaimprotocol.org/)

## 📂 Project Structure

```text
PulseAid/
├── frontend/             # Next.js web application
│   ├── src/app/          # App router pages (Home, Campaigns, Dashboard)
│   ├── src/components/   # Reusable UI (Navbar, Modals, Transaction Status)
│   ├── src/hooks/        # Custom Wagmi hooks for contract interaction
│   └── src/lib/          # Contract ABIs and addresses
└── smart-contracts/      # Foundry project
    ├── src/core/         # Main logic (CampaignFactory, Escrow, Registry)
    ├── src/governance/   # DAO and Voting logic
    ├── src/tokens/       # ERC20 (PAT) and ERC721 (DonationNFT)
    └── script/           # Deployment scripts
```

## ⚙️ Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   Foundry (for smart contracts)

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    ```bash
    cp .env.example .env.local
    ```
    *Fill in your `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` and RPC URLs.*
4.  Run the development server:
    ```bash
    npm run dev
    ```

### Smart Contract Setup
1.  Navigate to the contract directory:
    ```bash
    cd smart-contracts
    ```
2.  Install Foundry dependencies:
    ```bash
    forge install
    ```
3.  Build contracts:
    ```bash
    forge build
    ```
4.  Run tests:
    ```bash
    forge test
    ```

## 📜 Deployment
The platform is currently optimized for **Arbitrum Sepolia**. Ensure your `.env` is configured with a Sepolia RPC and deployer private key before running deployment scripts.

## ⚖️ License
This project is licensed under the MIT License.