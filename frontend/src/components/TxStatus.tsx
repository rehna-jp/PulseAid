'use client';

import { CheckCircle, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

interface TxStatusProps {
    isPending?: boolean;
    isConfirming?: boolean;
    isSuccess?: boolean;
    error?: Error | null;
    hash?: `0x${string}`;
    successMessage?: string;
    pendingMessage?: string;
    confirmingMessage?: string;
}

export default function TxStatus({
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    successMessage = 'Transaction confirmed!',
    pendingMessage = 'Confirm in your wallet…',
    confirmingMessage = 'Confirming on-chain…',
}: TxStatusProps) {
    if (!isPending && !isConfirming && !isSuccess && !error) return null;

    return (
        <div style={{ marginTop: '16px' }}>
            {(isPending || isConfirming) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#93c5fd',
                    }}
                >
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    {isPending ? pendingMessage : confirmingMessage}
                </div>
            )}

            {isSuccess && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#34d399',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={15} />
                        {successMessage}
                    </div>
                    {hash && (
                        <a
                            href={`https://sepolia.arbiscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                        >
                            Arbiscan <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            )}

            {error && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#fca5a5',
                    }}
                >
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{error.message.split('\n')[0]}</span>
                </div>
            )}
        </div>
    );
}
