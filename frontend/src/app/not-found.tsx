'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Activity, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '24px',
                    textAlign: 'center',
                }}
            >
                {/* Glowing 404 */}
                <div
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 'clamp(80px, 15vw, 160px)',
                        fontWeight: 900,
                        lineHeight: 1,
                        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px',
                        filter: 'drop-shadow(0 0 40px rgba(16,185,129,0.3))',
                    }}
                >
                    404
                </div>

                <h1
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 'clamp(20px, 3vw, 32px)',
                        fontWeight: 700,
                        marginBottom: '12px',
                    }}
                >
                    Page not found
                </h1>
                <p
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '16px',
                        marginBottom: '40px',
                        maxWidth: '400px',
                        lineHeight: 1.6,
                    }}
                >
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link href="/">
                        <button
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Activity size={15} />
                            Go Home
                        </button>
                    </Link>
                    <Link href="/campaigns">
                        <button
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Search size={15} />
                            Browse Campaigns
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
