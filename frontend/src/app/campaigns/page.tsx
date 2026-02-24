'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import Navbar from '@/components/Navbar';
import { Search, Clock, Target, TrendingUp, Users, ArrowRight, Loader2 } from 'lucide-react';
import DonateModal from '@/components/DonateModal';
import { useCampaignCounter, useCampaignInfo, useActiveCampaigns } from '@/hooks/useContracts';

// Category colours — assigned by cycling through this palette
const CATEGORY_COLORS = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899',
];

// Normalise the raw tuple returned by getCampaign() into a friendly shape
function useAllCampaigns() {
    const { data: activeCampaignIdsRaw, isLoading: loadingIds } = useActiveCampaigns(0n, 50n);
    const activeCampaignIds = (activeCampaignIdsRaw as bigint[] | undefined) ?? [];

    // Fetch each campaign in parallel (up to 50). wagmi hooks must be called at the
    // top-level, so we use a fixed-size array of 50 possible hook calls and slice later.
    // For a more dynamic approach, consider a multi-call contract or a subgraph.
    const c0 = useCampaignInfo(activeCampaignIds[0]);
    const c1 = useCampaignInfo(activeCampaignIds[1]);
    const c2 = useCampaignInfo(activeCampaignIds[2]);
    const c3 = useCampaignInfo(activeCampaignIds[3]);
    const c4 = useCampaignInfo(activeCampaignIds[4]);
    const c5 = useCampaignInfo(activeCampaignIds[5]);
    const c6 = useCampaignInfo(activeCampaignIds[6]);
    const c7 = useCampaignInfo(activeCampaignIds[7]);
    const c8 = useCampaignInfo(activeCampaignIds[8]);
    const c9 = useCampaignInfo(activeCampaignIds[9]);
    const c10 = useCampaignInfo(activeCampaignIds[10]);
    const c11 = useCampaignInfo(activeCampaignIds[11]);
    const c12 = useCampaignInfo(activeCampaignIds[12]);
    const c13 = useCampaignInfo(activeCampaignIds[13]);
    const c14 = useCampaignInfo(activeCampaignIds[14]);
    const c15 = useCampaignInfo(activeCampaignIds[15]);
    const c16 = useCampaignInfo(activeCampaignIds[16]);
    const c17 = useCampaignInfo(activeCampaignIds[17]);
    const c18 = useCampaignInfo(activeCampaignIds[18]);
    const c19 = useCampaignInfo(activeCampaignIds[19]);

    const raw = [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19];

    const campaigns = activeCampaignIds.slice(0, 20).flatMap((id, i) => {
        const d = raw[i]?.data as readonly [string, string, string, string, bigint, bigint, bigint, number] | undefined;
        if (!d) return [];
        const [institution, title, description, category, goal, raised, deadline] = d;
        return [{
            id,
            institution: `${institution.slice(0, 6)}…${institution.slice(-4)}`,
            institutionRaw: institution as `0x${string}`,
            title,
            description,
            category,
            goal: formatEther(goal),
            raised: formatEther(raised),
            deadline: new Date(Number(deadline) * 1000).toISOString().split('T')[0],
            donors: 0, // Would need separate on-chain call; show 0 for now
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }];
    });

    const isLoading = loadingIds || raw.slice(0, activeCampaignIds.length).some(r => r.isLoading);
    return { campaigns, isLoading };
}

const ALL_CATEGORIES = 'All';

