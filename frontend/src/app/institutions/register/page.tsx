'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRegisterInstitution } from '@/hooks/useContracts';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import {
    Building2,
    Globe,
    FileText,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Shield,
    Info,
} from 'lucide-react';

export default function RegisterInstitutionPage() {
    const { isConnected } = useAccount();
    const { register, isPending, isConfirming, isSuccess, error, hash } = useRegisterInstitution();

    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'Non-Profit',
        country: 'Nigeria',
        website: '',
        stake: '0.00005',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Hook expects: name, category, country, website, zkProof, stakeAmount
        // Passing dummy zkProof for now
        register(form.name, form.category, form.country, form.website, {}, form.stake);
    };

    const update = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '100px 24px 60px' }}>
                {/* Header */}
                <div style={{ marginBottom: '36px' }}>
                    <span className="badge badge-blue" style={{ marginBottom: '16px' }}>
                        <Shield size={12} />
                        Verified Institution Registration
                    </span>
                    <h1
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 'clamp(26px, 4vw, 40px)',
                            fontWeight: 700,
                            marginBottom: '10px',
                        }}
                    >
                        Register your <span className="gradient-text">Organization</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
                        Submit your institution details and stake ETH as a trust deposit.
                        Once verified on-chain, you can create fundraising campaigns.
                    </p>
                </div>

                {/* Info box */}
                <div
                    style={{
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '28px',
                        display: 'flex',
                        gap: '12px',
                    }}
                >
                    <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div style={{ fontSize: '13px', color: '#93c5fd', lineHeight: 1.6 }}>
                        <strong>Stake Requirement:</strong> A minimum of 0.00005 ETH stake is required for registration.
                        This stake is held on-chain and returned upon successful de-registration or slashed for misconduct.
                    </div>
                </div>

                {!isConnected ? (
                    <div
                        className="glass-card"
                        style={{ padding: '40px', textAlign: 'center' }}
                    >
                        <Building2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
                        <h3 style={{ marginBottom: '8px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                            Connect your wallet
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            You need a connected wallet to register your institution on-chain.
                        </p>
                        <ConnectKitButton />
                    </div>
                ) : isSuccess ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                        <CheckCircle size={52} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h3
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '22px',
                                fontWeight: 700,
                                marginBottom: '10px',
                            }}
                        >
                            Registration Submitted!
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            Your institution has been registered on Arbitrum Sepolia. You can now
                            create campaigns after the on-chain confirmation.
                        </p>
                        {hash && (
                            <a
                                href={`https://sepolia.arbiscan.io/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#10b981',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                }}
                            >
                                View Transaction on Arbiscan
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="glass-card" style={{ padding: '32px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    <Building2 size={14} /> Institution Name *
                                </label>
                                <input className="input-field" required value={form.name} onChange={update('name')} placeholder="e.g. WaterAid Nigeria" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        <Building2 size={14} /> Category *
                                    </label>
                                    <select className="input-field" value={form.category} onChange={update('category')}>
                                        <option value="Non-Profit">Non-Profit</option>
                                        <option value="Government">Government</option>
                                        <option value="Education">Education</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="International Org">International Org</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        <Globe size={14} /> Country *
                                    </label>
                                    <input className="input-field" required value={form.country} onChange={update('country')} placeholder="e.g. Nigeria" />
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ marginBottom: '20px' }}>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '8px',
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    <FileText size={14} />
                                    Description *
                                </label>
                                <textarea
                                    className="input-field"
                                    required
                                    rows={4}
                                    value={form.description}
                                    onChange={update('description')}
                                    placeholder="Briefly describe your organization's mission and goals..."
                                    style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                />
                            </div>

                            {/* Website */}
                            <div style={{ marginBottom: '20px' }}>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '8px',
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    <Globe size={14} />
                                    Website URL *
                                </label>
                                <input
                                    className="input-field"
                                    required
                                    type="url"
                                    value={form.website}
                                    onChange={update('website')}
                                    placeholder="https://yourorganization.org"
                                />
                            </div>

                            {/* Stake */}
                            <div style={{ marginBottom: '28px' }}>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '8px',
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    <Shield size={14} />
                                    Stake Amount (ETH) *
                                </label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    {['0.00005', '0.0001', '0.0005'].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setForm((p) => ({ ...p, stake: s }))}
                                            style={{
                                                padding: '7px 14px',
                                                borderRadius: '8px',
                                                border: form.stake === s ? '1px solid #3b82f6' : '1px solid var(--border)',
                                                background: form.stake === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                                                color: form.stake === s ? '#93c5fd' : 'var(--text-secondary)',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {s} ETH
                                        </button>
                                    ))}
                                </div>
                                <input
                                    className="input-field"
                                    required
                                    type="number"
                                    min="0.00005"
                                    step="0.00001"
                                    value={form.stake}
                                    onChange={update('stake')}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        borderRadius: '10px',
                                        padding: '14px',
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
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    opacity: isPending || isConfirming ? 0.8 : 1,
                                }}
                                disabled={isPending || isConfirming}
                            >
                                {isPending || isConfirming ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        {isPending ? 'Confirm in wallet…' : 'Registering on-chain…'}
                                    </>
                                ) : (
                                    <>
                                        <Building2 size={16} />
                                        Register Institution — {form.stake} ETH
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
