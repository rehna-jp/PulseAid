'use client';

import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useSubmitProof, useIsInstitutionVerified } from '@/hooks/useContracts';
import { useState } from 'react';
import Link from 'next/link';
import {
    Shield,
    ArrowLeft,
    ExternalLink,
    Loader2,
    CheckCircle,
    AlertTriangle,
    FileText,
    Upload,
    Link as LinkIcon,
} from 'lucide-react';

export default function ProofSubmissionPage() {
    const params = useParams();
    const campaignId = BigInt(String(params?.id ?? '0'));
    const { address, isConnected } = useAccount();
    const { data: isVerified } = useIsInstitutionVerified(address);
    const { submit, isPending, isConfirming, isSuccess, error, hash } = useSubmitProof();

    const [proofHex, setProofHex] = useState('');
    const [proofData, setProofData] = useState('');
    const [reclaimUrl, setReclaimUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hex = proofHex.startsWith('0x') ? proofHex : (`0x${proofHex}` as `0x${string}`);
        submit(campaignId, hex as `0x${string}`, proofData || reclaimUrl);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '660px', margin: '0 auto', padding: '100px 24px 60px' }}>
                <Link
                    href={`/campaigns/${String(campaignId)}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', marginBottom: '28px' }}
                >
                    <ArrowLeft size={14} />
                    Back to Campaign
                </Link>

                <div style={{ marginBottom: '32px' }}>
                    <span className="badge badge-green" style={{ marginBottom: '14px' }}>
                        <Shield size={12} /> Proof Submission
                    </span>
                    <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, marginBottom: '10px' }}>
                        Submit <span className="gradient-text">Proof of Impact</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
                        Submit your cryptographic proof generated via the Reclaim Protocol.
                        Successful verification triggers automatic fund release from escrow.
                    </p>
                </div>

                {/* How it works box */}
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
                    <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '12px', fontSize: '14px', color: '#34d399' }}>
                        How proof verification works
                    </h4>
                    {[
                        'Generate a proof with the Reclaim Protocol SDK using your evidence URL',
                        'Paste the proof hex and raw evidence data below',
                        'The ProofValidator contract verifies it against the Reclaim verifier address',
                        'On success, the EscrowManager automatically releases funds to your institution',
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 3 ? '8px' : 0 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
                                {i + 1}
                            </span>
                            <p style={{ fontSize: '13px', color: '#6ee7b7', lineHeight: 1.5 }}>{step}</p>
                        </div>
                    ))}
                </div>

                {!isConnected ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Connect your institution wallet to submit proof.</p>
                        <ConnectKitButton />
                    </div>
                ) : !isVerified ? (
                    <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
                        <Shield size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '8px' }}>Institution Not Verified</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                            Only verified institutions can submit proofs for their campaigns.
                        </p>
                        <Link href="/institutions/register">
                            <button className="btn-primary">Register Institution</button>
                        </Link>
                    </div>
                ) : isSuccess ? (
                    <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                        <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px', marginBottom: '10px' }}>
                            Proof Verified & Funds Released!
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                            Your proof was successfully verified on-chain. The escrow has automatically
                            released the campaign funds to your institution.
                        </p>
                        {hash && (
                            <a
                                href={`https://sepolia.arbiscan.io/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
                            >
                                View Transaction on Arbiscan
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="glass-card" style={{ padding: '32px' }}>
                            {/* Campaign ID display */}
                            <div style={{ marginBottom: '20px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Campaign ID</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#10b981', fontWeight: 700 }}>#{String(campaignId)}</span>
                            </div>

                            {/* Reclaim URL */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    <LinkIcon size={13} />
                                    Reclaim Proof URL
                                </label>
                                <input
                                    className="input-field"
                                    value={reclaimUrl}
                                    onChange={(e) => setReclaimUrl(e.target.value)}
                                    placeholder="https://api.reclaimprotocol.org/api/sdk/session/..."
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    Paste the session URL from your Reclaim Protocol proof generation.
                                </p>
                            </div>

                            {/* Proof Hex */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    <Upload size={13} />
                                    Proof Hex *
                                </label>
                                <textarea
                                    className="input-field"
                                    required
                                    rows={4}
                                    value={proofHex}
                                    onChange={(e) => setProofHex(e.target.value)}
                                    placeholder="0xabc123... (hex-encoded ZK proof bytes)"
                                    style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                                />
                            </div>

                            {/* Proof data / metadata */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    <FileText size={13} />
                                    Proof Metadata / Evidence Hash
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={proofData}
                                    onChange={(e) => setProofData(e.target.value)}
                                    placeholder='{"documentHash":"0x...","issuer":"NGWaterAuthority","timestamp":1740000000}'
                                    style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{ display: 'flex', gap: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: '#fca5a5' }}>
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
                                        {isPending ? 'Confirm in wallet…' : 'Verifying proof on-chain…'}
                                    </>
                                ) : (
                                    <>
                                        <Shield size={16} />
                                        Submit Proof & Release Funds
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