export default function CampaignsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
    const [selectedCampaign, setSelectedCampaign] = useState<ReturnType<typeof useAllCampaigns>['campaigns'][0] | null>(null);

    const { campaigns, isLoading } = useAllCampaigns();

    // Derive unique category list from on-chain data
    const categories = [
        ALL_CATEGORIES,
        ...Array.from(new Set(campaigns.map(c => c.category))).filter(Boolean),
    ];

    const filtered = campaigns.filter(c => {
        const matchesSearch =
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.institution.toLowerCase().includes(search.toLowerCase()) ||
            c.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === ALL_CATEGORIES || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 60px' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <span className="badge badge-green" style={{ marginBottom: '16px' }}>
                        <TrendingUp size={12} /> Live Campaigns
                    </span>
                    <h1
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 'clamp(28px, 4vw, 44px)',
                            fontWeight: 700,
                            marginBottom: '8px',
                        }}
                    >
                        Active <span className="gradient-text">Campaigns</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Browse verified campaigns and donate directly on-chain. Every fund release is proof-gated.
                    </p>
                </div>

                {/* Search + Filter */}
                <div
                    style={{
                        display: 'flex',
                        gap: '16px',
                        marginBottom: '32px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    {/* Search input */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                        <Search
                            size={16}
                            color="var(--text-muted)"
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '42px' }}
                            placeholder="Search campaigns or institutions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Categories */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    border: selectedCategory === cat ? '1px solid #10b981' : '1px solid var(--border)',
                                    background: selectedCategory === cat ? 'rgba(16,185,129,0.1)' : 'transparent',
                                    color: selectedCategory === cat ? '#10b981' : 'var(--text-secondary)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading state */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <Loader2 size={40} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: '15px' }}>Loading on-chain campaigns…</p>
                    </div>
                )}

                {/* Campaign Cards */}
                {!isLoading && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '24px',
                        }}
                    >
                        {filtered.map((campaign) => {
                            const goalNum = parseFloat(campaign.goal);
                            const raisedNum = parseFloat(campaign.raised);
                            const pct = goalNum > 0 ? Math.min(Math.round((raisedNum / goalNum) * 100), 100) : 0;
                            const daysLeft = Math.max(
                                0,
                                Math.round((new Date(campaign.deadline).getTime() - Date.now()) / 86400000)
                            );

                            return (
                                <div key={String(campaign.id)} className="glass-card" style={{ padding: '0' }}>
                                    {/* Top color stripe */}
                                    <div
                                        style={{
                                            height: '4px',
                                            borderRadius: '16px 16px 0 0',
                                            background: `linear-gradient(90deg, ${campaign.color}, transparent)`,
                                        }}
                                    />

                                    <div style={{ padding: '24px' }}>
                                        {/* Category + Days left */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '16px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    color: campaign.color,
                                                    background: `${campaign.color}15`,
                                                    padding: '3px 10px',
                                                    borderRadius: '100px',
                                                    border: `1px solid ${campaign.color}30`,
                                                }}
                                            >
                                                {campaign.category || 'General'}
                                            </span>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                <Clock size={12} />
                                                {daysLeft}d left
                                            </div>
                                        </div>

                                        {/* Title — links to detail page */}
                                        <Link href={`/campaigns/${String(campaign.id)}`} style={{ textDecoration: 'none' }}>
                                            <h3
                                                style={{
                                                    fontFamily: "'Space Grotesk', sans-serif",
                                                    fontSize: '17px',
                                                    fontWeight: 700,
                                                    marginBottom: '8px',
                                                    lineHeight: 1.3,
                                                    color: 'var(--text-primary)',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = campaign.color)}
                                                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
                                            >
                                                {campaign.title}
                                            </h3>
                                        </Link>
                                        <p
                                            style={{
                                                color: 'var(--text-muted)',
                                                fontSize: '12px',
                                                marginBottom: '6px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            by {campaign.institution}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '13px',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.6,
                                                marginBottom: '20px',
                                            }}
                                        >
                                            {campaign.description}
                                        </p>

                                        {/* Progress */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '12px',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    <strong style={{ color: campaign.color, fontSize: '14px' }}>
                                                        {raisedNum.toFixed(4)} ETH
                                                    </strong>{' '}
                                                    raised
                                                </span>
                                                <span style={{ color: 'var(--text-muted)' }}>Goal: {parseFloat(campaign.goal).toFixed(2)} ETH</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${pct}%`,
                                                        background: `linear-gradient(90deg, ${campaign.color}, ${campaign.color}99)`,
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    textAlign: 'right',
                                                    fontSize: '11px',
                                                    color: 'var(--text-muted)',
                                                    marginTop: '4px',
                                                }}
                                            >
                                                {pct}%
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                                <Users size={13} />
                                                On-chain
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Link href={`/campaigns/${String(campaign.id)}`}>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        Details <ArrowRight size={12} />
                                                    </button>
                                                </Link>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '10px' }}
                                                    onClick={() => setSelectedCampaign(campaign)}
                                                >
                                                    Donate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isLoading && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                        <p style={{ fontSize: '16px' }}>
                            {campaigns.length === 0
                                ? 'No active campaigns found on-chain.'
                                : 'No campaigns match your search.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Donate Modal */}
            {selectedCampaign && (
                <DonateModal
                    campaign={selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                />
            )}
        </div>
    );
}
