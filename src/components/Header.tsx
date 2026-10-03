/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { ShieldCheck, Copy, Check, ExternalLink, Terminal, CheckCircle2 } from 'lucide-react';
import { SuiChainStatus } from '../types/dex';
import { RpcNodeHealthBadge } from './RpcNodeHealthBadge';

interface HeaderProps {
  chainStatus: SuiChainStatus | null;
  onOpenSecurity: () => void;
  onOpenVerificationLog: () => void;
  onRefreshChainStatus?: () => void;
  isRefreshingChainStatus?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  chainStatus,
  onOpenSecurity,
  onOpenVerificationLog,
  onRefreshChainStatus = () => {},
  isRefreshingChainStatus = false,
}) => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <span className="font-mono font-bold text-white text-lg tracking-wider">⚡</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">SuiFlash</h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Mainnet
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              DEX Scanner & Flash Loan Arbitrage Engine
            </p>
          </div>
        </div>

        {/* Real-time RPC Node Health & Synchronization Indicator */}
        <div className="flex items-center">
          <RpcNodeHealthBadge
            chainStatus={chainStatus}
            onRefresh={onRefreshChainStatus}
            isRefreshing={isRefreshingChainStatus}
          />
        </div>

        {/* Actions & Wallet Integration */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Verification Claims Gate */}
          <button
            onClick={onOpenVerificationLog}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 transition-colors"
            title="Lihat status verifikasi klaim aturan pengguna"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Gerbang</span> Verifikasi
          </button>

          {/* Security Shield */}
          <button
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 transition-colors"
            title="Kunci privat terisolasi di env. Tidak pernah di frontend/API"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Kunci Privat:</span> Aman
          </button>

          {/* Sui Wallet Connect */}
          {currentAccount ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg p-1 pl-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span title={currentAccount.address}>
                  {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                </span>
              </div>
              <button
                onClick={copyAddress}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                title="Salin Alamat Dompet"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`https://suiscan.xyz/mainnet/account/${currentAccount.address}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                title="Lihat di SuiScan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => disconnect()}
                className="px-2 py-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded border border-rose-900/40 transition-colors"
              >
                Putus
              </button>
            </div>
          ) : (
            <div className="wallet-connect-wrapper">
              <ConnectButton connectText="Hubungkan Dompet Sui" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
