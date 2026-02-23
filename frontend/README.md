# PulseAid Frontend 🌐

This is the Next.js web application for the PulseAid platform. It provides a modern, glassmorphic interface for donors and institutions to interact with the PulseAid smart contracts.

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    Create a `.env.local` file based on `.env.example`:
    ```bash
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
    NEXT_PUBLIC_ALCHEMY_ID=your_id_here
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
4.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🏗 Key Components

-   **`Navbar.tsx`**: responsive navigation with Connect Wallet and role detection.
-   **`DonateModal.tsx`**: Handles the donation flow and PAT token minting.
-   **`RoleSelectionModal.tsx`**: Mandatory onboarding for new users.
-   **`TxStatus.tsx`**: Standardized component for displaying on-chain transaction progress.

## 🔗 Contract Integration
All contract interactions are centralized in `src/hooks/useContracts.ts` using **Wagmi** and **ConnectKit**.
