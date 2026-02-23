'use client';

import Navbar from '@/components/Navbar';
import {
    Shield,
    Globe,
    Star,
    CheckCircle,
    Building2,
    TrendingUp,
    ArrowRight,
    Search,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const mockInstitutions = [
    {
        id: '0x1a2b',
        name: 'WaterAid Nigeria',
        description: 'Bringing clean water access to underserved communities across Nigeria through sustainable borehole infrastructure.',
        website: 'https://wateraid.ng',
        category: 'Water & Sanitation',
        campaignsCount: 4,
        totalRaised: '180.5',
        reputationScore: 98,
        verified: true,
        color: '#3b82f6',
    },
    {
        id: '0x2c3d',
        name: 'Lagos Relief Foundation',
        description: 'Emergency response and relief services for disaster-affected families in Lagos and surrounding areas.',
        website: 'https://lagosrelief.org',
        category: 'Emergency Relief',
        campaignsCount: 7,
        totalRaised: '420.2',
        reputationScore: 95,
        verified: true,
        color: '#f59e0b',
    },
    {
        id: '0x4e5f',
        name: 'CodeBridge Africa',
        description: 'Digital literacy, coding education, and tech career pathways for underserved youth across West Africa.',
        website: 'https://codebridge.africa',
        category: 'Education',
        campaignsCount: 2,
        totalRaised: '56.3',
        reputationScore: 91,
        verified: true,
        color: '#8b5cf6',
    },
    {
        id: '0x6a7b',
        name: 'HealthBridge NG',
        description: 'Supplying rural health clinics with essential medicine, equipment, and healthcare professional training.',
        website: 'https://healthbridge.ng',
        category: 'Healthcare',
        campaignsCount: 5,
        totalRaised: '211.7',
        reputationScore: 94,
        verified: true,
        color: '#10b981',
    },
    {
        id: '0x8c9d',
        name: 'AgriBoost Foundation',
        description: 'Empowering smallholder farmers with modern agricultural tools, seeds, and market access across rural Nigeria.',
        website: 'https://agriboost.ng',
        category: 'Agriculture',
        campaignsCount: 3,
        totalRaised: '88.1',
        reputationScore: 87,
        verified: true,
        color: '#06b6d4',
    },
    {
        id: '0xae1f',
        name: 'ShelterFirst Initiative',
        description: 'Building affordable, climate-resilient housing for low-income families displaced by flooding and urban poverty.',
        website: 'https://shelterfirst.org',
        category: 'Housing',
        campaignsCount: 1,
        totalRaised: '33.4',
        reputationScore: 82,
        verified: true,
        color: '#ec4899',
    },
];

const categories = ['All', 'Water & Sanitation', 'Emergency Relief', 'Education', 'Healthcare', 'Agriculture', 'Housing'];

export default function InstitutionsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filtered = mockInstitutions.filter((i) => {
        const matchesSearch =
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.description.toLowerCase().includes(search.toLowerCase());
        const matchesCat = selectedCategory === 'All' || i.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 60px' }}>
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '20px',
                        marginBottom: '36px',
                    }}
                >
                    <div>
                        <span className="badge badge-blue" style={{ marginBottom: '14px' }}>
                            <Shield size={12} /> Verified Institutions
                        </span>
                        <h1
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: 'clamp(26px, 4vw, 44px)',
                                fontWeight: 700,
                                marginBottom: '8px',
                            }}
                        >
                            Trusted <span className="gradient-text">Organizations</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                            Every institution here is staked, verified, and tracked on-chain.
                        </p>
                    </div>
                    <Link href="/institutions/register">
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            Register Your Institution
                            <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>

                {/* Search */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search
                            size={15}
                            color="var(--text-muted)"
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Search institutions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '100px',
                                    border: selectedCategory === cat ? '1px solid #3b82f6' : '1px solid var(--border)',
                                    background: selectedCategory === cat ? 'rgba(59,130,246,0.1)' : 'transparent',
                                    color: selectedCategory === cat ? '#93c5fd' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary stats */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '36px',
                    }}
                >
                    {[
                        { label: 'Verified Institutions', value: mockInstitutions.length, icon: Shield, color: '#3b82f6' },
                        { label: 'Total Raised', value: `${mockInstitutions.reduce((a, i) => a + parseFloat(i.totalRaised), 0).toFixed(0)} ETH`, icon: TrendingUp, color: '#10b981' },
                        { label: 'Total Campaigns', value: mockInstitutions.reduce((a, i) => a + i.campaignsCount, 0), icon: Building2, color: '#8b5cf6' },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="stat-card"
                            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                        >
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '10px',
                                    background: `${s.color}15`,
                                    border: `1px solid ${s.color}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <s.icon size={18} color={s.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {s.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Institution Cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {filtered.map((inst) => (
                        <div key={inst.id} className="glass-card" style={{ padding: 0 }}>
                            {/* Color stripe */}
                            <div style={{ height: '4px', borderRadius: '16px 16px 0 0', background: `linear-gradient(90deg, ${inst.color}, transparent)` }} />

                            <div style={{ padding: '24px' }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '12px',
                                            background: `${inst.color}18`,
                                            border: `1px solid ${inst.color}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Building2 size={22} color={inst.color} />
                                    </div>
                                    {inst.verified && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '4px 10px' }}>
                                            <CheckCircle size={12} color="#10b981" />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.04em' }}>VERIFIED</span>
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>
                                    {inst.name}
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {inst.category}
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '20px' }}>
                                    {inst.description}
                                </p>

                                {/* Stats row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Campaigns', value: inst.campaignsCount },
                                        { label: 'Raised', value: `${inst.totalRaised} ETH` },
                                        { label: 'Score', value: `${inst.reputationScore}/100` },
                                    ].map((s) => (
                                        <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 8px' }}>
                                            <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: inst.color }}>
                                                {s.value}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                                                {s.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <a
                                        href={inst.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ flex: 1 }}
                                    >
                                        <button
                                            className="btn-secondary"
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px' }}
                                        >
                                            <Globe size={13} />
                                            Website
                                        </button>
                                    </a>
                                    <Link href="/campaigns" style={{ flex: 1 }}>
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', fontSize: '13px', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px' }}
                                        >
                                            <Star size={13} />
                                            View Campaigns
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
                        <p style={{ fontSize: '16px' }}>No institutions found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
