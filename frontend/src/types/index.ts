// ─── Shared TypeScript types for PulseAid frontend ──────────────────────────

export type Address = `0x${string}`;

export interface Campaign {
    id: bigint;
    title: string;
    description: string;
    institution: string;
    institutionAddress: Address;
    goal: bigint;         // in wei
    raised: bigint;       // in wei
    deadline: bigint;     // unix timestamp
    donorCount: bigint;
    proofRequirements: string;
    status: CampaignStatus;
    txHash?: string;
}

export type CampaignStatus = 'Active' | 'Funded' | 'Completed' | 'Cancelled' | 'Expired';

export interface Institution {
    address: Address;
    name: string;
    description: string;
    website: string;
    isVerified: boolean;
    stake: bigint;        // in wei
    reputationScore: number;
    campaignsCount: number;
    totalRaised: bigint;  // in wei
    registeredAt: bigint; // unix timestamp
}

export interface Donation {
    donor: Address;
    campaignId: bigint;
    amount: bigint;       // in wei
    tokenId?: bigint;     // NFT token id if minted
    timestamp: bigint;
    txHash: string;
}

export interface Proof {
    campaignId: bigint;
    institution: Address;
    proofHex: `0x${string}`;
    proofData: string;
    verified: boolean;
    timestamp: bigint;
    txHash?: string;
}

export interface GovernanceProposal {
    id: bigint;
    title: string;
    description: string;
    proposer: Address;
    forVotes: bigint;
    againstVotes: bigint;
    deadline: bigint;     // unix timestamp
    status: ProposalStatus;
    category: string;
    executed: boolean;
}

export type ProposalStatus = 'Pending' | 'Active' | 'Passing' | 'Passed' | 'Defeated' | 'Cancelled';

export interface UserProfile {
    address: Address;
    totalDonated: bigint;
    donationCount: bigint;
    patBalance: bigint;
    nftCount: bigint;
    isInstitution: boolean;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
export interface TxState {
    hash?: `0x${string}`;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error: Error | null;
}
