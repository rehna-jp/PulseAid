'use client';

import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import DonateModal from '@/components/DonateModal';
import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

// Stub data — will be replaced with on-chain reads via useCampaignInfo
const mockCampaigns: Record<string, {
    id: bigint; title: string; institution: string; institutionAddr: string;
    description: string; fullDescription: string; goal: string; raised: string;
    currency: string; deadline: string; donors: number; category: string; color: string;
    proofRequirements: string; txHash: string;
}> = {
    '0': {
        id: 0n,
        title: 'Clean Water for Rural Ogun State',
        institution: 'WaterAid Nigeria',
        institutionAddr: '0x1a2b…4e5f',
        description: 'Bringing clean, potable water to 12 rural communities in Ogun State via borehole installations.',
        fullDescription: `Access to clean water remains one of the most pressing humanitarian challenges in rural Nigeria. Ogun State's 12 outlying communities—home to over 24,000 residents—rely on contaminated surface water sources, leading to preventable waterborne illnesses, high child mortality rates, and reduced agricultural productivity.

This campaign funds the drilling and installation of 6 solar-powered boreholes, each serving 2 communities. Each borehole installation includes:
• Aquifer survey and geological assessment
• Drill rig mobilization and casing
• Submersible pump with solar panel array
• Community water committee training
• 12-month maintenance support

Upon completion, we will submit a Reclaim Protocol ZK proof containing the government water authority's installation certificate, GPS verification of borehole locations, and community population records.`,
        goal: '50',
        raised: '32.4',
        currency: 'ETH',
        deadline: '2026-04-01',
        donors: 142,
        category: 'Water & Sanitation',
        color: '#3b82f6',
        proofRequirements: 'Reclaim Protocol proof of government water authority installation certificate with GPS verification',
        txHash: '0xabc123',
    },
};

export default function CampaignDetailPage() {
    const params = useParams();
    const id = String(params?.id ?? '0');
    const campaign = mockCampaigns[id] ?? mockCampaigns['0'];
    const [showDonate, setShowDonate] = useState(false);

    const pct = Math.min(Math.round((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100), 100);
    const daysLeft = Math.max(0, Math.round((new Date(campaign.deadline).getTime() - Date.now()) / 86400000));

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px 60px' }}>
                {/* Breadcrumb */}
                <Link
                    href="/campaigns"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', marginBottom: '28px' }}
                >
                    <ArrowLeft size={14} />
                    Back to Campaigns
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
                    {/* Left — Main content */}
                    <div>
                        {/* Color header */}
                        <div
                            style={{
                                height: '6px',
                                borderRadius: '100px',
                                background: `linear-gradient(90deg, ${campaign.color}, transparent)`,
                                marginBottom: '24px',
                            }}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <span style={{
                                fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                                padding: '4px 12px', borderRadius: '100px',
                                background: `${campaign.color}18`, color: campaign.color, border: `1px solid ${campaign.color}30`,
                            }}>
                                {campaign.category}
                            </span>
                            <span className="badge badge-green">
                                <CheckCircle size={11} /> Active
                            </span>
                        </div>

                        <h1
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: 'clamp(22px, 3vw, 36px)',
                                fontWeight: 800,
                                lineHeight: 1.2,
                                marginBottom: '10px',
                            }}
                        >
                            {campaign.title}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px', fontWeight: 600 }}>
                            by {campaign.institution} • {campaign.institutionAddr}
                        </p>

                        {/* Full description */}
                        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={15} color={campaign.color} />
                                About this campaign
                            </h3>
                            {campaign.fullDescription.split('\n\n').map((para, i) => (
                                <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8, marginBottom: i < campaign.fullDescription.split('\n\n').length - 1 ? '16px' : 0 }}>
                                    {para}
                                </p>
                            ))}
                        </div>

                        {/* Proof requirements */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '14px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={15} color="#10b981" />
                                Proof Requirements
                            </h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                                {campaign.proofRequirements}
                            </p>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={12} color="#10b981" />
                                Funds are held in escrow and only released after cryptographic proof verification.
                            </div>
                        </div>
                    </div>

                    {/* Right — Sticky donation panel */}
                    <div style={{ position: 'sticky', top: '90px' }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            {/* Progress */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: campaign.color, marginBottom: '4px' }}>
                                    {campaign.raised} ETH
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    raised of <strong style={{ color: 'var(--text-primary)' }}>{campaign.goal} ETH</strong> goal
                                </div>
                                <div className="progress-bar" style={{ height: '8px' }}>
                                    <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${campaign.color}, ${campaign.color}99)` }} />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>{pct}%</div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    { icon: Users, label: 'Donors', value: campaign.donors, color: '#3b82f6' },
                                    { icon: Clock, label: 'Days Left', value: daysLeft, color: '#f59e0b' },
                                    { icon: Target, label: 'Goal', value: `${campaign.goal} ETH`, color: '#8b5cf6' },
                                    { icon: Shield, label: 'Proof-Gated', value: 'Yes ✓', color: '#10b981' },
                                ].map((s) => (
                                    <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                                        <s.icon size={16} color={s.color} style={{ margin: '0 auto 6px' }} />
                                        <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Donate button */}
                            <button
                                className="btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
                                onClick={() => setShowDonate(true)}
                            >
                                <Heart size={15} />
                                Donate to this Campaign
                            </button>

                            {/* Institution proof link */}
                            <Link href={`/campaigns/${id}/proof`}>
                                <button
                                    className="btn-secondary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                >
                                    <Shield size={14} />
                                    Submit Proof (Institution)
                                </button>
                            </Link>

                            {/* On-chain link */}
                            <a
                                href={`https://sepolia.arbiscan.io/tx/${campaign.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}
                            >
                                <ExternalLink size={12} />
                                View on Arbiscan
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {showDonate && <DonateModal campaign={campaign} onClose={() => setShowDonate(false)} />}
        </div>
    );
}
