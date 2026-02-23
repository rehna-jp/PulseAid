'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';
import DonateModal from '@/components/DonateModal';
import TxStatus from '@/components/TxStatus';
import {
    useCampaignInfo,
    useProofInfo,
    useDonationAmount,
    useClaimRefund,
    useFinalizeProof,
} from '@/hooks/useContracts';
import {
    Clock,
    Users,
    Target,
    Shield,
    ArrowLeft,
    ExternalLink,
    Heart,
    CheckCircle,
    FileText,
    AlertCircle,
    Loader2,
    Check,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
    'Emergency': '#ef4444',
    'Health': '#8b5cf6',
    'Education': '#3b82f6',
    'Environment': '#10b981',
    'Water & Sanitation': '#06b6d4',
    'General': '#f59e0b',
};

export default function CampaignDetailPage() {
    const params = useParams();
    const { address } = useAccount();
    const id = BigInt(params?.id as string || '0');

    const [showDonate, setShowDonate] = useState(false);

    // ── On-chain Data ──
    const { data: campaignRaw, isLoading: loadingCampaign } = useCampaignInfo(id);
    const { data: proofRaw, isLoading: loadingProof } = useProofInfo(id);
    const { data: donationRaw } = useDonationAmount(id, address);

    // ── Mutations ──
    const { claimRefund, isPending: refundPending, isConfirming: refundConfirming, isSuccess: refundSuccess, error: refundError, hash: refundHash } = useClaimRefund(id);
    const { finalizeProof, isPending: finalizePending, isConfirming: finalizeConfirming, isSuccess: finalizeSuccess, error: finalizeError, hash: finalizeHash } = useFinalizeProof(id);

    if (loadingCampaign) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
        );
    }

    if (!campaignRaw) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Navbar />
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                    <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Campaign Not Found</h1>
                    <Link href="/campaigns" style={{ color: 'var(--accent-primary)', marginTop: '16px', display: 'block' }}>Return to Campaigns</Link>
                </div>
            </div>
        );
    }

    const [institution, title, description, category, goal, raised, deadline, status] = campaignRaw as [string, string, string, string, bigint, bigint, bigint, number];
    const isCancelled = status === 3;
    const isGoalReached = status === 1;
    const isEnded = status === 2;
    const isCompleted = status === 4;
    const isActive = status === 0;

    const userDonation = donationRaw ? formatEther(donationRaw as bigint) : '0';
    const canRefund = isCancelled && parseFloat(userDonation) > 0;

    const goalEth = formatEther(goal);
    const raisedEth = formatEther(raised);
    const pct = goal > 0n ? Number((raised * 100n) / goal) : 0;
    const daysLeft = Math.max(0, Math.round((Number(deadline) * 1000 - Date.now()) / 86400000));
    const campaignColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['General'];

    // ── Proof Handling ──
    const [proofIpfs, receiptsHash, photosHash, metricsHash, submittedAt, challengeEnd, proofStatus] = proofRaw ? (proofRaw as [string, string, string, string, bigint, bigint, number]) : ['', '', '', '', 0n, 0n, 0];
    const hasProof = submittedAt > 0n;
    const isChallengeActive = hasProof && Number(challengeEnd) * 1000 > Date.now();
    const canFinalize = hasProof && !isChallengeActive && proofStatus === 2; // AutoValidated and window passed

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px 60px' }}>
                <Link
                    href="/campaigns"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', marginBottom: '28px' }}
                >
                    <ArrowLeft size={14} /> Back to Campaigns
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
                    {/* Left Panel */}
                    <div>
                        <div style={{ height: '6px', borderRadius: '100px', background: `linear-gradient(90deg, ${campaignColor}, transparent)`, marginBottom: '24px' }} />

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '100px', background: `${campaignColor}18`, color: campaignColor, border: `1px solid ${campaignColor}30` }}>
                                {category}
                            </span>
                            <span className={`badge ${isActive ? 'badge-green' : isCancelled ? 'badge-red' : 'badge-blue'}`}>
                                {isActive ? 'Active' : isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : isGoalReached ? 'Goal Reached' : 'Ended'}
                            </span>
                        </div>

                        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '10px' }}>{title}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px', fontWeight: 600 }}>by {institution.slice(0, 6)}...{institution.slice(-4)}</p>

                        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={15} color={campaignColor} /> About this campaign
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>{description}</p>
                        </div>

                        {/* Proof Section */}
                        {hasProof ? (
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={15} color="#10b981" /> Work Verification Proof
                                    </h3>
                                    <span className="badge badge-purple">
                                        {proofStatus === 0 ? 'Submitted' : proofStatus === 2 ? 'Auto-Validated' : proofStatus === 3 ? 'Challenged' : proofStatus === 4 ? 'Approved' : 'Rejected'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Receipts IPFS</div>
                                        <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>{receiptsHash}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Photos/Metrics</div>
                                        <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>{photosHash}</div>
                                    </div>
                                </div>
                                {isChallengeActive && (
                                    <div style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                                        <Clock size={14} color="#f59e0b" />
                                        <span>Challenge period active until: {new Date(Number(challengeEnd) * 1000).toLocaleString()}</span>
                                    </div>
                                ) || canFinalize && (
                                    <div style={{ marginTop: '16px' }}>
                                        <button className="btn-primary" style={{ width: '100%' }} onClick={() => finalizeProof()}>Finalize Proof & Release Funds</button>
                                        <TxStatus isPending={finalizePending} isConfirming={finalizeConfirming} isSuccess={finalizeSuccess} error={finalizeError} hash={finalizeHash} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '14px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={15} color="var(--text-muted)" /> Proof Requirements
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>Transparency is key. Once the goal is reached and work is done, the institution must submit cryptographic proof of impact to release funds from escrow.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div style={{ position: 'sticky', top: '90px' }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: campaignColor, marginBottom: '4px' }}>{raisedEth} ETH</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>raised of <strong style={{ color: 'var(--text-primary)' }}>{goalEth} ETH</strong> goal</div>
                                <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${campaignColor}, ${campaignColor}99)` }} /></div>
                                <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>{pct}%</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    { icon: Users, label: 'Donors', value: 'Live', color: '#3b82f6' },
                                    { icon: Clock, label: 'Days Left', value: daysLeft, color: '#f59e0b' },
                                    { icon: Target, label: 'Goal', value: `${goalEth} ETH`, color: '#8b5cf6' },
                                    { icon: Shield, label: 'Proof-Gated', value: 'Yes ✓', color: '#10b981' },
                                ].map((s) => (
                                    <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                                        <s.icon size={16} color={s.color} style={{ margin: '0 auto 6px' }} />
                                        <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {isActive && (
                                <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }} onClick={() => setShowDonate(true)}>
                                    <Heart size={15} /> Donate to this Campaign
                                </button>
                            )}

                            {canRefund && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>
                                        Campaign cancelled. Your balance: <strong>{userDonation} ETH</strong>
                                    </div>
                                    <button className="btn-primary" style={{ width: '100%', background: '#ef4444', borderColor: '#ef4444' }} onClick={() => claimRefund()}>
                                        Claim Refund
                                    </button>
                                    <TxStatus isPending={refundPending} isConfirming={refundConfirming} isSuccess={refundSuccess} error={refundError} hash={refundHash} />
                                </div>
                            )}

                            {address?.toLowerCase() === institution.toLowerCase() && isEnded && !hasProof && (
                                <Link href={`/campaigns/${id}/proof`}>
                                    <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Shield size={14} /> Submit Proof
                                    </button>
                                </Link>
                            )}

                            <a href={`https://sepolia.arbiscan.io/address/0x...`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>
                                <ExternalLink size={12} /> View on Arbiscan
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {showDonate && <DonateModal campaign={{ id, title, institution, goal: goalEth, raised: raisedEth, color: campaignColor }} onClose={() => setShowDonate(false)} />}
        </div>
    );
}
