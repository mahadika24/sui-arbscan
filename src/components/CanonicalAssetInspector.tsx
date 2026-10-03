/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { normalizeStructTag } from '@mysten/sui/utils';
import {
  CANONICAL_TOKENS,
  NATIVE_USDC_TYPE,
  WORMHOLE_USDC_TYPE,
  checkAssetMismatch,
  areCoinsIdentical,
} from '../services/tokens';
import { AlertTriangle, CheckCircle, ShieldAlert, Copy, Check, ArrowRightLeft } from 'lucide-react';

export const CanonicalAssetInspector: React.FC = () => {
  const [tokenKeyA, setTokenKeyA] = useState<string>('USDC');
  const [tokenKeyB, setTokenKeyB] = useState<string>('wUSDC');
  const [customInputA, setCustomInputA] = useState<string>('');
  const [customInputB, setCustomInputB] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tokenA = CANONICAL_TOKENS[tokenKeyA];
  const tokenB = CANONICAL_TOKENS[tokenKeyB];

  const typeA = customInputA.trim() ? customInputA.trim() : tokenA.canonicalType;
  const typeB = customInputB.trim() ? customInputB.trim() : tokenB.canonicalType;

  let normA = '';
  let normB = '';
  let normErrorA = '';
  let normErrorB = '';

  try {
    normA = normalizeStructTag(typeA);
  } catch (err: any) {
    normErrorA = err.message || 'Format StructTag tidak valid';
  }

  try {
    normB = normalizeStructTag(typeB);
  } catch (err: any) {
    normErrorB = err.message || 'Format StructTag tidak valid';
  }

  const isIdentical = normA && normB ? areCoinsIdentical(normA, normB) : false;
  const mismatchResult = normA && normB ? checkAssetMismatch(normA, normB) : { isMismatch: false };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Kanonikalisasi Tipe Koin & Isolasi Aset
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              normalizeStructTag
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aturan Wajib: Koin yang berbeda (seperti Native USDC vs wUSDC) memiliki identitas on-chain terpisah dan tidak boleh dianggap sama dalam flash loan.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 self-start sm:self-auto">
          Status Enforcer: <span className="text-emerald-400 font-bold">AKTIF</span>
        </div>
      </div>

      {/* Warning Spotlight for Native USDC vs wUSDC */}
      <div className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-700/40 text-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300 text-sm">
              Perbedaan Krusial: Native USDC (Circle) vs Wormhole wUSDC (Bridged)
            </div>
            <p className="text-slate-300 leading-relaxed">
              Di Sui Network, Circle menerbitkan USDC resmi melalui paket <code className="bg-slate-900 text-cyan-300 px-1 py-0.5 rounded font-mono">0xdba346...::usdc::USDC</code>.
              Sedangkan Wormhole USDC berasal dari bridge ETH dengan paket <code className="bg-slate-900 text-pink-300 px-1 py-0.5 rounded font-mono">0x5d4b30...::coin::COIN</code>.
              Kedua koin ini memiliki likuiditas terpisah di DEX. Jika bot meminjam Native USDC lalu swap ke wUSDC, transaksi akan <span className="text-rose-400 font-bold underline">GAGAL (MoveAbort ETokenRepayShortfall)</span> saat pelunasan flash loan.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Token Tag Comparator */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token A Box */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Token Input A:</span>
            <select
              value={tokenKeyA}
              onChange={(e) => {
                setTokenKeyA(e.target.value);
                setCustomInputA('');
              }}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500"
            >
              {Object.keys(CANONICAL_TOKENS).map((key) => (
                <option key={key} value={key}>
                  {key} - {CANONICAL_TOKENS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="font-mono text-xs break-all bg-slate-900/90 p-2.5 rounded border border-slate-800 text-cyan-300 flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Kanonikal (normalizeStructTag):
              </div>
              <div>{normA || <span className="text-rose-400">{normErrorA}</span>}</div>
            </div>
            <button
              onClick={() => copyToClipboard(normA, 'A')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 shrink-0"
              title="Salin Struct Tag Kanonikal"
            >
              {copiedKey === 'A' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Token B Box */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Token Input B:</span>
            <select
              value={tokenKeyB}
              onChange={(e) => {
                setTokenKeyB(e.target.value);
                setCustomInputB('');
              }}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500"
            >
              {Object.keys(CANONICAL_TOKENS).map((key) => (
                <option key={key} value={key}>
                  {key} - {CANONICAL_TOKENS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="font-mono text-xs break-all bg-slate-900/90 p-2.5 rounded border border-slate-800 text-pink-300 flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Kanonikal (normalizeStructTag):
              </div>
              <div>{normB || <span className="text-rose-400">{normErrorB}</span>}</div>
            </div>
            <button
              onClick={() => copyToClipboard(normB, 'B')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 shrink-0"
              title="Salin Struct Tag Kanonikal"
            >
              {copiedKey === 'B' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Verdict */}
      <div className="mt-4 p-3.5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ArrowRightLeft className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-300">Hasil Evaluasi Kesamaan Identitas Aset:</span>
        </div>

        {isIdentical ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            TERVERIFIKASI: Aset Identik (Koin Sama)
          </div>
        ) : mismatchResult.isMismatch ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            DILARANG: Aset Berbeda (Native USDC vs Wormhole USDC)
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
            Aset Berbeda (Dua Koin Berlainan Valid untuk Arbitrage Swap Pair)
          </div>
        )}
      </div>
    </div>
  );
};
