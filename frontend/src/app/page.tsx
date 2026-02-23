'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { usePlatformStats } from '@/hooks/useContracts';
import { formatEther } from 'viem';
import {
  Activity,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Users,
  DollarSign,
  Heart,
  Loader2,
} from 'lucide-react';

const stats = [
  { label: 'Total Donated', value: '0 ETH', icon: DollarSign, color: '#10b981' },
  { label: 'Verified Institutions', value: '0', icon: Shield, color: '#3b82f6' },
  { label: 'Active Campaigns', value: '0', icon: Activity, color: '#8b5cf6' },
  { label: 'Donors Worldwide', value: '0', icon: Users, color: '#f59e0b' },
];

const features = [
  {
    icon: Shield,
    title: 'ZK-Verified Proofs',
    description:
      'Every fund release is gated behind zero-knowledge cryptographic proofs via the Reclaim Protocol. No proof, no payment.',
    color: '#10b981',
  },
  {
    icon: Zap,
    title: 'Instant On-Chain Execution',
    description:
      'Smart contracts on Arbitrum Sepolia automatically release funds upon successful verification — no human gatekeepers.',
    color: '#3b82f6',
  },
  {
    icon: TrendingUp,
    title: 'Reputation System',
    description:
      'Institutions build verifiable on-chain reputation over time. Donors can trust who they give to.',
    color: '#8b5cf6',
  },
  {
    icon: Globe,
    title: 'Decentralized Governance',
    description:
      'PAT token holders vote on platform decisions. The community guides the platform, not a central authority.',
    color: '#f59e0b',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Institution Registers',
    description: 'Charities stake ETH and submit ZK credentials to get verified on-chain.',
  },
  {
    step: '02',
    title: 'Campaign Created',
    description: 'Verified institutions create fund-raising campaigns with defined goals and deadlines.',
  },
  {
    step: '03',
    title: 'Donors Contribute',
    description: 'Anyone can donate ETH to any active campaign. Funds are held in escrow.',
  },
  {
    step: '04',
    title: 'Proof Submitted & Funds Released',
    description: 'Institutions submit cryptographic proof of work. Smart contracts auto-release funds.',
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: '80px',
        }}
        className="grid-pattern"
      >
        {/* Animated background blobs */}
        <div
          className="hero-blob"
          style={{
            width: '600px',
            height: '600px',
            background: '#10b981',
            top: '-100px',
            right: '-100px',
          }}
        />
        <div
          className="hero-blob"
          style={{
            width: '500px',
            height: '500px',
            background: '#3b82f6',
            bottom: '-100px',
            left: '-100px',
            animationDelay: '-4s',
          }}
        />

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '0 24px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '24px' }}
            className="animate-slide-up"
          >
            <span className="badge badge-green">
              <Activity size={12} />
              Live on Arbitrum Sepolia
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(42px, 7vw, 80px)',
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
            }}
            className="animate-slide-up"
          >
            Charity giving,{' '}
            <span className="gradient-text">verified</span>
            <br />
            on the blockchain.
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
            className="animate-slide-up"
          >
            PulseAid uses zero-knowledge proofs and smart contracts to ensure every
            donation reaches its destination — transparently, trustlessly, on-chain.
          </p>

          {/* CTA Buttons */}
          <div
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
            className="animate-slide-up"
          >
            <Link href="/campaigns">
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Browse Campaigns
                <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/institutions/register">
              <button className="btn-secondary">Register Institution</button>
            </Link>
          </div>

          {/* Verification badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '32px',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            <CheckCircle size={14} color="#10b981" />
            <span>All contracts verified on Arbiscan</span>
            <span style={{ color: 'var(--border-light)' }}>•</span>
            <CheckCircle size={14} color="#10b981" />
            <span>Non-custodial, fully on-chain</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <StatsSection />
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            Built for <span className="gradient-text">trust</span>
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              marginBottom: '60px',
              fontSize: '16px',
            }}
          >
            Every feature is designed to eliminate opacity in charitable giving.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {features.map((feature) => (
              <div key={feature.title} className="glass-card" style={{ padding: '28px' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: `${feature.color}18`,
                    border: `1px solid ${feature.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <feature.icon size={22} color={feature.color} />
                </div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '10px',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '60px',
            }}
          >
            How it <span className="gradient-text">works</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {howItWorks.map((step, i) => (
              <div
                key={step.step}
                style={{
                  display: 'flex',
                  gap: '24px',
                  paddingBottom: i < howItWorks.length - 1 ? '40px' : '0',
                  position: 'relative',
                }}
              >
                {/* Step number + connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: 'white',
                      flexShrink: 0,
                      fontFamily: "'Space Grotesk', sans-serif",
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {step.step}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div
                      style={{
                        width: '2px',
                        flex: 1,
                        marginTop: '8px',
                        background: 'linear-gradient(to bottom, #10b981, transparent)',
                        minHeight: '40px',
                      }}
                    />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingTop: '8px' }}>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      marginBottom: '8px',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '24px',
              padding: '60px',
              textAlign: 'center',
            }}
          >
            <Heart size={40} color="#10b981" style={{ marginBottom: '20px' }} />
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(24px, 4vw, 40px)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              Ready to make an <span className="gradient-text">impact?</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: '36px',
                fontSize: '16px',
                maxWidth: '500px',
                margin: '0 auto 36px',
              }}
            >
              Connect your wallet and start donating to verified campaigns today.
              Every transaction is tracked on-chain.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/campaigns">
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  View Live Campaigns
                  <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
function StatsSection() {
  const { data, isLoading } = usePlatformStats();

  let liveStats = stats;

  if (data && !isLoading) {
    const statsData = data as [bigint, bigint, bigint, bigint];
    liveStats = [
      {
        label: 'Total Donated',
        value: `${parseFloat(formatEther(statsData[0])).toFixed(2)} ETH`,
        icon: DollarSign,
        color: '#10b981',
      },
      {
        label: 'Verified Institutions',
        value: String(statsData[1]),
        icon: Shield,
        color: '#3b82f6',
      },
      {
        label: 'Active Campaigns',
        value: String(statsData[2]),
        icon: Activity,
        color: '#8b5cf6',
      },
      {
        label: 'Donors Worldwide',
        value: String(statsData[3]),
        icon: Users,
        color: '#f59e0b',
      },
    ];
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
      }}
    >
      {liveStats.map((stat) => (
        <div key={stat.label} className="stat-card" style={{ textAlign: 'center', position: 'relative' }}>
          {isLoading && !data && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: stat.color, opacity: 0.5 }} />
            </div>
          )}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: `${stat.color}18`,
              border: `1px solid ${stat.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <stat.icon size={22} color={stat.color} />
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              color: stat.color,
              marginBottom: '4px',
              opacity: isLoading && !data ? 0.3 : 1,
            }}
          >
            {stat.value}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
