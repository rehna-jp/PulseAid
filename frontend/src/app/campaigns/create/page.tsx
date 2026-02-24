'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useCreateCampaign, useIsInstitutionVerified } from '@/hooks/useContracts';
import {
    FileText,
    Target,
    Calendar,
    Shield,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function CreateCampaignPage() {
    const { address, isConnected } = useAccount();
    const { data: isVerified } = useIsInstitutionVerified(address);
    const { create, isPending, isConfirming, isSuccess, error, hash } = useCreateCampaign();

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'Health',
        goal: '',
        days: '30',
        proofRequirements: '',
    });

    const update = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Hook expects: title, description, category, ipfsMetadata, goalEth, durationSeconds
        const durationSeconds = parseInt(form.days) * 86400;
        create(
            form.title,
            form.description,
            form.category,
            form.proofRequirements,
            form.goal,
            durationSeconds
        );
    };

    const Field = ({
        icon: Icon,
        label,
        children,
    }: {
        icon: React.ElementType;
        label: string;
        children: React.ReactNode;
    }) => (
        <div style={{ marginBottom: '20px' }}>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                }}
            >
                <Icon size={13} />
                {label}
            </label>
            {children}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div style={{ maxWidth: '660px', margin: '0 auto', padding: '100px 24px 60px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <span className="badge badge-green" style={{ marginBottom: '14px' }}>
                        <Shield size={12} /> Institution Portal
                    </span>
                    <h1
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 'clamp(26px, 4vw, 40px)',
                            fontWeight: 700,
                            marginBottom: '10px',
                        }}
                    >
                        Create a <span className="gradient-text">Campaign</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Define your fundraising goal and proof requirements. Donors will contribute ETH held in escrow until you submit verified proof.
                    </p>
                </div>

                {!isConnected ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Connect your wallet to create a campaign.</p>
                        <ConnectKitButton />
                    </div>
                ) : !isVerified ? (
                    <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
                        <Shield size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '8px' }}>
                            Institution Verification Required
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            Only verified institutions can create campaigns. Register your organization first.
                        </p>
                        <Link href="/institutions/register">
                            <button className="btn-primary">Register Institution</button>
                        </Link>
                    </div>
                ) : isSuccess ? (
                    <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                        <CheckCircle size={52} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px', marginBottom: '10px' }}>
                            Campaign Live!
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                            Your campaign is now live on Arbitrum Sepolia. Donors can start
                            contributing immediately.
                        </p>
                        {hash && (
                            <a
                                href={`https://sepolia.arbiscan.io/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
                            >
                                View on Arbiscan <ExternalLink size={14} />
                            </a>
                        )}
                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Link href="/campaigns">
                                <button className="btn-secondary">Browse Campaigns</button>
                            </Link>
                            <Link href="/dashboard">
                                <button className="btn-primary">Go to Dashboard</button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="glass-card" style={{ padding: '32px' }}>
                            <Field icon={FileText} label="Campaign Title *">
                                <input className="input-field" required value={form.title} onChange={update('title')} placeholder="e.g. Clean Water for Ogun State Communities" />
                            </Field>

                            <Field icon={FileText} label="Description *">
                                <textarea
                                    className="input-field"
                                    required
                                    rows={5}
                                    value={form.description}
                                    onChange={update('description')}
                                    placeholder="Describe your campaign's goals, beneficiaries, and expected impact..."
                                    style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                />
                            </Field>

                            <Field icon={FileText} label="Category *">
                                <select className="input-field" value={form.category} onChange={update('category')}>
                                    <option value="Health">Health</option>
                                    <option value="Education">Education</option>
                                    <option value="Environment">Environment</option>
                                    <option value="Humanitarian">Humanitarian</option>
                                    <option value="Crisis Relief">Crisis Relief</option>
                                    <option value="Animals">Animals</option>
                                </select>
                            </Field>

                            <Field icon={Target} label="Fundraising Goal (ETH) *">
                                <input className="input-field" required type="number" min="0.00001" step="0.00001" value={form.goal} onChange={update('goal')} placeholder="e.g. 50" />
                            </Field>

                            <Field icon={Calendar} label="Campaign Duration *">
                                <select className="input-field" value={form.days} onChange={update('days')}>
                                    <option value="7">7 days</option>
                                    <option value="14">14 days</option>
                                    <option value="30">30 days</option>
                                    <option value="60">60 days</option>
                                    <option value="90">90 days</option>
                                </select>
                            </Field>

                            <Field icon={Shield} label="Proof Requirements *">
                                <textarea
                                    className="input-field"
                                    required
                                    rows={3}
                                    value={form.proofRequirements}
                                    onChange={update('proofRequirements')}
                                    placeholder="Describe what cryptographic proof you will provide (e.g. 'Reclaim Protocol receipt for borehole installation report')"
                                    style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                />
                            </Field>

                            {error && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '10px',
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        marginBottom: '20px',
                                        fontSize: '13px',
                                        color: '#fca5a5',
                                    }}
                                >
                                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                                    {error.message.split('\n')[0]}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: isPending || isConfirming ? 0.8 : 1 }}
                                disabled={isPending || isConfirming}
                            >
                                {isPending || isConfirming ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        {isPending ? 'Confirm in wallet…' : 'Creating on-chain…'}
                                    </>
                                ) : (
                                    <>
                                        <Target size={16} />
                                        Launch Campaign
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
