/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SuiChainStatus } from '../types/dex';
import { formatSourcedValue } from '../services/flashLoanEngine';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
  Clock,
  Radio,
  ChevronDown,
} from 'lucide-react';

interface RpcNodeHealthBadgeProps {
  chainStatus: SuiChainStatus | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const RpcNodeHealthBadge: React.FC<RpcNodeHealthBadgeProps> = ({
  chainStatus,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const checkpoint = chainStatus?.checkpointNumber;
  const latency = chainStatus?.rpcLatencyMs;
  const syncStatus = chainStatus?.syncStatus;
  const ageSeconds = chainStatus?.checkpointAgeSeconds?.value ?? null;

  const checkpointDisplay = formatSourcedValue(checkpoint, (v) => `#${v.toLocaleString()}`);
  const latencyDisplay = formatSourcedValue(latency, (v) => `${v}ms`);

  const latencyVal = latency?.value ?? 0;
  const isHealthy = chainStatus?.connected && syncStatus?.value === 'SINKRON';
  const isDegraded = chainStatus?.connected && (syncStatus?.value === 'TERLAMBAT' || latencyVal > 300);

  const statusColor = isHealthy
    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
    : isDegraded
    ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
    : 'text-rose-400 border-rose-500/40 bg-rose-950/40';

  const dotColor = isHealthy ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="relative">
      {/* Compact Interactive Header Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all hover:bg-slate-850 ${statusColor}`}
        title="Klik untuk membuka rincian sinkronisasi & diagnostik node RPC"
      >
        <span className="relative flex h-2 w-2">
          {isHealthy && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </span>

        {/* Sync Status Badge */}
        <span className="font-bold tracking-tight">
          {isHealthy ? 'RPC SINKRON' : isDegraded ? 'RPC LAMBAT' : 'RPC OFFLINE'}
        </span>

        {/* Latency */}
        <span className="text-slate-400 hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1 text-slate-200">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>{latencyDisplay.display}</span>
        </div>

        {/* Block Age */}
        {ageSeconds !== null && (
          <>
            <span className="text-slate-400 hidden lg:inline">|</span>
            <div className="hidden lg:flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Usia Blok: {ageSeconds}s [On-chain]</span>
            </div>
          </>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Diagnostics Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[95vw] bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl z-50 font-mono text-xs space-y-4">
            {/* Header of Popover */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold text-slate-200 text-sm">
                  Diagnostik Node RPC Real-Time
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                disabled={isRefreshing}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 disabled:opacity-50"
                title="Ping Ulang Node RPC"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* Freshness Status Banner */}
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                isHealthy
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
              }`}
            >
              {isHealthy ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 text-[11px]">
                <div className="font-bold">
                  {isHealthy
                    ? 'DATA REAL-TIME TERVERIFIKASI (BUKAN KADALUARSA)'
                    : 'KETERLAMBATAN DETEKSI BLOK SINKRONISASI'}
                </div>
                <div className="text-slate-300 font-sans leading-relaxed">
                  {syncStatus?.sourceDetail || 'Memantau waktu pembuatan blok terakhir langsung dari consensus header.'}
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Checkpoint Terkini:</span>
                <span className="text-slate-100 font-bold text-xs mt-0.5 block truncate">
                  {checkpointDisplay.display}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Latensi RPC Ping:</span>
                <span className={`font-bold text-xs mt-0.5 block ${latencyVal < 150 ? 'text-emerald-400' : latencyVal < 350 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {latencyDisplay.display}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Usia Pembuatan Blok:</span>
                <span className="text-cyan-300 font-bold text-xs mt-0.5 block">
                  {ageSeconds !== null ? `${ageSeconds} detik yang lalu` : '—'} [On-chain]
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Epoch & Gas Price:</span>
                <span className="text-slate-200 font-bold text-xs mt-0.5 block">
                  Epoch #{chainStatus?.epoch?.value || 1269} ({chainStatus?.referenceGasPriceMist?.value || 100} MIST)
                </span>
              </div>
            </div>

            {/* Endpoints Consensus Table */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3 text-cyan-400" />
                  Node RPC Konsensus Multi-Endpoint:
                </span>
                <span>Status</span>
              </div>

              <div className="space-y-1">
                {(chainStatus?.endpoints || []).map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900/90 rounded border border-slate-800/90 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate max-w-[200px]">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="truncate">{ep.name}</span>
                        {ep.isCurrentPrimary && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{ep.url}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-bold">
                        {ep.latencyMs ? `${ep.latencyMs}ms` : '—'}
                      </span>
                      <div className="text-[9px] text-slate-400">
                        {ep.status === 'online' ? '● Online' : '▲ Terdegradasi'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Ping Action */}
            <button
              onClick={() => {
                onRefresh();
              }}
              disabled={isRefreshing}
              className="w-full py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isRefreshing ? 'Memverifikasi Node On-Chain...' : 'Ping Ulang & Verifikasi Sinkronisasi Sekarang'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
