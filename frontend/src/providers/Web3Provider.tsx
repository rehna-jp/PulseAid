'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const config = createConfig(
    getDefaultConfig({
        chains: [arbitrumSepolia],
        transports: {
            [arbitrumSepolia.id]: http(),
        },
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        appName: 'PulseAid',
        appDescription: 'Transparent, blockchain-verified charitable giving platform',
        appUrl: 'https://pulseaid.xyz',
        appIcon: '/logo.png',
    })
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider
                    theme="midnight"
                    customTheme={{
                        '--ck-font-family': '"Inter", sans-serif',
                        '--ck-border-radius': '12px',
                        '--ck-overlay-background': 'rgba(0, 0, 0, 0.7)',
                        '--ck-body-background': '#0d1117',
                        '--ck-body-color': '#e6edf3',
                        '--ck-primary-button-background': '#10b981',
                        '--ck-primary-button-hover-background': '#059669',
                        '--ck-primary-button-color': '#ffffff',
                    }}
                >
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
