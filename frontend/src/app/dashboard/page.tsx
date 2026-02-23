'use client';

import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import {
    usePATBalance,
    useNFTBalance,
    useIsInstitutionVerified,
    useInstitutionInfo,
} from '@/hooks/useContracts';
import { formatEther } from 'viem';
import {
    Activity,
    Heart,
    Building2,
    Coins,
    Award,
    PlusCircle,
    ArrowRight,
    Shield,
} from 'lucide-react';
import Link from 'next/link';

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {label}
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color }}>{value}</p>
                </div>
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: '11px',
                        background: `${color}15`,
                        border: `1px solid ${color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon size={20} color={color} />
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { address, isConnected } = useAccount();

    const { data: patBalance } = usePATBalance(address);
    const { data: nftBalance } = useNFTBalance(address);
    const { data: isVerifiedData } = useIsInstitutionVerified(address);
    const { data: institutionInfo } = useInstitutionInfo(address);

    const patFormatted =
        patBalance !== undefined
            ? parseFloat(formatEther(patBalance as bigint)).toFixed(2)
            : '0.00';

    const nftCount = nftBalance !== undefined ? String(nftBalance) : '0';
    const isVerified = isVerifiedData ? Boolean(isVerifiedData) : false;
    const institutionName =
        institutionInfo && Array.isArray(institutionInfo) && institutionInfo[0]
            ? String(institutionInfo[0])
            : null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 60px' }}>
                {!isConnected ? (
                    /* ── Not connected ── */
                    <div
                        className="glass-card"
                        style={{ padding: '64px 40px', textAlign: 'center', maxWidth: '480px', margin: '60px auto' }}
                    >
                        <Activity size={44} color="var(--text-muted)" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', marginBottom: '10px' }}>
                            Connect your wallet
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
                            Connect to view your on-chain donation history, PAT token balance, and institution status.
                        </p>
                        <ConnectKitButton />
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ marginBottom: '36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h1
                                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: '4px' }}
                                    >
                                        {institutionName ? (
                                            <>
                                                {institutionName}
                                                {isVerified && (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            marginLeft: '12px',
                                                            fontSize: '12px',
                                                            padding: '3px 10px',
                                                            borderRadius: '100px',
                                                            background: 'rgba(16,185,129,0.12)',
                                                            border: '1px solid rgba(16,185,129,0.3)',
                                                            color: '#10b981',
                                                            verticalAlign: 'middle',
                                                        }}
                                                    >
                                                        <Shield size={11} /> Verified
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            'My Dashboard'
                                        )}
                                    </h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                                        {address?.slice(0, 6)}…{address?.slice(-4)}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {isVerified && (
                                        <Link href="/campaigns/create">
                                            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                                <PlusCircle size={15} />
                                                New Campaign
                                            </button>
                                        </Link>
                                    )}
                                    {!isVerified && (
                                        <Link href="/institutions/register">
                                            <button className="btn-secondary" style={{ fontSize: '14px' }}>
                                                Register Institution
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                marginBottom: '40px',
                            }}
                        >
                            <StatCard icon={Coins} label="PAT Balance" value={`${patFormatted} PAT`} color="#f59e0b" />
                            <StatCard icon={Award} label="Donation NFTs" value={nftCount} color="#8b5cf6" />
                            <StatCard
                                icon={Building2}
                                label="Institution"
                                value={isVerified ? 'Verified ✓' : 'Not Registered'}
                                color={isVerified ? '#10b981' : '#4a5a7a'}
                            />
                            <StatCard icon={Heart} label="Campaigns Supported" value="—" color="#3b82f6" />
                        </div>

                        {/* Quick Actions */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '20px',
                            }}
                        >
                            {/* Donate */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '10px',
                                            background: 'rgba(16,185,129,0.12)',
                                            border: '1px solid rgba(16,185,129,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Heart size={18} color="#10b981" />
                                    </div>
                                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>
                                        Donate to a Campaign
                                    </h3>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
                                    Browse active campaigns and donate ETH directly to verified institutions.
                                    Earn PAT tokens and Donation NFTs for every contribution.
                                </p>
                                <Link href="/campaigns">
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                    >
                                        Browse Campaigns
                                        <ArrowRight size={14} />
                                    </button>
                                </Link>
                            </div>

                            {/* Institution */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '10px',
                                            background: 'rgba(59,130,246,0.12)',
                                            border: '1px solid rgba(59,130,246,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Building2 size={18} color="#3b82f6" />
                                    </div>
                                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>
                                        Institution Portal
                                    </h3>
                                </div>
                                {isVerified ? (
                                    <>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
                                            Your institution is verified. Create campaigns, submit proofs, and manage your on-chain profile.
                                        </p>
                                        <Link href="/campaigns/create">
                                            <button
                                                className="btn-secondary"
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                            >
                                                <PlusCircle size={14} />
                                                Create Campaign
                                            </button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
                                            Register your organization to create campaigns and receive on-chain donations.
                                        </p>
                                        <Link href="/institutions/register">
                                            <button
                                                className="btn-secondary"
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                            >
                                                <ArrowRight size={14} />
                                                Register Institution
                                            </button>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Governance */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '10px',
                                            background: 'rgba(139,92,246,0.12)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Activity size={18} color="#8b5cf6" />
                                    </div>
                                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>
                                        Governance
                                    </h3>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
                                    Use your PAT tokens to vote on governance proposals and shape the
                                    future of the platform.
                                </p>
                                <Link href="/governance">
                                    <button
                                        className="btn-secondary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                    >
                                        <ArrowRight size={14} />
                                        View Proposals
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
