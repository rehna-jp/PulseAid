import { formatEther } from 'viem';

/** Format wei to ETH with N decimal places */
export function formatETH(wei: bigint, decimals = 4): string {
    return parseFloat(formatEther(wei)).toFixed(decimals);
}

/** Format a unix timestamp to a human-readable date */
export function formatDate(timestamp: bigint | number): string {
    const ms = typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp * 1000;
    return new Date(ms).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Days remaining from a unix timestamp */
export function daysRemaining(timestamp: bigint | number): number {
    const ms = typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp * 1000;
    return Math.max(0, Math.round((ms - Date.now()) / 86_400_000));
}

/** Campaign funding percentage (0–100, capped) */
export function fundingPercent(raised: bigint, goal: bigint): number {
    if (goal === 0n) return 0;
    return Math.min(100, Math.round((Number(raised) / Number(goal)) * 100));
}

/** Shorten an Ethereum address */
export function shortAddress(addr: string, chars = 4): string {
    return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

/** Arbiscan transaction link */
export function arbiscanTx(hash: string): string {
    return `https://sepolia.arbiscan.io/tx/${hash}`;
}

/** Arbiscan address link */
export function arbiscanAddr(address: string): string {
    return `https://sepolia.arbiscan.io/address/${address}`;
}

/** cn() utility — merges class names (no extra libs needed) */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}
