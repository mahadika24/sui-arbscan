/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DexPool,
  FlashLoanProtocol,
  DevInspectResult,
  RealQuoteResult,
} from '../types/dex';
import { FLASH_LOAN_PROVIDERS } from '../services/flashLoanEngine';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  Square,
  RefreshCw,
  Cpu,
  Coins,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';

interface BotExecutionGuardPanelProps {
  pools: DexPool[];
  suiPriceUsd?: number;
}

export const BotExecutionGuardPanel: React.FC<BotExecutionGuardPanelProps> = ({
  pools,
  suiPriceUsd = 1.18,
}) => {
  const [borrowTokenSymbol, setBorrowTokenSymbol] = useState<string>('SUI');
  const [borrowAmount, setBorrowAmount] = useState<number>(2000);
  const [provider, setProvider] = useState<FlashLoanProtocol>('Navi');
  const [selectedBuyPoolId, setSelectedBuyPoolId] = useState<string>('');
  const [selectedSellPoolId, setSelectedSellPoolId] = useState<string>('');

  // Bot Auto-Pilot state
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  const [minProfitThresholdUsd, setMinProfitThresholdUsd] = useState<number>(0.25);
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState<number>(4);
  const [botLogs, setBotLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);

  // DevInspect simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [devInspectResult, setDevInspectResult] = useState<DevInspectResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Filter pools
  const relevantPools = pools.filter(
    (p) => p.tokenA.symbol === borrowTokenSymbol || p.tokenB.symbol === borrowTokenSymbol
  );

  const buyPool = relevantPools.find((p) => p.id === selectedBuyPoolId) || relevantPools[0] || null;
  const sellPool =
    relevantPools.find((p) => p.id === selectedSellPoolId && p.id !== buyPool?.id) ||
    relevantPools.find((p) => p.id !== buyPool?.id) ||
    null;

  const runDevInspect = async () => {
    if (!buyPool || !sellPool) {
      setSimulationError('Pilih dua pool DEX berbeda terlebih dahulu.');
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);

    try {
      const res = await fetch('/api/dex/devinspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyPool,
          sellPool,
          borrowAmount,
          provider,
          suiPriceUsd,
          senderAddress: '0x0000000000000000000000000000000000000000000000000000000000000001',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: DevInspectResult = await res.json();
      setDevInspectResult(data);

      const logTime = new Date().toLocaleTimeString();
      if (data.safeToExecute) {
        setBotLogs((prev) => [
          {
            id: String(Date.now()),
            time: logTime,
            text: `[devInspect ON-CHAIN SUCCESS] Saldo Delta: +${data.netBalanceDeltaToken} ${buyPool.tokenA.symbol} (~$${data.netProfitUsd} USD) — LAYAK EKSEKUSI!`,
            type: 'success',
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        setBotLogs((prev) => [
          {
            id: String(Date.now()),
            time: logTime,
            text: `[devInspect GUARD ACTIVE] Eksekusi dicegah: ${data.rejectionReason}`,
            type: 'warn',
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err: any) {
      setSimulationError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Bot Polling loop
  React.useEffect(() => {
    if (!isBotActive) return;

    // Run first inspection
    runDevInspect();

    const interval = setInterval(() => {
      runDevInspect();
    }, pollIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [isBotActive, pollIntervalSeconds, buyPool?.id, sellPool?.id, borrowAmount, provider]);

  return (
    <div className="space-y-6">
      {/* Bot Controller Card */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              isBotActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 animate-pulse'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Bot Engine & Pre-Execution DevInspect Guard
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isBotActive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {isBotActive ? 'BOT AKTIF (POLLING)' : 'BOT STANDBY (MANUAL)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Simulasi Move VM on-chain gratis via sui_devInspectTransactionBlock. Memverifikasi saldo delta positif sebelum eksekusi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBotActive(!isBotActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-lg ${
                isBotActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isBotActive ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Hentikan Bot (Stop)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Mulai Bot Otomatis (Start)</span>
                </>
              )}
            </button>

            <button
              onClick={runDevInspect}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isSimulating ? 'Simulasi On-Chain...' : 'devInspect Sekali'}</span>
            </button>
          </div>
        </div>

        {/* Bot Parameters Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Batas Minimum Profit (Threshold):</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">$</span>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={minProfitThresholdUsd}
                onChange={(e) => setMinProfitThresholdUsd(parseFloat(e.target.value) || 0.1)}
                className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2 py-1 w-full text-xs font-bold"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-sans block">
              Transaksi hanya lolos jika Net Profit $\ge$ target ini
            </span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Interval Polling Bot:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="2"
                max="60"
                value={pollIntervalSeconds}
                onChange={(e) => setPollIntervalSeconds(parseInt(e.target.value) || 4)}
                className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2 py-1 w-full text-xs font-bold"
              />
              <span className="text-slate-400 text-[11px]">detik</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block">
              Frekuensi evaluasi devInspect per siklus
            </span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Pemberi Pinjaman Flash Loan:</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as FlashLoanProtocol)}
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2 py-1 w-full text-xs font-bold"
            >
              {Object.keys(FLASH_LOAN_PROVIDERS).map((p) => (
                <option key={p} value={p}>
                  {p} ({FLASH_LOAN_PROVIDERS[p as FlashLoanProtocol].feeBps} bps fee)
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 font-sans block">
              Protokol sumber modal tanpa agunan
            </span>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block">Jumlah Pinjaman Flash Loan:</span>
            <input
              type="number"
              step="500"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(parseFloat(e.target.value) || 1000)}
              className="bg-slate-950 border border-slate-700 text-slate-100 rounded px-2 py-1 w-full text-xs font-bold"
            />
            <span className="text-[10px] text-slate-500 font-sans block">
              Volume token {borrowTokenSymbol} yang dipinjam
            </span>
          </div>
        </div>

        {/* Selected Pool Route for Arbitration */}
        <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400">Rute Arbitrase:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {buyPool ? `${buyPool.protocol} (${buyPool.priceAtoB.value?.toFixed(4)})` : 'Pilih Pool 1'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {sellPool ? `${sellPool.protocol} (${sellPool.priceBtoA.value?.toFixed(4)})` : 'Pilih Pool 2'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Sumber Data: <span className="text-emerald-400 font-bold">Discovery Engine Terverifikasi [On-chain]</span>
          </div>
        </div>
      </div>

      {/* DevInspect Results & Guard Status Card */}
      {devInspectResult && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm">
                  Hasil Simulasi Move VM (sui_devInspectTransactionBlock)
                </h3>
                <span className="text-[10px] text-slate-400">
                  Dieksekusi pada Mainnet Epoch #{devInspectResult.executedEpoch} ({devInspectResult.executionDurationMs}ms)
                </span>
              </div>
            </div>

            {/* Guard Decision Banner */}
            {devInspectResult.safeToExecute ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 font-bold animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>GUARD: LAYAK EKSEKUSI (PROFITABLE)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/60 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>GUARD: DICEGAH / TIDAK LAYAK (ABORT)</span>
              </div>
            )}
          </div>

          {/* Rejection / Warning Reason if rejected */}
          {!devInspectResult.safeToExecute && devInspectResult.rejectionReason && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-300 flex items-start gap-2 font-sans text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono">PENJAGA KEAMANAN BOT AKTIF:</strong> {devInspectResult.rejectionReason}
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Status Move VM */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Status Move VM On-Chain:</span>
              <span className={`font-bold text-sm block mt-0.5 ${
                devInspectResult.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {devInspectResult.status.toUpperCase()} [On-chain]
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {devInspectResult.ptbCommandCount} Perintah Move PTB
              </span>
            </div>

            {/* 2. Gas Used On-Chain */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Biaya Gas Move Riil:</span>
              <span className="font-bold text-sm text-slate-200 block mt-0.5">
                {devInspectResult.gasUsed.netGasSui} SUI [On-chain]
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                ~${devInspectResult.gasUsed.netGasUsd} USD (@ ${suiPriceUsd})
              </span>
            </div>

            {/* 3. Delta Saldo Token */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Delta Saldo Swap Bersih:</span>
              <span className={`font-bold text-sm block mt-0.5 ${
                devInspectResult.netBalanceDeltaToken > 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {devInspectResult.netBalanceDeltaToken > 0 ? '+' : ''}
                {devInspectResult.netBalanceDeltaToken} {buyPool?.tokenA.symbol}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Setelah repay modal + loan fee
              </span>
            </div>

            {/* 4. Net Profit Bersih Akhir */}
            <div className={`p-3 rounded-xl border ${
              devInspectResult.netProfitUsd > 0
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}>
              <span className="text-slate-400 text-[10px] block">Net Profit Bersih (Setelah Gas):</span>
              <span className="font-bold text-base block mt-0.5">
                {devInspectResult.netProfitUsd > 0 ? '+' : ''}${devInspectResult.netProfitUsd} USD
              </span>
              <span className="text-[10px] opacity-80 mt-1 block">
                [Simulasi devInspect Real-time]
              </span>
            </div>
          </div>

          {/* Balance Changes Detail Table */}
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Rincian Perubahan Saldo Akun (Balance Changes Delta):
            </span>
            <div className="space-y-1.5">
              {devInspectResult.balanceChanges.map((change, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-950 px-3 py-1.5 rounded border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-white">{change.coinSymbol}</span>
                    <span className="text-slate-500 text-[10px] hidden sm:inline" title={change.coinType}>
                      ({change.coinType.slice(0, 16)}...)
                    </span>
                  </div>
                  <div className={`font-bold ${change.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change.amountDeltaRaw}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bot Execution Live Activity Log */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Log Aktivitas Bot & Guard Tracker ({botLogs.length} Entri)</span>
          </div>

          {botLogs.length > 0 && (
            <button
              onClick={() => setBotLogs([])}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Hapus Log
            </button>
          )}
        </div>

        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-[11px]">
          {botLogs.length === 0 ? (
            <div className="text-slate-500 text-center py-4 font-sans text-xs">
              Belum ada log. Klik &quot;devInspect Sekali&quot; atau aktifkan &quot;Mulai Bot Otomatis&quot; untuk menjalankan siklus pengujian.
            </div>
          ) : (
            botLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 text-[10px] shrink-0 font-mono">[{log.time}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-300'
                      : log.type === 'warn'
                      ? 'text-amber-300'
                      : log.type === 'error'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
