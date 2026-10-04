/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NetworkCongestionData, PriorityTier } from '../types/dex';
import { calculatePtbGasEstimate } from '../services/gasEstimator';
import { formatSourcedValue } from '../services/flashLoanEngine';
import {
  Gauge,
  Flame,
  Zap,
  Info,
  Sliders,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface GasFeeEstimatorProps {
  congestion?: NetworkCongestionData;
  suiPriceUsd?: number;
  netProfitUsd?: number | null;
  onBudgetChange?: (budgetSui: number) => void;
}

export const GasFeeEstimator: React.FC<GasFeeEstimatorProps> = ({
  congestion,
  suiPriceUsd = 1.18,
  netProfitUsd = null,
}) => {
  const [priorityTier, setPriorityTier] = useState<PriorityTier>('standard');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const gasBreakdown = calculatePtbGasEstimate({
    congestion,
    suiPriceUsd,
    priorityTier,
  });

  const congestionLevel = congestion?.congestionLevel?.value ?? 'NORMAL';
  const rgpDisplay = formatSourcedValue(congestion?.referenceGasPriceMist, (v) => `${v} MIST`);
  const txCountDisplay = formatSourcedValue(congestion?.checkpointTxCount, (v) => `${v} tx/blok`);
  const tpsDisplay = formatSourcedValue(congestion?.estimatedTps, (v) => `~${v} TPS`);

  const congestionBadge = {
    LOW: { label: 'Rendah (Lancar)', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40', icon: '🟢' },
    NORMAL: { label: 'Normal (Stabil)', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40', icon: '🔵' },
    ELEVATED: { label: 'Meningkat', color: 'bg-amber-950/60 text-amber-300 border-amber-500/40', icon: '🟡' },
    HIGH: { label: 'Tinggi (Padat)', color: 'bg-rose-950/60 text-rose-300 border-rose-500/40', icon: '🔴' },
  }[congestionLevel];

  const netGasSuiVal = gasBreakdown.totalNetGasSui.value ?? 0.005;
  const netGasUsdVal = gasBreakdown.totalNetGasUsd.value ?? 0.006;
  const isGasEatingProfit = netProfitUsd !== null && netProfitUsd > 0 && netProfitUsd < netGasUsdVal;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 font-mono text-xs">
      {/* Title & Network Congestion Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">
                Estimator Biaya Gas PTB & Status Kongesti Jaringan
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${congestionBadge.color}`}>
                {congestionBadge.icon} {congestionBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Kalkulasi beban jaringan Sui real-time berdasarkan Reference Gas Price (RGP) dan kepadatan transaksi blok.
            </p>
          </div>
        </div>

        {/* Live Congestion Metrics Pill */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] self-start sm:self-auto">
          <div title={rgpDisplay.sourceDetail}>
            <span className="text-slate-400">RGP: </span>
            <span className="text-cyan-300 font-bold">{rgpDisplay.display}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div title={txCountDisplay.sourceDetail}>
            <span className="text-slate-400">Beban: </span>
            <span className="text-slate-200 font-semibold">{txCountDisplay.display}</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:block" title={tpsDisplay.sourceDetail}>
            <span className="text-slate-400">Throughput: </span>
            <span className="text-slate-200">{tpsDisplay.display}</span>
          </div>
        </div>
      </div>

      {/* Speed & Priority Tier Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-slate-300 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Tingkat Prioritas Eksekusi Arbitrase:
          </span>
          <span className="text-slate-400">
            Harga Efektif: <strong className="text-cyan-300">{gasBreakdown.gasPriceMist.value} MIST [Kuotasi]</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Standard */}
          <button
            type="button"
            onClick={() => setPriorityTier('standard')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              priorityTier === 'standard'
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-850 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span>Standar</span>
              <span className="text-[10px] text-slate-400">1.0x RGP</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Normal (~0.0048 SUI)
            </div>
          </button>

          {/* Fast */}
          <button
            type="button"
            onClick={() => setPriorityTier('fast')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              priorityTier === 'fast'
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-850 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Cepat
              </span>
              <span className="text-[10px] text-amber-400">1.15x RGP</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Prioritas Tip Ringan
            </div>
          </button>

          {/* Turbo */}
          <button
            type="button"
            onClick={() => setPriorityTier('turbo')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              priorityTier === 'turbo'
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:bg-slate-850 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-rose-400" />
                Turbo MEV
              </span>
              <span className="text-[10px] text-rose-400">1.30x RGP</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Menangkan Balapan Arbitrase
            </div>
          </button>
        </div>
      </div>

      {/* Estimated Gas Overview Card */}
      <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            Total Estimasi Biaya Jaringan (Net Gas):
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              {netGasSuiVal.toFixed(6)} SUI
            </span>
            <span className="text-xs text-cyan-400 font-semibold">
              (~${netGasUsdVal.toFixed(4)} USD)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">[Simulasi PTB]</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-[11px]">
            <div className="text-slate-400">Gas Budget Aman:</div>
            <div className="font-bold text-slate-200">
              {gasBreakdown.recommendedGasBudgetSui.value} SUI [Simulasi]
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isExpanded ? 'Tutup Rincian' : 'Rincian Lengkap'}
          </button>
        </div>
      </div>

      {/* Warning if Gas Fee impacts Arbitrage Margin */}
      {isGasEatingProfit && (
        <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-[11px] text-amber-300 flex items-start gap-2 font-sans">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-mono">PERINGATAN MARGIN TIPIS:</strong> Biaya gas jaringan (~${netGasUsdVal.toFixed(4)} USD) memakan sebagian besar atau seluruh margin keuntungan swap (~${netProfitUsd?.toFixed(4)} USD). Pertimbangkan menaikkan volume pinjaman atau menggunakan mode Standar.
          </div>
        </div>
      )}

      {/* Detailed Technical Gas Breakdown Accordion */}
      {isExpanded && (
        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-2 text-[11px]">
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">
            Komponen Teknis Gas Fee Pada Move PTB:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Unit Komputasi:</span>
              <span className="text-slate-200 font-bold">
                {gasBreakdown.computationUnits.value?.toLocaleString()} [Simulasi]
              </span>
            </div>

            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Alokasi Penyimpanan:</span>
              <span className="text-slate-200 font-bold">
                {gasBreakdown.storageUnits.value?.toLocaleString()} MIST [Simulasi]
              </span>
            </div>

            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Storage Rebate:</span>
              <span className="text-emerald-400 font-bold">
                -{gasBreakdown.storageRebate.value?.toLocaleString()} MIST [Simulasi]
              </span>
            </div>

            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Tip Prioritas:</span>
              <span className="text-amber-400 font-bold">
                +{gasBreakdown.priorityGasSui.value} SUI [Kuotasi]
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1.5 font-sans">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Rumus On-Chain Sui: <code>Net Gas = (Computation Units × Gas Price) + Storage Units - Storage Rebate</code>. Objek receipt pinjaman yang dihapus mengembalikan sebagian besar storage fee.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
