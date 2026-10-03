/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DexPool } from '../types/dex';
import { formatSourcedValue } from '../services/flashLoanEngine';
import { formatCanonicalType } from '../services/tokens';
import { RefreshCw, Search, ExternalLink, Zap, Layers, AlertCircle } from 'lucide-react';

interface DexPoolsScannerProps {
  pools: DexPool[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPoolForArbitrage: (pool: DexPool) => void;
  error?: string | null;
}

export const DexPoolsScanner: React.FC<DexPoolsScannerProps> = ({
  pools,
  isLoading,
  onRefresh,
  onSelectPoolForArbitrage,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.tokenA.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.tokenB.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.poolAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProtocol =
      selectedProtocol === 'ALL' ||
      pool.protocol.toUpperCase().includes(selectedProtocol.toUpperCase());

    return matchesSearch && matchesProtocol;
  });

  const uniqueProtocols = Array.from(new Set(pools.map((p) => p.protocol)));

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Pemindai DEX On-Chain Sui (Live Pools)
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {filteredPools.length} Pool Aktif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data harga dan cadangan langsung dari state pool DEX di jaringan Sui. Setiap angka berlabel [On-chain].
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Protocol Filter */}
          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Semua DEX ({pools.length})</option>
            {uniqueProtocols.map((prot) => (
              <option key={prot} value={prot}>
                {prot}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari token / pool address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-1.5 font-mono focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Pindai Ulang</span>
          </button>
        </div>
      </div>

      {/* Error state if any */}
      {error && (
        <div className="m-4 p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="py-3 px-4">Pasangan Token (Kanonikal)</th>
              <th className="py-3 px-4">DEX Protokol</th>
              <th className="py-3 px-4">Objek Pool On-Chain</th>
              <th className="py-3 px-4 text-right">Harga A → B [On-chain]</th>
              <th className="py-3 px-4 text-right">Harga B → A [On-chain]</th>
              <th className="py-3 px-4 text-right">Likuiditas (USD) [On-chain]</th>
              <th className="py-3 px-4 text-center">Fee (bps)</th>
              <th className="py-3 px-4 text-center">Aksi Arbitrage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredPools.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  {isLoading ? 'Memindai pool on-chain...' : 'Tidak ada pool yang cocok dengan kriteria.'}
                </td>
              </tr>
            ) : (
              filteredPools.map((pool) => {
                const priceAtoBDisplay = formatSourcedValue(pool.priceAtoB, (v) =>
                  v < 0.0001 ? v.toExponential(4) : v.toFixed(5)
                );
                const priceBtoADisplay = formatSourcedValue(pool.priceBtoA, (v) =>
                  v < 0.0001 ? v.toExponential(4) : v.toFixed(5)
                );
                const liquidityDisplay = formatSourcedValue(pool.liquidityUsd, (v) =>
                  `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                );
                const feeDisplay = formatSourcedValue(pool.feeBps, (v) => `${v} bps`);

                return (
                  <tr key={pool.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Token Pair */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{pool.tokenA.symbol}</span>
                        <span className="text-slate-500">/</span>
                        <span>{pool.tokenB.symbol}</span>
                      </div>
                      <div
                        className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5"
                        title={`${formatCanonicalType(pool.tokenA.canonicalType)} / ${formatCanonicalType(pool.tokenB.canonicalType)}`}
                      >
                        {formatCanonicalType(pool.tokenA.canonicalType)}
                      </div>
                    </td>

                    {/* Protocol */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                        {pool.protocol}
                      </span>
                    </td>

                    {/* On-Chain Address */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span title={pool.poolAddress}>
                          {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}
                        </span>
                        <a
                          href={`https://suiscan.xyz/mainnet/object/${pool.poolAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-cyan-400"
                          title="Periksa objek pool di SuiScan"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Price A->B */}
                    <td className="py-3 px-4 text-right">
                      <div className="text-slate-100 font-semibold" title={priceAtoBDisplay.sourceDetail}>
                        {priceAtoBDisplay.isEmpty ? (
                          <span className="text-slate-500">{priceAtoBDisplay.display}</span>
                        ) : (
                          <>
                            {priceAtoBDisplay.display.split(' ')[0]}{' '}
                            <span className="text-[10px] text-cyan-400 font-normal">
                              {priceAtoBDisplay.badge}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Price B->A */}
                    <td className="py-3 px-4 text-right">
                      <div className="text-slate-100" title={priceBtoADisplay.sourceDetail}>
                        {priceBtoADisplay.isEmpty ? (
                          <span className="text-slate-500">{priceBtoADisplay.display}</span>
                        ) : (
                          <>
                            {priceBtoADisplay.display.split(' ')[0]}{' '}
                            <span className="text-[10px] text-cyan-400 font-normal">
                              {priceBtoADisplay.badge}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Liquidity */}
                    <td className="py-3 px-4 text-right">
                      <div className="text-emerald-400 font-medium" title={liquidityDisplay.sourceDetail}>
                        {liquidityDisplay.isEmpty ? (
                          <span className="text-slate-500">{liquidityDisplay.display}</span>
                        ) : (
                          <>
                            {liquidityDisplay.display.split(' ')[0]}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              {liquidityDisplay.badge}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Fee */}
                    <td className="py-3 px-4 text-center">
                      <span className="text-slate-300" title={feeDisplay.sourceDetail}>
                        {feeDisplay.display.split(' ')[0]} {feeDisplay.display.split(' ')[1]}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectPoolForArbitrage(pool)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition-colors"
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        Pilih Pasangan
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
