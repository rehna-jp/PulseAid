'use client';

import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { usePATBalance, useProposalCount, useCastVote } from '@/hooks/useContracts';
import { formatEther } from 'viem';
import { useState } from 'react';
import {
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    AlertTriangle,
    ExternalLink,
    TrendingUp,
    Users,
    Coins,
} from 'lucide-react';

const mockProposals = [
    {
        id: 0n,
        title: 'Reduce minimum institution stake from 0.1 ETH to 0.01 ETH',
        description:
            'Lowering the registration threshold will enable smaller grassroots organizations in low-income countries to participate in PulseAid without prohibitive upfront costs.',
        proposer: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        forVotes: 12400n,
        againstVotes: 3200n,
        deadline: '2026-03-15',
        status: 'Active',
        category: 'Parameters',
    },
    {
        id: 1n,
        title: 'Integrate Worldcoin ID verification for donor KYC',
        description:
            'Adding optional Worldcoin identity proof for donors would allow institutions to restrict campaigns to verified humans only, preventing Sybil attacks on donation matching.',
        proposer: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        forVotes: 8900n,
        againstVotes: 7100n,
        deadline: '2026-03-22',
        status: 'Active',
        category: 'Feature',
    },
    {
        id: 2n,
        title: 'Add USDC as accepted donation currency',
        description:
            'Supporting USDC stablecoin donations alongside ETH would reduce donor exposure to volatility and increase accessibility for new crypto users.',
        proposer: '0x53d284357ec70cE289D6D64134DfAc8E511c8a3',
        forVotes: 21000n,
        againstVotes: 4500n,
        deadline: '2026-02-28',
        status: 'Passing',
        category: 'Treasury',
    },
    {
        id: 3n,
        title: 'Establish PulseAid Grants Program for new institutions',
        description:
            'Allocate 5% of platform fees to a grants fund that helps new NGOs cover their initial stake requirements, funded by treasury surplus.',
        proposer: '0x1234567890AbcdEF1234567890aBcdef12345678',
        forVotes: 15600n,
        againstVotes: 9800n,
        deadline: '2026-02-14',
        status: 'Passed',
        category: 'Treasury',
    },
];

const statusColors: Record<string, string> = {
    Active: '#3b82f6',
    Passing: '#10b981',
    Passed: '#10b981',
    Defeated: '#ef4444',
    Pending: '#f59e0b',
};

