import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'PulseAid — Transparent Charitable Giving on Blockchain',
  description:
    'PulseAid is a decentralized platform where institutions request aid, donors give transparently, and every fund release is verified on-chain via zero-knowledge proofs.',
  keywords: ['charity', 'blockchain', 'DeFi', 'donation', 'transparency', 'Arbitrum'],
  openGraph: {
    title: 'PulseAid — Transparent Charitable Giving',
    description: 'Every donation verified. Every fund tracked. On-chain.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <Web3Provider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {children}
            <Footer />
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
