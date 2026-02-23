'use client';

import Link from 'next/link';
import { Activity, Github, Twitter, Globe } from 'lucide-react';

const footerLinks = {
    Platform: [
        { label: 'Browse Campaigns', href: '/campaigns', external: false },
        { label: 'Institutions', href: '/institutions', external: false },
        { label: 'Register Institution', href: '/institutions/register', external: false },
        { label: 'Governance', href: '/governance', external: false },
    ],
    Resources: [
        { label: 'Smart Contracts', href: 'https://sepolia.arbiscan.io/', external: true },
        { label: 'Documentation', href: '#', external: false },
        { label: 'Reclaim Protocol', href: 'https://reclaimprotocol.org', external: true },
        { label: 'Arbitrum Sepolia', href: 'https://sepolia.arbiscan.io', external: true },
    ],
    Account: [
        { label: 'My Dashboard', href: '/dashboard', external: false },
        { label: 'Create Campaign', href: '/campaigns/create', external: false },
    ],
};

export default function Footer() {
    return (
        <footer
            style={{
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                padding: '60px 24px 32px',
                marginTop: 'auto',
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Top row */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr repeat(3, 1fr)',
                        gap: '40px',
                        marginBottom: '48px',
                    }}
                >
                    {/* Brand */}
                    <div>
                        <Link
                            href="/"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
                        >
                            {/* <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '9px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 15px rgba(16,185,129,0.3)',
                                }}
                            >
                                <Activity size={16} color="white" strokeWidth={2.5} />
                            </div> */}
                            <span
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 700,
                                    fontSize: '18px',
                                    background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                PulseAid
                            </span>
                        </Link>
                        <p
                            style={{
                                color: 'var(--text-muted)',
                                fontSize: '13px',
                                lineHeight: 1.7,
                                maxWidth: '260px',
                                marginBottom: '20px',
                            }}
                        >
                            Transparent charitable giving powered by zero-knowledge proofs and smart contracts on Arbitrum.
                        </p>
                        {/* Social icons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[
                                { Icon: Github, href: 'https://github.com', label: 'GitHub' },
                                { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                                { Icon: Globe, href: 'https://pulseaid.xyz', label: 'Website' },
                            ].map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '8px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-muted)',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        el.style.borderColor = '#10b981';
                                        el.style.color = '#10b981';
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget;
                                        el.style.borderColor = 'var(--border)';
                                        el.style.color = 'var(--text-muted)';
                                    }}
                                >
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([section, links]) => (
                        <div key={section}>
                            <h4
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'var(--text-muted)',
                                    marginBottom: '16px',
                                }}
                            >
                                {section}
                            </h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {links.map((link) => (
                                    <li key={link.label}>
                                        {link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: 'var(--text-secondary)',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#10b981')}
                                                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                style={{
                                                    color: 'var(--text-secondary)',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    transition: 'color 0.2s',
                                                }}
                                                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#10b981')}
                                                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom row */}
                <div
                    style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        © 2026 PulseAid. All rights reserved.
                    </p>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {['Privacy Policy', 'Terms of Use', 'Contact'].map((item) => (
                            <a
                                key={item}
                                href="#"
                                style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}
                                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                        Deployed on Arbitrum Sepolia
                    </div>
                </div>
            </div>
        </footer>
    );
}
