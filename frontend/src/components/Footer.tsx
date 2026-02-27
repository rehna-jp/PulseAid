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
        <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-14 mt-auto">
            <div className="max-w-[1200px] mx-auto">
                {/* Top row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link
                            href="/"
                            className="no-underline inline-flex items-center gap-2.5 mb-4"
                        >
                            <span
                                className="font-['Space_Grotesk'] font-bold text-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent"
                            >
                                PulseAid
                            </span>
                        </Link>
                        <p className="text-[var(--text-muted)] text-[13px] leading-[1.7] max-w-[260px] mb-5">
                            Transparent charitable giving powered by zero-knowledge proofs and smart contracts on Arbitrum.
                        </p>
                        {/* Social icons */}
                        <div className="flex gap-2.5">
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
                                    className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] no-underline transition-all duration-200 hover:border-[#10b981] hover:text-[#10b981]"
                                >
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([section, links]) => (
                        <div key={section}>
                            <h4 className="text-[11px] font-bold tracking-[0.08em] uppercase text-[var(--text-muted)] mb-4">
                                {section}
                            </h4>
                            <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        {link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--text-secondary)] no-underline text-[13px] transition-colors duration-200 hover:text-[#10b981]"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="text-[var(--text-secondary)] no-underline text-[13px] transition-colors duration-200 hover:text-[#10b981]"
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
                <div className="border-t border-[var(--border)] pt-6 flex flex-col md:flex-row justify-between items-center flex-wrap gap-3">
                    <p className="text-[var(--text-muted)] text-[12px]">
                        © 2026 PulseAid. All rights reserved.
                    </p>
                    <div className="flex gap-5">
                        {['Privacy Policy', 'Terms of Use', 'Contact'].map((item) => (
                            <a
                                key={item}
                                href="#"
                                className="text-[var(--text-muted)] text-[12px] no-underline transition-colors duration-200 hover:text-[var(--text-secondary)]"
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block shadow-[0_0_6px_#10b981]" />
                        Deployed on Arbitrum Sepolia
                    </div>
                </div>
            </div>
        </footer>
    );
}