function ProposalCard({ proposal }: { proposal: (typeof mockProposals)[0] }) {
    const { isPending, isConfirming, isSuccess, error, vote, hash } = useCastVote();
    const [voted, setVoted] = useState<'for' | 'against' | null>(null);
    const { isConnected } = useAccount();

    const totalVotes = Number(proposal.forVotes + proposal.againstVotes);
    const forPct = totalVotes > 0 ? Math.round((Number(proposal.forVotes) / totalVotes) * 100) : 0;
    const againstPct = 100 - forPct;
    const color = statusColors[proposal.status] || '#8a9bc0';
    const daysLeft = Math.max(0, Math.round((new Date(proposal.deadline).getTime() - Date.now()) / 86400000));
    const isExpired = daysLeft === 0;

    const handleVote = (support: boolean) => {
        if (!isConnected) return;
        setVoted(support ? 'for' : 'against');
        vote(proposal.id, support ? 1 : 0);
    };

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <div style={{ padding: '24px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                            padding: '3px 10px', borderRadius: '100px',
                            background: `${color}18`, color, border: `1px solid ${color}30`,
                        }}>
                            {proposal.status}
                        </span>
                        <span style={{
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                            padding: '3px 10px', borderRadius: '100px',
                            background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)',
                        }}>
                            {proposal.category}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <Clock size={12} />
                        {isExpired ? 'Ended' : `${daysLeft}d left`}
                    </div>
                </div>

                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: 1.35, marginBottom: '10px' }}>
                    #{String(proposal.id + 1n)} — {proposal.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '20px' }}>
                    {proposal.description}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'monospace' }}>
                    Proposed by {proposal.proposer.slice(0, 8)}…{proposal.proposer.slice(-6)}
                </p>

                {/* Vote bars */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>For — {forPct}%</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>Against — {againstPct}%</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '100px', background: 'rgba(239,68,68,0.3)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${forPct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '100px', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        <span>{Number(proposal.forVotes).toLocaleString()} PAT</span>
                        <span>{Number(proposal.againstVotes).toLocaleString()} PAT</span>
                    </div>
                </div>

                {/* Voting buttons */}
                {isSuccess && hash ? (
                    <div style={{ textAlign: 'center' }}>
                        <a href={`https://sepolia.arbiscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                            <CheckCircle size={14} /> Vote Recorded — View on Arbiscan <ExternalLink size={13} />
                        </a>
                    </div>
                ) : !isConnected ? (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Connect wallet to vote
                    </p>
                ) : isExpired || proposal.status === 'Passed' || proposal.status === 'Defeated' ? (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Voting has ended
                    </p>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleVote(true)}
                                disabled={isPending || isConfirming}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                                    background: voted === 'for' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.08)',
                                    border: `1px solid ${voted === 'for' ? '#10b981' : 'rgba(16,185,129,0.3)'}`,
                                    color: '#10b981', fontWeight: 700, fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    transition: 'all 0.2s',
                                    opacity: isPending || isConfirming ? 0.7 : 1,
                                }}
                            >
                                {isPending && voted === 'for' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                                Vote For
                            </button>
                            <button
                                onClick={() => handleVote(false)}
                                disabled={isPending || isConfirming}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                                    background: voted === 'against' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
                                    border: `1px solid ${voted === 'against' ? '#ef4444' : 'rgba(239,68,68,0.3)'}`,
                                    color: '#fca5a5', fontWeight: 700, fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    transition: 'all 0.2s',
                                    opacity: isPending || isConfirming ? 0.7 : 1,
                                }}
                            >
                                {isPending && voted === 'against' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={14} />}
                                Vote Against
                            </button>
                        </div>
                        {error && (
                            <div style={{ display: 'flex', gap: '8px', color: '#fca5a5', fontSize: '12px', marginTop: '10px', alignItems: 'flex-start' }}>
                                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                                {error.message.split('\n')[0]}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function GovernancePage() {
    const { address, isConnected } = useAccount();
    const { data: patBalance } = usePATBalance(address);
    const { data: proposalCount } = useProposalCount();

    const patFormatted = patBalance ? parseFloat(formatEther(patBalance as bigint)).toFixed(2) : '0.00';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 60px' }}>
                {/* Header */}
                <div style={{ marginBottom: '36px' }}>
                    <span className="badge badge-purple" style={{ marginBottom: '14px' }}>
                        <Activity size={12} /> On-Chain Governance
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, marginBottom: '8px' }}>
                                Governance <span className="gradient-text">DAO</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                                PAT token holders vote on proposals that shape the PulseAid platform.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                    {[
                        { icon: Activity, label: 'Active Proposals', value: mockProposals.filter(p => p.status === 'Active' || p.status === 'Passing').length, color: '#3b82f6' },
                        { icon: Coins, label: 'Your PAT Votes', value: `${patFormatted} PAT`, color: '#f59e0b' },
                        { icon: Users, label: 'Total Proposals', value: proposalCount !== undefined ? String(proposalCount) : mockProposals.length, color: '#8b5cf6' },
                        { icon: TrendingUp, label: 'Quorum', value: '10,000 PAT', color: '#10b981' },
                    ].map((s) => (
                        <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${s.color}15`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <s.icon size={18} color={s.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Wallet prompt */}
                {!isConnected && (
                    <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <p style={{ color: '#93c5fd', fontSize: '14px' }}>Connect your wallet to vote with your PAT tokens.</p>
                        <ConnectKitButton />
                    </div>
                )}

                {/* Proposals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {mockProposals.map((proposal) => (
                        <ProposalCard key={String(proposal.id)} proposal={proposal} />
                    ))}
                </div>
            </div>
        </div>
    );
}
