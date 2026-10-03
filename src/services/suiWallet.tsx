/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// Sui Network Configurations with real fallback endpoints and explicit network property
const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: 'https://mainnet.sui.rpcpool.com',
    network: 'mainnet',
  },
  testnet: {
    url: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
  },
});

const queryClient = new QueryClient();

export function SuiWalletKitProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
