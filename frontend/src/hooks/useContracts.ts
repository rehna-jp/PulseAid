'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { arbitrumSepolia } from 'wagmi/chains';

// ─── Reusable read helper ───────────────────────────────────────────────────
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

// ─── PAT Token ───────────────────────────────────────────────────────────────
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

// ─── Institution Registry ────────────────────────────────────────────────────
export function useInstitutionInfo(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'getInstitution',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

export function useIsInstitutionVerified(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'InstitutionRegistry',
        functionName: 'isVerified',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

export function useRegisterInstitution() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const register = (
        name: string,
        description: string,
        website: string,
        stakeAmount: string
    ) => {
        writeContract({
            address: CONTRACT_ADDRESSES.InstitutionRegistry,
            abi: ABIS.InstitutionRegistry as unknown[],
            functionName: 'registerInstitution',
            args: [name, description, website],
            value: parseEther(stakeAmount),
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { register, isPending, isConfirming, isSuccess, error, hash };
}

// ─── Campaign Factory ────────────────────────────────────────────────────────
export function useCampaignCount() {
    return useContractRead({ contractName: 'CampaignFactory', functionName: 'campaignCount' });
}

export function useCampaignInfo(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'CampaignFactory',
        functionName: 'getCampaign',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

export function useCreateCampaign() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const create = (
        title: string,
        description: string,
        goalAmount: string,
        deadlineDays: number,
        proofRequirements: string
    ) => {
        const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + deadlineDays * 86400);
        writeContract({
            address: CONTRACT_ADDRESSES.CampaignFactory,
            abi: ABIS.CampaignFactory as unknown[],
            functionName: 'createCampaign',
            args: [title, description, parseEther(goalAmount), deadlineTs, proofRequirements],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { create, isPending, isConfirming, isSuccess, error, hash };
}

// ─── Escrow Manager (Donations) ──────────────────────────────────────────────
export function useDonate(campaignId: bigint | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const donate = (ethAmount: string) => {
        if (campaignId === undefined) return;
        writeContract({
            address: CONTRACT_ADDRESSES.EscrowManager,
            abi: ABIS.EscrowManager as unknown[],
            functionName: 'deposit',
            args: [campaignId],
            value: parseEther(ethAmount),
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { donate, isPending, isConfirming, isSuccess, error, hash };
}

export function useCampaignBalance(campaignId: bigint | undefined) {
    return useContractRead({
        contractName: 'EscrowManager',
        functionName: 'getCampaignBalance',
        args: campaignId !== undefined ? [campaignId] : undefined,
        enabled: campaignId !== undefined,
    });
}

// ─── User Registry ───────────────────────────────────────────────────────────
export function useUserProfile(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'UserRegistry',
        functionName: 'getUser',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

// ─── Donation NFT ────────────────────────────────────────────────────────────
export function useNFTBalance(address?: `0x${string}`) {
    return useContractRead({
        contractName: 'DonationNFT',
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        enabled: !!address,
    });
}

// ─── Treasury ────────────────────────────────────────────────────────────────
export function useTreasuryBalance() {
    return useContractRead({ contractName: 'Treasury', functionName: 'getBalance' });
}

// ─── Proof Validator ─────────────────────────────────────────────────────────
export function useSubmitProof() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const submit = (campaignId: bigint, proof: `0x${string}`, proofData: string) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ProofValidator,
            abi: ABIS.ProofValidator as unknown[],
            functionName: 'submitProof',
            args: [campaignId, proof, proofData],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { submit, isPending, isConfirming, isSuccess, error, hash };
}

// ─── Governance DAO ──────────────────────────────────────────────────────────
export function useProposalCount() {
    return useContractRead({ contractName: 'GovernanceDAO', functionName: 'proposalCount' });
}

export function useProposalInfo(proposalId: bigint | undefined) {
    return useContractRead({
        contractName: 'GovernanceDAO',
        functionName: 'getProposal',
        args: proposalId !== undefined ? [proposalId] : undefined,
        enabled: proposalId !== undefined,
    });
}

export function useCastVote() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const vote = (proposalId: bigint, support: boolean) => {
        writeContract({
            address: CONTRACT_ADDRESSES.GovernanceDAO,
            abi: ABIS.GovernanceDAO as unknown[],
            functionName: 'castVote',
            args: [proposalId, support],
            chainId: arbitrumSepolia.id,
        });
    };

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    return { vote, isPending, isConfirming, isSuccess, error, hash };
}
