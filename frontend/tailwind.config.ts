import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    green: '#10b981',
                    'green-light': '#34d399',
                    blue: '#3b82f6',
                    purple: '#8b5cf6',
                    yellow: '#f59e0b',
                },
                dark: {
                    primary: '#0a0d14',
                    secondary: '#0f1420',
                    card: '#141926',
                    'card-hover': '#1a2133',
                    border: '#1e2a3d',
                    'border-light': '#253449',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            animation: {
                'float': 'float 8s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'slide-up': 'slide-up 0.6s ease forwards',
                'spin-slow': 'spin 3s linear infinite',
            },
        },
    },
    plugins: [],
};

export default config;
