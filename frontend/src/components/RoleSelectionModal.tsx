'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSelectRole, useUserProfile } from '@/hooks/useContracts';
import TxStatus from '@/components/TxStatus';
import { Shield, Heart, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function RoleSelectionModal() {
    const { isConnected, address } = useAccount();
    const { data: profileRaw, isLoading: loadingProfile } = useUserProfile(address);
    const { select, isPending, isConfirming, isSuccess, error, hash } = useSelectRole();

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isConnected && profileRaw && !loadingProfile) {
            const [role] = profileRaw as [number];
            if (role === 0) { // UserRole.None
                setIsOpen(true);
            }
        }
    }, [isConnected, profileRaw, loadingProfile]);

    if (!isOpen || isSuccess) return null;

    const handleSelect = (role: number) => {
        select(role as 1 | 2);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5, 8, 15, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '20px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    textAlign: 'center',
                }}
            >
                <div style={{ marginBottom: '40px' }}>
                    <h1
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 'clamp(32px, 5vw, 48px)',
                            fontWeight: 800,
                            marginBottom: '16px',
                            background: 'linear-gradient(135deg, #e8eef8 0%, #8a9bc0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Welcome to <span style={{ color: '#10b981', WebkitTextFillColor: 'initial' }}>PulseAid</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        To personalize your experience, please select your primary role on the platform.
                        This preference is stored on-chain.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '24px',
                        marginBottom: '40px',
                    }}
                >
                    {/* Donor Role */}
                    <div
                        className="glass-card"
                        style={{
                            padding: '40px 32px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                        onClick={() => handleSelect(2)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                color: '#3b82f6',
                            }}
                        >
                            <Heart size={32} />
                        </div>
                        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>I am a Donor</h2>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '15px' }}>
                            Browse verified campaigns, donate securely, track your on-chain impact, and participate in governance.
                        </p>
                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#3b82f6', fontWeight: 600 }}>
                            Select Donor Role <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* Institution Role */}
                    <div
                        className="glass-card"
                        style={{
                            padding: '40px 32px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}
                        onClick={() => handleSelect(1)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                color: '#10b981',
                            }}
                        >
                            <Shield size={32} />
                        </div>
                        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>I am an Institution</h2>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '15px' }}>
                            Register your organization, get ZK-verified, create fundraising campaigns, and submit proof of impact.
                        </p>
                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
                            Select Institution Role <ArrowRight size={16} />
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <TxStatus
                        isPending={isPending}
                        isConfirming={isConfirming}
                        isSuccess={isSuccess}
                        error={error}
                        hash={hash}
                        successMessage="Role selected! Redirecting..."
                    />
                </div>
            </div>
        </div>
    );
}
