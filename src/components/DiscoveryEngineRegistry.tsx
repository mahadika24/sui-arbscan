/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DexPool, PoolStatus, PoolVerificationProof } from '../types/dex';
import { formatSourcedValue } from '../services/flashLoanEngine';
import { formatCanonicalType, checkAssetMismatch } from '../services/tokens';
import {
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileCode2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DiscoveryEngineRegistryProps {
  pools: DexPool[];
  allDiscoveredPools?: DexPool[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPoolForArbitrage?: (pool: DexPool) => void;
}

export const DiscoveryEngineRegistry: React.FC<DiscoveryEngineRegistryProps> = ({
  pools,
  allDiscoveredPools = [],
  isLoading,
  onRefresh,
  onSelectPoolForArbitrage,
}) => {
  const [selectedProof, setSelectedProof] = useState<{ pool: DexPool; proof: PoolVerificationProof } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PoolStatus>('ALL');

  const poolList = allDiscoveredPools.length > 0 ? allDiscoveredPools : pools;

  const countDiscovered = poolList.length;
  const countVerified = poolList.filter((p) => p.status === 'VERIFIED' || p.status === 'QUOTEABLE' || p.status === 'EXECUTABLE').length;
  const countQuoteable = poolList.filter((p) => p.status === 'QUOTEABLE' || p.status === 'EXECUTABLE').length;
  const countExecutable = poolList.filter((p) => p.status === 'EXECUTABLE').length;

  const filteredPools = poolList.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getStatusBadge = (status: PoolStatus) => {
    switch (status) {
      case 'EXECUTABLE':
        return { label: 'EXECUTABLE', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50', dot: 'bg-emerald-400' };
      case 'QUOTEABLE':
        return { label: 'QUOTEABLE', color: 'bg-amber-950/80 text-amber-300 border-amber-500/50', dot: 'bg-amber-400' };
      case 'VERIFIED':
        return { label: 'VERIFIED', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50', dot: 'bg-cyan-400' };
      case 'DISCOVERED':
      default:
        return { label: 'DISCOVERED', color: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Pipeline Banner */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Discovery Engine — Registry Pool Terverifikasi On-Chain
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                  Fase A
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Verifikasi eksistensi objek Move, paket DEX, status shared object, dan normalisasi koin kanonik via Sui RPC.
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all disabled:opacity-50 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isLoading ? 'Memindai & Memverifikasi RPC...' : 'Pindai & Verifikasi Ulang'}</span>
          </button>
        </div>

        {/* 4-Stage Lifecycle Stepper */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <button
            onClick={() => setStatusFilter(statusFilter === 'DISCOVERED' ? 'ALL' : 'DISCOVERED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'DISCOVERED'
                ? 'bg-slate-800/90 border-slate-500 ring-1 ring-slate-400'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>1. DISCOVERED</span>
              <span className="text-base font-bold text-slate-200">{countDiscovered}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">
              Terdeteksi dari event indeks / agregator pasar
            </p>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'VERIFIED'
                ? 'bg-cyan-950/80 border-cyan-500 ring-1 ring-cyan-400'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-cyan-400 text-[11px]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                2. VERIFIED
              </span>
              <span className="text-base font-bold text-cyan-200">{countVerified}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Eksistensi objek & tipe Move terkonfirmasi via RPC
            </p>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'QUOTEABLE' ? 'ALL' : 'QUOTEABLE')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'QUOTEABLE'
                ? 'bg-amber-950/80 border-amber-500 ring-1 ring-amber-400'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                3. QUOTEABLE
              </span>
              <span className="text-base font-bold text-amber-200">{countQuoteable}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Harga pasar & cadangan likuiditas terkuotasi
            </p>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'EXECUTABLE' ? 'ALL' : 'EXECUTABLE')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'EXECUTABLE'
                ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-400'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 text-[11px]">
              <span className="flex items-center gap-1">
                <FileCode2 className="w-3.5 h-3.5" />
                4. EXECUTABLE
              </span>
              <span className="text-base font-bold text-emerald-200">{countExecutable}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Fungsi swap Move non-generik siap dieksekusi PTB
            </p>
          </button>
        </div>

        {/* Info note */}
        <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 font-mono flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">ATURAN INTEGRITAS FASE A:</span>
            <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
              Scanner dan Simulator hanya memproses pool berstatus <strong className="text-cyan-300 font-mono">VERIFIED / QUOTEABLE / EXECUTABLE</strong>. Pool palsu atau pool yang tidak ada di state on-chain Sui otomatis ditolak. Harga & TVL diberi label <strong className="text-amber-300 font-mono">[Kuotasi] / [Eksternal]</strong>, sedangkan cadangan Move struct dan digest diberi label <strong className="text-emerald-300 font-mono">[On-chain]</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Pools Table / Registry List */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200 font-mono">
              Daftar Pool Terverifikasi ({filteredPools.length} dari {poolList.length})
            </span>
            {statusFilter !== 'ALL' && (
              <span className="text-xs text-cyan-400 font-mono">
                [Filter: {statusFilter}]
              </span>
            )}
          </div>
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs text-slate-400 hover:text-cyan-300 font-mono underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Protokol & Status</th>
                <th className="py-3 px-4">Pasangan Token Kanonik</th>
                <th className="py-3 px-4">Alamat Pool On-Chain</th>
                <th className="py-3 px-4">Fungsi Swap Move Terverifikasi</th>
                <th className="py-3 px-4">Cadangan On-Chain</th>
                <th className="py-3 px-4">Harga & TVL</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredPools.map((pool) => {
                const statusBadge = getStatusBadge(pool.status);
                const priceDisplay = formatSourcedValue(pool.priceAtoB, (v) => v.toFixed(5));
                const tvlDisplay = formatSourcedValue(pool.liquidityUsd, (v) => `$${v.toLocaleString()}`);
                const reserveADisplay = formatSourcedValue(pool.reserveA, (v) => `${v.toLocaleString()} ${pool.tokenA.symbol}`);
                const reserveBDisplay = formatSourcedValue(pool.reserveB, (v) => `${v.toLocaleString()} ${pool.tokenB.symbol}`);
                const isMismatch = checkAssetMismatch(pool.tokenA.canonicalType, pool.tokenB.canonicalType).isMismatch;

                return (
                  <tr key={pool.id} className="hover:bg-slate-900/60 transition-colors">
                    {/* Protocol & Status */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-100">{pool.protocol}</div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                          {statusBadge.label}
                        </span>
                      </div>
                    </td>

                    {/* Canonical Tokens */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{pool.tokenA.symbol}</span>
                        <span className="text-slate-500">/</span>
                        <span>{pool.tokenB.symbol}</span>
                        {isMismatch && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                            Aset Terisolasi
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                        <div title={pool.tokenA.canonicalType}>
                          A: {formatCanonicalType(pool.tokenA.canonicalType)}
                        </div>
                        <div title={pool.tokenB.canonicalType}>
                          B: {formatCanonicalType(pool.tokenB.canonicalType)}
                        </div>
                      </div>
                    </td>

                    {/* Pool Object Address */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <span>{pool.poolAddress.slice(0, 10)}...{pool.poolAddress.slice(-6)}</span>
                        <button
                          onClick={() => copyToClipboard(pool.poolAddress)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                          title="Salin Alamat Pool"
                        >
                          {copiedAddress === pool.poolAddress ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <a
                          href={`https://suiscan.xyz/mainnet/object/${pool.poolAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300"
                          title="Periksa Objek di SuiScan"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {pool.verificationProof && (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Owner: {pool.verificationProof.ownerType} (v{pool.verificationProof.version})</span>
                        </div>
                      )}
                    </td>

                    {/* Move Swap Function */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-[11px] text-slate-200 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800/80 inline-block max-w-[200px] truncate" title={pool.swapFunctionAtoB}>
                        {pool.swapFunctionAtoB}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Paket: {pool.packageId.slice(0, 8)}... | Modul: {pool.swapModule}
                      </div>
                    </td>

                    {/* On-Chain Reserves */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-[11px]">
                        <div title={reserveADisplay.sourceDetail}>
                          {reserveADisplay.display}
                        </div>
                        <div title={reserveBDisplay.sourceDetail} className="mt-0.5">
                          {reserveBDisplay.display}
                        </div>
                      </div>
                    </td>

                    {/* Price & TVL */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-100" title={priceDisplay.sourceDetail}>
                        {priceDisplay.display}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5" title={tvlDisplay.sourceDetail}>
                        TVL: {tvlDisplay.display}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 align-top text-right space-y-1.5">
                      {pool.verificationProof && (
                        <button
                          onClick={() => setSelectedProof({ pool, proof: pool.verificationProof! })}
                          className="px-2.5 py-1 rounded text-[11px] bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/50 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Bukti RPC</span>
                        </button>
                      )}

                      {onSelectPoolForArbitrage && (
                        <button
                          onClick={() => onSelectPoolForArbitrage(pool)}
                          className="px-2.5 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 ml-auto"
                        >
                          <span>Pilih Arbitrase</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic On-Chain Verification Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 my-8 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Bukti Verifikasi Objek Move On-Chain (Sui Mainnet)
                </h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>TERVERIFIKASI REAL-TIME ON-CHAIN VIA SUI RPC</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Objek Move terdaftar secara valid pada memori status Sui Mainnet dan memiliki tipe shared object yang dapat diakses oleh transaksi PTB.
              </p>
            </div>

            {/* Proof Data Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Object ID:</span>
                <span className="text-cyan-300 font-bold break-all block mt-0.5">
                  {selectedProof.pool.poolAddress}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Tipe Kepemilikan (Owner):</span>
                <span className="text-emerald-400 font-bold block mt-0.5">
                  {selectedProof.proof.ownerType} (Shared Object PTB)
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Versi Objek (Version):</span>
                <span className="text-slate-200 font-bold block mt-0.5">
                  {selectedProof.proof.version}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Waktu Verifikasi (VerifiedAt):</span>
                <span className="text-slate-200 font-bold block mt-0.5">
                  {new Date(selectedProof.proof.verifiedAt).toLocaleTimeString()} WIB
                </span>
              </div>
            </div>

            {/* Move Struct Type */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">Tipe Move Struct On-Chain:</span>
              <code className="text-cyan-200 text-[10px] break-all block bg-slate-900 p-2 rounded border border-slate-800">
                {selectedProof.proof.onChainType}
              </code>
            </div>

            {/* Exact Swap Function */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">Fungsi Swap Move Resmi (Non-Generik):</span>
              <code className="text-emerald-300 text-[10px] break-all block bg-slate-900 p-2 rounded border border-slate-800">
                {selectedProof.pool.swapFunctionAtoB}
              </code>
            </div>

            {/* Raw RPC Snippet */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">Cuplikan Respons RPC sui_getObject:</span>
              <pre className="text-[9px] text-slate-400 bg-slate-900 p-2.5 rounded overflow-x-auto border border-slate-800 max-h-32">
                {JSON.stringify(JSON.parse(selectedProof.proof.rawRpcOutputSnippet), null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
