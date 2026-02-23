'use client';

import Link from 'next/link';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { Activity, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/institutions', label: 'Institutions' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/governance', label: 'Governance' },
];

export default function Navbar() {
    const { isConnected } = useAccount();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                background: 'rgba(10, 13, 20, 0.85)',
                borderBottom: '1px solid rgba(30, 42, 61, 0.8)',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    height: '68px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                        }}
                    >
                        <Activity size={18} color="white" strokeWidth={2.5} />
                    </div> */}
                    <span
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            fontSize: '20px',
                            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        PulseAid
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                color: '#8a9bc0',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color = '#e8eef8';
                                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color = '#8a9bc0';
                                (e.target as HTMLElement).style.background = 'transparent';
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isConnected && (
                        <Link
                            href="/dashboard"
                            className="hidden md:inline-flex"
                            style={{
                                padding: '8px 18px',
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#10b981',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                        >
                            My Dashboard
                        </Link>
                    )}
                    <div className="hidden md:inline-flex">
                        <ConnectKitButton />
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        className="inline-flex md:hidden"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8a9bc0',
                            cursor: 'pointer',
                            padding: '4px',
                        }}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div
                    style={{
                        borderTop: '1px solid rgba(30, 42, 61, 0.8)',
                        padding: '16px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                    className="md:hidden"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                color: '#8a9bc0',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: 500,
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
