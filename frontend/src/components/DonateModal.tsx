'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useDonate } from '@/hooks/useContracts';
import TxStatus from '@/components/TxStatus';
import { X, Heart } from 'lucide-react';

interface Campaign {
    id: bigint;
    title: string;
    institution: string;
    goal: string;
    raised: string;
    color: string;
}

interface DonateModalProps {
    campaign: Campaign;
    onClose: () => void;
}

const PRESET_AMOUNTS = ['0.01', '0.05', '0.1', '0.5', '1'];

export default function DonateModal({ campaign, onClose }: DonateModalProps) {
    const { isConnected } = useAccount();
    const [amount, setAmount] = useState('0.05');
    const { donate, isPending, isConfirming, isSuccess, error, hash } = useDonate(campaign.id);

    const handleDonate = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        donate(amount);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(6px)',
                padding: '16px',
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                }}
            >
                {/* Header stripe */}
                <div
                    style={{
                        height: '4px',
                        background: `linear-gradient(90deg, ${campaign.color}, transparent)`,
                    }}
                />

                <div style={{ padding: '28px' }}>
                    {/* Top bar */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '24px',
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    marginBottom: '4px',
                                }}
                            >
                                Make a Donation
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {campaign.title}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                width: 34,
                                height: 34,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {!isConnected ? (
                        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
                                Connect your wallet to donate and receive a Donation NFT.
                            </p>
                            <ConnectKitButton />
                        </div>
                    ) : (
                        <>
                            {/* Preset amounts */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                                    Select Amount (ETH)
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                    {PRESET_AMOUNTS.map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setAmount(amt)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                border: amount === amt ? `1px solid ${campaign.color}` : '1px solid var(--border)',
                                                background: amount === amt ? `${campaign.color}18` : 'transparent',
                                                color: amount === amt ? campaign.color : 'var(--text-secondary)',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {amt} ETH
                                        </button>
                                    ))}
                                </div>
                                <input
                                    className="input-field"
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Custom amount..."
                                />
                            </div>

                            {/* Info row */}
                            <div
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    marginBottom: '20px',
                                    fontSize: '13px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Donation Amount</span>
                                    <span style={{ fontWeight: 700 }}>{amount} ETH</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Destination</span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>Escrow (on-chain)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Reward</span>
                                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Donation NFT + PAT tokens</span>
                                </div>
                            </div>

                            {/* Unified TxStatus replaces the old inline error/success/pending UI */}
                            <TxStatus
                                isPending={isPending}
                                isConfirming={isConfirming}
                                isSuccess={isSuccess}
                                error={error}
                                hash={hash}
                                successMessage={`${amount} ETH donation confirmed! Funds are in escrow.`}
                            />

                            {/* Donate / Close button */}
                            {isSuccess ? (
                                <button
                                    className="btn-secondary"
                                    style={{ marginTop: '16px', width: '100%' }}
                                    onClick={onClose}
                                >
                                    Close
                                </button>
                            ) : (
                                <button
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        marginTop: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        opacity: isPending || isConfirming ? 0.8 : 1,
                                    }}
                                    onClick={handleDonate}
                                    disabled={isPending || isConfirming}
                                >
                                    <Heart size={16} />
                                    Donate {amount} ETH
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
