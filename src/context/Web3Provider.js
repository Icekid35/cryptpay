'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import '@rainbow-me/rainbowkit/styles.css';

// Load WalletConnect Project ID from env variables (obtain from https://cloud.walletconnect.com/)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a62a758d798b67d5f11f44485b17409';

const config = getDefaultConfig({
  appName: 'CryptPay',
  projectId: projectId,
  chains: [mainnet, sepolia, polygon, arbitrum, optimism],
  ssr: true,
  transports: {
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [sepolia.id]: http('https://rpc.ankr.com/eth_sepolia'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io')
  }
});

const queryClient = new QueryClient();

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#7c3aed', // Purple to match our premium aesthetic
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
