/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DexPool,
  FlashLoanProtocol,
  ArbitrageOpportunity,
  NetworkCongestionData,
} from '../types/dex';
import {
  calculateFlashLoanArbitrage,
  FLASH_LOAN_PROVIDERS,
  formatSourcedValue,
} from '../services/flashLoanEngine';
import {
  CANONICAL_TOKENS,
  formatCanonicalType,
  checkAssetMismatch,
} from '../services/tokens';
import { GasFeeEstimator } from './GasFeeEstimator';
import {
  Zap,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Coins,
  Cpu,
  Info,
  Layers,
  Code2,
} from 'lucide-react';

interface FlashLoanEnginePanelProps {
  pools: DexPool[];
  onOpenPtbModal: (opportunity: ArbitrageOpportunity) => void;
  suiPriceUsd?: number;
  congestion?: NetworkCongestionData;
}

export const FlashLoanEnginePanel: React.FC<FlashLoanEnginePanelProps> = ({
  pools,
  onOpenPtbModal,
  suiPriceUsd = 1.18,
  congestion,
}) => {
  const [borrowTokenSymbol, setBorrowTokenSymbol] = useState<string>('SUI');
  const [intermediateTokenSymbol, setIntermediateTokenSymbol] = useState<string>('USDC');
  const [provider, setProvider] = useState<FlashLoanProtocol>('Navi');
  const [borrowAmount, setBorrowAmount] = useState<number>(5000);
  const [selectedBuyPoolId, setSelectedBuyPoolId] = useState<string>('');
  const [selectedSellPoolId, setSelectedSellPoolId] = useState<string>('');

  const borrowToken = CANONICAL_TOKENS[borrowTokenSymbol] || CANONICAL_TOKENS.SUI;
  const intermediateToken = CANONICAL_TOKENS[intermediateTokenSymbol] || CANONICAL_TOKENS.USDC;

  // Filter pools that match the tokens
  const relevantPools = useMemo(() => {
    return pools.filter((p) => {
      const hasA =
        p.tokenA.symbol === borrowToken.symbol || p.tokenA.symbol === intermediateToken.symbol;
      const hasB =
        p.tokenB.symbol === borrowToken.symbol || p.tokenB.symbol === intermediateToken.symbol;
      return hasA && hasB;
    });
  }, [pools, borrowToken.symbol, intermediateToken.symbol]);

  // Default select pools if not selected
  const buyPool = relevantPools.find((p) => p.id === selectedBuyPoolId) || relevantPools[0];
  const sellPool =
    relevantPools.find((p) => p.id === selectedSellPoolId) ||
    (relevantPools.length > 1 ? relevantPools[1] : relevantPools[0]);

  // Asset mismatch validation
  const assetMismatch = checkAssetMismatch(
    borrowToken.canonicalType,
    intermediateToken.canonicalType
  );

  // Compute Arbitrage Opportunity
  const opportunityResult = useMemo(() => {
    if (!buyPool || !sellPool) return null;
    return calculateFlashLoanArbitrage({
      borrowToken,
      intermediateToken,
      borrowAmount,
      provider,
      poolBuy: buyPool,
      poolSell: sellPool,
      suiPriceUsd,
    });
  }, [borrowToken, intermediateToken, borrowAmount, provider, buyPool, sellPool, suiPriceUsd]);

  const opportunity =
    opportunityResult && !('error' in opportunityResult) ? opportunityResult : null;
  const errorMessage =
    opportunityResult && 'error' in opportunityResult ? opportunityResult.error : null;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Kalkulator & Simulator Real Flash Loan Sui
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Atomic PTB Single-Tx
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulasi eksekusi tanpa risiko. Meminjam dari protokol lending/CLMM, melakukan swap silang di dua DEX, dan melunasi pinjaman dalam satu Programmable Transaction Block.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          Biaya Pinjaman {provider}:{' '}
          <span className="text-cyan-400 font-bold">
            {FLASH_LOAN_PROVIDERS[provider].feeBps} bps ({FLASH_LOAN_PROVIDERS[provider].feeBps / 100}%)
          </span>
        </div>
      </div>

      {/* Asset Mismatch Alert */}
      {assetMismatch.isMismatch && (
        <div className="p-3 bg-rose-950/40 border border-rose-700/50 rounded-lg text-xs text-rose-300 flex items-center gap-2 font-mono">
          <span className="font-bold">DILARANG:</span> {assetMismatch.message}
        </div>
      )}

      {/* Input Configuration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        {/* 1. Flash Loan Provider */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
          <label className="text-slate-400 font-semibold block">Protokol Flash Loan:</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as FlashLoanProtocol)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-500"
          >
            {Object.keys(FLASH_LOAN_PROVIDERS).map((key) => (
              <option key={key} value={key}>
                {key} ({FLASH_LOAN_PROVIDERS[key as FlashLoanProtocol].feeBps} bps)
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-500">
            {FLASH_LOAN_PROVIDERS[provider].description}
          </div>
        </div>

        {/* 2. Borrow Token */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
          <label className="text-slate-400 font-semibold block">Token Pinjaman (Awal):</label>
          <select
            value={borrowTokenSymbol}
            onChange={(e) => setBorrowTokenSymbol(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-500"
          >
            {Object.keys(CANONICAL_TOKENS).map((key) => (
              <option key={key} value={key}>
                {key} - {CANONICAL_TOKENS[key].name}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-500 truncate" title={borrowToken.canonicalType}>
            {formatCanonicalType(borrowToken.canonicalType)}
          </div>
        </div>

        {/* 3. Intermediate Token */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
          <label className="text-slate-400 font-semibold block">Token Perantara (Swap):</label>
          <select
            value={intermediateTokenSymbol}
            onChange={(e) => setIntermediateTokenSymbol(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-500"
          >
            {Object.keys(CANONICAL_TOKENS).map((key) => (
              <option key={key} value={key}>
                {key} - {CANONICAL_TOKENS[key].name}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-500 truncate" title={intermediateToken.canonicalType}>
            {formatCanonicalType(intermediateToken.canonicalType)}
          </div>
        </div>

        {/* 4. Borrow Amount */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-slate-400 font-semibold">Jumlah Pinjaman:</label>
            <span className="text-[11px] text-cyan-400 font-bold">{borrowToken.symbol}</span>
          </div>
          <input
            type="number"
            min="1"
            step="100"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 font-bold focus:outline-none focus:border-cyan-500"
          />
          <div className="text-[10px] text-slate-500">
            Setara: ~${(borrowAmount * (borrowToken.symbol === 'SUI' ? suiPriceUsd : 1)).toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Selected Pools Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Buy Pool */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Pool Beli (Step 1): {borrowToken.symbol} → {intermediateToken.symbol}
            </span>
          </div>
          {relevantPools.length === 0 ? (
            <div className="text-slate-500 text-[11px]">
              — (Tidak ada pool on-chain terdeteksi untuk pasangan ini)
            </div>
          ) : (
            <select
              value={buyPool?.id || ''}
              onChange={(e) => setSelectedBuyPoolId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-500"
            >
              {relevantPools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.protocol} - Harga: {p.priceAtoB.value?.toFixed(5)} [On-chain] (TVL: ${p.liquidityUsd.value?.toLocaleString() || 0})
                </option>
              ))}
            </select>
          )}
          {buyPool && (
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Pool ID: {buyPool.poolAddress.slice(0, 10)}...</span>
              <span>Fee: {buyPool.feeBps.value} bps</span>
            </div>
          )}
        </div>

        {/* Sell Pool */}
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Pool Jual (Step 2): {intermediateToken.symbol} → {borrowToken.symbol}
            </span>
          </div>
          {relevantPools.length === 0 ? (
            <div className="text-slate-500 text-[11px]">
              — (Tidak ada pool on-chain terdeteksi untuk pasangan ini)
            </div>
          ) : (
            <select
              value={sellPool?.id || ''}
              onChange={(e) => setSelectedSellPoolId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-500"
            >
              {relevantPools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.protocol} - Harga: {p.priceBtoA.value?.toFixed(5)} [On-chain] (TVL: ${p.liquidityUsd.value?.toLocaleString() || 0})
                </option>
              ))}
            </select>
          )}
          {sellPool && (
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Pool ID: {sellPool.poolAddress.slice(0, 10)}...</span>
              <span>Fee: {sellPool.feeBps.value} bps</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Network Congestion Gas Fee Estimator */}
      <GasFeeEstimator
        congestion={congestion}
        suiPriceUsd={suiPriceUsd}
        netProfitUsd={opportunity?.estimatedNetProfitUsd?.value ?? null}
      />

      {/* Execution Math Breakdown Box */}
      {errorMessage ? (
        <div className="p-4 bg-slate-950 rounded-xl border border-rose-800/40 text-xs font-mono text-rose-300">
          <div className="font-semibold text-rose-400 mb-1">Simulasi Tidak Dapat Dihitung:</div>
          <div>{errorMessage}</div>
        </div>
      ) : opportunity ? (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-slate-200">
                Rincian Neraca Flash Loan & Spread Silang
              </span>
            </div>

            {/* Profitability Status Badge */}
            {opportunity.isProfitable ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold animate-pulse">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>MENGUNTUNGKAN [Simulasi]</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-300 font-mono text-xs font-bold">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>TIDAK MENGUNTUNGKAN / RUGI [Simulasi]</span>
              </div>
            )}
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* 1. Pinjaman Awal */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Pinjaman Flash Loan:</div>
              <div className="text-sm font-bold text-white mt-1">
                {opportunity.simulatedBorrowAmount.toLocaleString()} {opportunity.tokenBorrow.symbol}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Fee: {opportunity.estimatedLoanFeeAmount.value?.toFixed(4)} {opportunity.tokenBorrow.symbol} [Kuotasi]
              </div>
            </div>

            {/* 2. Spread Kotor */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Spread Kotor:</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  (opportunity.grossSpreadPct.value || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {opportunity.grossSpreadPct.value !== null
                  ? `${opportunity.grossSpreadPct.value > 0 ? '+' : ''}${opportunity.grossSpreadPct.value}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">[Kuotasi Silang DEX]</div>
            </div>

            {/* 3. Estimasi Gas PTB */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Estimasi Gas Sui:</div>
              <div className="text-sm font-bold text-cyan-300 mt-1">
                {opportunity.estimatedGasSui.value} SUI
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ~${opportunity.estimatedGasCostUsd.value} USD [Simulasi PTB]
              </div>
            </div>

            {/* 4. Net Profit / Shortfall */}
            <div
              className={`p-3 rounded-lg border ${
                opportunity.isProfitable
                  ? 'bg-emerald-950/30 border-emerald-700/50'
                  : 'bg-rose-950/30 border-rose-800/50'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                {opportunity.isProfitable ? 'Net Profit Bersih:' : 'Kekurangan / Shortfall:'}
              </div>
              <div
                className={`text-sm font-bold mt-1 ${
                  opportunity.isProfitable ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {opportunity.estimatedNetProfitToken.value !== null
                  ? `${opportunity.estimatedNetProfitToken.value > 0 ? '+' : ''}${opportunity.estimatedNetProfitToken.value} ${opportunity.tokenBorrow.symbol}`
                  : '—'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                ROI: {opportunity.netRoiPct.value}% [Simulasi]
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Simulasi on-chain tidak mengekspos kunci privat apapun. PTB dapat diuji di Mainnet RPC secara aman.
              </span>
            </div>

            <button
              onClick={() => onOpenPtbModal(opportunity)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition-all font-mono"
            >
              <Code2 className="w-4 h-4" />
              Periksa & Jalankan PTB (5 Step Move)
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
