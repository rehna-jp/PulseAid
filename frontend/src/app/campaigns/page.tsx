'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Search, Clock, Target, TrendingUp, Users, ArrowRight } from 'lucide-react';
import DonateModal from '@/components/DonateModal';

// Mock campaigns until on-chain data is wired
const mockCampaigns = [
    {
        id: 0n,
        title: 'Clean Water for Rural Ogun State',
        institution: 'WaterAid Nigeria',
        description: 'Bringing clean, potable water to 12 rural communities in Ogun State via borehole installations.',
        goal: '50',
        raised: '32.4',
        currency: 'ETH',
        deadline: '2026-04-01',
        donors: 142,
        category: 'Water & Sanitation',
        color: '#3b82f6',
    },
    {
        id: 1n,
        title: 'Emergency Food Relief — Lagos Floods',
        institution: 'Lagos Relief Foundation',
        description: 'Providing 3-month food packages to 500 families displaced by recent flooding in Lagos.',
        goal: '30',
        raised: '28.7',
        currency: 'ETH',
        deadline: '2026-03-15',
        donors: 380,
        category: 'Emergency Relief',
        color: '#f59e0b',
    },
    {
        id: 2n,
        title: 'Digital Literacy for 1000 Youths',
        institution: 'CodeBridge Africa',
        description: 'Equipping 1,000 underserved Nigerian youths with coding and digital skills scholarships.',
        goal: '20',
        raised: '6.1',
        currency: 'ETH',
        deadline: '2026-05-30',
        donors: 67,
        category: 'Education',
        color: '#8b5cf6',
    },
    {
        id: 3n,
        title: 'Medical Supplies for Rural Clinics',
        institution: 'HealthBridge NG',
        description: 'Stocking 15 rural health clinics in Benue State with essential medicine and equipment.',
        goal: '40',
        raised: '22.0',
        currency: 'ETH',
        deadline: '2026-04-20',
        donors: 203,
        category: 'Healthcare',
        color: '#10b981',
    },
];

const categories = ['All', 'Water & Sanitation', 'Emergency Relief', 'Education', 'Healthcare'];

export default function CampaignsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedCampaign, setSelectedCampaign] = useState<(typeof mockCampaigns)[0] | null>(null);

    const filtered = mockCampaigns.filter((c) => {
        const matchesSearch =
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.institution.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
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

                {/* Campaign Cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '24px',
                    }}
                >
                    {filtered.map((campaign) => {
                        const pct = Math.min(
                            Math.round((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100),
                            100
                        );
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
                                            {campaign.category}
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
                                                    {campaign.raised} ETH
                                                </strong>{' '}
                                                raised
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>Goal: {campaign.goal} ETH</span>
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
                                            {campaign.donors} donors
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

                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                        <p style={{ fontSize: '16px' }}>No campaigns found matching your search.</p>
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
