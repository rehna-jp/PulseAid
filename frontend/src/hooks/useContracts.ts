'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { arbitrumSepolia } from 'wagmi/chains';

// ─── Reusable read helper ────────────────────────────────────────────────────
export function useContractRead<T = unknown>({
    contractName,
    functionName,
    args,
    enabled = true,
}: {
    contractName: keyof typeof CONTRACT_ADDRESSES;
    functionName: string;
    args?: unknown[];
    enabled?: boolean;
}) {
    return useReadContract({
        address: CONTRACT_ADDRESSES[contractName],
        abi: ABIS[contractName] as unknown[],
        functionName,
        args,
        chainId: arbitrumSepolia.id,
        query: { enabled },
    });
}

export function usePlatformStats() {
    return useReadContract({
        address: CONTRACT_ADDRESSES.CampaignFactory,
        abi: ABIS.CampaignFactory as unknown[],
        functionName: 'getPlatformStats',
        chainId: arbitrumSepolia.id,
    });
}

// ─── PAT Token ────────────────────────────────────────────────────────────────
export function usePATBalance(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'PATToken',
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

export function usePATTotalSupply() {
    return useContractRead({ contractName: 'PATToken', functionName: 'totalSupply' });
}

export function usePATUserStats(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'PATToken',
        functionName: 'getUserTokenStats',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

// ─── Institution Registry ─────────────────────────────────────────────────────
export function useInstitutionInfo(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'getInstitution',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/** Check if an institution is verified and can create campaigns. */
export function useIsInstitutionVerified(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'canCreateCampaign',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/**
 * Returns whether a given wallet can create campaigns (verified or tentative institution).
 * Replaces the old `isVerified` call which didn't exist on the contract.
 */
export function useCanCreateCampaign(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'canCreateCampaign',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

export function useTotalInstitutions() {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'getTotalInstitutions',
    });
}

export function useInstitutions(offset: bigint, limit: bigint) {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'getInstitutions',
        args: [offset, limit],
    });
}

/**
 * Register an institution with the Reclaim Protocol ZK proof.
 * `zkProof` is the `SignedClaim` struct from the Reclaim Protocol SDK.
 * VERIFICATION_STAKE = 0.05 ether (set as constant in the contract).
 */
export function useRegisterInstitution() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const register = (
        name: string,
        category: string,
        country: string,
        website: string,
        zkProof: unknown, // IReclaim.SignedClaim struct — populate via Reclaim Protocol SDK
        stakeAmount: string = '0.05'
    ) => {
        writeContract({
            address: CONTRACT_ADDRESSES.InstitutionRegistry,
            abi: ABIS.InstitutionRegistry as unknown[],
            functionName: 'registerInstitution',
            args: [name, category, country, website, zkProof],
            value: parseEther(stakeAmount),
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { register, isPending, isConfirming, isSuccess, error, hash };
}

export function useFinalizeVerification() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const finalize = (institutionAddress: `0x${string}`) => {
        writeContract({
            address: CONTRACT_ADDRESSES.InstitutionRegistry,
            abi: ABIS.InstitutionRegistry as unknown[],
            functionName: 'finalizeVerification',
            args: [institutionAddress],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { finalize, isPending, isConfirming, isSuccess, error, hash };
}

export function useWithdrawStake() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const withdraw = () => {
        writeContract({
            address: CONTRACT_ADDRESSES.InstitutionRegistry,
            abi: ABIS.InstitutionRegistry as unknown[],
            functionName: 'withdrawStake',
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { withdraw, isPending, isConfirming, isSuccess, error, hash };
}

// ─── Campaign Factory ─────────────────────────────────────────────────────────

/** Total number of campaigns ever created (use as an upper bound for IDs). */
export function useCampaignCounter() {
    return useContractRead({ contractName: 'CampaignFactory', functionName: 'campaignCounter' });
}

/** Get details of a specific campaign. */
export function useCampaignInfo(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'CampaignFactory',
        functionName: 'getCampaign',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

/** Paginated list of currently active campaign IDs. */
export function useActiveCampaigns(offset: bigint = 0n, limit: bigint = 20n) {
    return useContractRead({
        contractName: 'CampaignFactory',
        functionName: 'getActiveCampaigns',
        args: [offset, limit],
    });
}

/** Campaign IDs created by a given institution. */
export function useInstitutionCampaigns(institutionAddress?: `0x${string}`) {
    return useContractRead({
        contractName: 'CampaignFactory',
        functionName: 'getInstitutionCampaigns',
        args: institutionAddress ? [institutionAddress] : undefined,
        enabled: !!institutionAddress,
    });
}

/** Progress percentage (0-100) for a campaign. */
export function useCampaignProgress(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'CampaignFactory',
        functionName: 'getCampaignProgress',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

/** Donation amount a specific donor has given to a campaign. */
export function useDonationAmount(campaignId: bigint | undefined, donor?: `0x${string}`) {
    return useContractRead({
        contractName: 'CampaignFactory',
        functionName: 'getDonationAmount',
        args: campaignId !== undefined && donor ? [campaignId, donor] : undefined,
        enabled: campaignId !== undefined && !!donor,
    });
}

/**
 * Create a new fundraising campaign.
 * Requires: CAMPAIGN_STAKE = 0.025 ETH sent as `value`.
 * `duration` is in seconds (e.g. 30 days = 30 * 86400).
 */
export function useCreateCampaign() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const create = (
        title: string,
        description: string,
        category: string,
        ipfsMetadata: string,
        goalEth: string,
        durationSeconds: number
    ) => {
        writeContract({
            address: CONTRACT_ADDRESSES.CampaignFactory,
            abi: ABIS.CampaignFactory as unknown[],
            functionName: 'createCampaign',
            args: [title, description, category, ipfsMetadata, parseEther(goalEth), BigInt(durationSeconds)],
            value: parseEther('0.025'), // CAMPAIGN_STAKE
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { create, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Donate ETH to an active campaign via CampaignFactory.
 * Funds are forwarded to EscrowManager internally by the contract.
 */
export function useDonate(campaignId: bigint | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const donate = (ethAmount: string) => {
        if (campaignId === undefined) return;
        writeContract({
            address: CONTRACT_ADDRESSES.CampaignFactory,
            abi: ABIS.CampaignFactory as unknown[],
            functionName: 'donate',
            args: [campaignId],
            value: parseEther(ethAmount),
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { donate, isPending, isConfirming, isSuccess, error, hash };
}

/** End an expired campaign (callable by anyone after the deadline). */
export function useEndCampaign() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const end = (campaignId: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.CampaignFactory,
            abi: ABIS.CampaignFactory as unknown[],
            functionName: 'endCampaign',
            args: [campaignId],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { end, isPending, isConfirming, isSuccess, error, hash };
}

// ─── Escrow Manager ───────────────────────────────────────────────────────────

/** Current escrow balance for a campaign. */
export function useCampaignEscrowBalance(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'EscrowManager',
        functionName: 'getBalance',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

/** A specific donor's locked balance for a campaign (for refund display). */
export function useDonorEscrowBalance(campaignId: bigint | undefined, donor?: `0x${string}`) {
    return useContractRead({
        contractName: 'EscrowManager',
        functionName: 'getDonorBalance',
        args: campaignId !== undefined && donor ? [campaignId, donor] : undefined,
        enabled: campaignId !== undefined && !!donor,
    });
}

/** Whether refunds are enabled for a campaign. */
export function useIsRefundEnabled(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'EscrowManager',
        functionName: 'isRefundEnabled',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

/** Claim a refund for a failed/cancelled campaign. */
export function useClaimRefund() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const claimRefund = (campaignId: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.EscrowManager,
            abi: ABIS.EscrowManager as unknown[],
            functionName: 'claimRefund',
            args: [campaignId],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { claimRefund, isPending, isConfirming, isSuccess, error, hash };
}

// ─── User Registry ────────────────────────────────────────────────────────────

/** Get a user's full profile (role, history, etc.). */
export function useUserProfile(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'UserRegistry',
        functionName: 'getProfile',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/** Suggest a role for a new user based on on-chain history. */
export function useSuggestRole(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'UserRegistry',
        functionName: 'suggestRole',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/** Check whether a user has already selected a role. */
export function useHasSelectedRole(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'UserRegistry',
        functionName: 'hasSelectedRole',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/**
 * Select or switch a role on UserRegistry.
 * role: 1 = Institution, 2 = Donor
 */
export function useSelectRole() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const select = (role: 1 | 2) => {
        writeContract({
            address: CONTRACT_ADDRESSES.UserRegistry,
            abi: ABIS.UserRegistry as unknown[],
            functionName: 'selectRole',
            args: [role],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { select, isPending, isConfirming, isSuccess, error, hash };
}


// ─── Donation NFT ─────────────────────────────────────────────────────────────

/** Number of NFTs held by a donor. */
export function useNFTBalance(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'DonationNFT',
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/** All token IDs a donor holds (their impact portfolio). */
export function useDonorReceipts(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'DonationNFT',
        functionName: 'getDonorReceipts',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

/** Get the NFT receipt data for a specific token ID. */
export function useNFTReceipt(tokenId: bigint | undefined) {
    return useContractRead({
        contractName: 'DonationNFT',
        functionName: 'getReceipt',
        args: tokenId !== undefined ? [tokenId] : undefined,
        enabled: tokenId !== undefined,
    });
}

// ─── Treasury ─────────────────────────────────────────────────────────────────
export function useTreasuryBalance() {
    return useContractRead({ contractName: 'Treasury', functionName: 'getBalance' });
}

export function useTreasuryStats() {
    return useContractRead({ contractName: 'Treasury', functionName: 'getStats' });
}

// ─── Proof Validator ──────────────────────────────────────────────────────────

/** Get proof status for a campaign. */
export function useProofInfo(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'ProofValidator',
        functionName: 'getProof',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

/**
 * Submit a proof-of-impact for a completed campaign.
 * Requires STORAGE_FEE = 0.01 ETH.
 * All hash args are IPFS CIDs (strings).
 */
export function useSubmitProof() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const submit = (
        campaignId: bigint,
        ipfsHash: string,
        receiptsHash: string,
        photosHash: string,
        metricsHash: string
    ) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ProofValidator,
            abi: ABIS.ProofValidator as unknown[],
            functionName: 'submitProof',
            args: [campaignId, ipfsHash, receiptsHash, photosHash, metricsHash],
            value: parseEther('0.01'), // STORAGE_FEE
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { submit, isPending, isConfirming, isSuccess, error, hash };
}

/** Finalize a proof after the 48-hour challenge window. Callable by anyone. */
export function useFinalizeProof() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const finalizeProof = (campaignId: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ProofValidator,
            abi: ABIS.ProofValidator as unknown[],
            functionName: 'finalizeProof',
            args: [campaignId],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { finalizeProof, isPending, isConfirming, isSuccess, error, hash };
}

/** Challenge a recently submitted proof (requires 1000 PAT balance). */
export function useChallengeProof() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const challenge = (campaignId: bigint, reason: string) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ProofValidator,
            abi: ABIS.ProofValidator as unknown[],
            functionName: 'challengeProof',
            args: [campaignId, reason],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { challenge, isPending, isConfirming, isSuccess, error, hash };
}

/** Vote on an active proof dispute. */
export function useVoteOnDispute() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const vote = (disputeId: bigint, approve: boolean) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ProofValidator,
            abi: ABIS.ProofValidator as unknown[],
            functionName: 'voteOnDispute',
            args: [disputeId, approve],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { vote, isPending, isConfirming, isSuccess, error, hash };
}

/** Claim voting reward after a resolved dispute. */
export function useClaimVotingReward() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const claim = (disputeId: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ProofValidator,
            abi: ABIS.ProofValidator as unknown[],
            functionName: 'claimVotingReward',
            args: [disputeId],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { claim, isPending, isConfirming, isSuccess, error, hash };
}

// ─── Governance DAO ───────────────────────────────────────────────────────────

/** Total proposals ever created. */
export function useProposalCount() {
    return useContractRead({ contractName: 'GovernanceDAO', functionName: 'proposalCounter' });
}

/** Details of a specific proposal. */
export function useProposalInfo(proposalId: bigint | undefined) {
    return useContractRead({
        contractName: 'GovernanceDAO',
        functionName: 'getProposal',
        args: proposalId !== undefined ? [proposalId] : undefined,
        enabled: proposalId !== undefined,
    });
}

/** All currently active proposal IDs. */
export function useActiveProposals() {
    return useContractRead({ contractName: 'GovernanceDAO', functionName: 'getActiveProposals' });
}

/** Current quorum requirement in PAT tokens. */
export function useQuorumVotes() {
    return useContractRead({ contractName: 'GovernanceDAO', functionName: 'getQuorumVotes' });
}

/**
 * Cast a vote on a governance proposal.
 * voteType: 0 = Against, 1 = For, 2 = Abstain  (uint8 — NOT boolean)
 */
export function useCastVote() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const vote = (proposalId: bigint, voteType: 0 | 1 | 2) => {
        writeContract({
            address: CONTRACT_ADDRESSES.GovernanceDAO,
            abi: ABIS.GovernanceDAO as unknown[],
            functionName: 'castVote',
            args: [proposalId, voteType],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { vote, isPending, isConfirming, isSuccess, error, hash };
}

/** Finalize a proposal after the voting period ends. */
export function useFinalizeProposal() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const finalize = (proposalId: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.GovernanceDAO,
            abi: ABIS.GovernanceDAO as unknown[],
            functionName: 'finalizeProposal',
            args: [proposalId],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    return { finalize, isPending, isConfirming, isSuccess, error, hash };
}
