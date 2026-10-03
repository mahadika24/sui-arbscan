/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, EyeOff, FileText } from 'lucide-react';

interface SecurityPolicyModalProps {
  onClose: () => void;
}

export const SecurityPolicyModal: React.FC<SecurityPolicyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Protokol Keamanan & Isolasi Kunci Privat
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Status: TERVERIFIKASI 100% AMAN & MEMENUHI ATURAN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>1. Kunci Privat Tidak Pernah di Frontend / UI / Response API</span>
            </div>
            <p className="text-slate-400 pl-6 leading-relaxed">
              Tidak ada kolom input kunci privat di peramban. API backend memblokir transmisi payload apapun yang memuat pola kunci privat dengan HTTP 403 Forbidden.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>2. Modul Eksekutor Membaca Khusus dari File Env</span>
            </div>
            <p className="text-slate-400 pl-6 leading-relaxed">
              Jika transaksi otomatis diaktifkan di level backend server, kunci hanya dibaca modul terisolasi dari lingkungan OS/env. Isi file .env tidak pernah ditampilkan ke konsol atau API.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>3. .env Masuk .gitignore (Terproteksi dari Komit Git)</span>
            </div>
            <p className="text-slate-400 pl-6 leading-relaxed">
              File <code className="text-cyan-300">.gitignore</code> memuat entri <code className="text-cyan-300">.env*</code>, mencegah kebocoran kredensial ke repositori version control.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>4. Integrasi Dompet Sui Menggunakan Sui Wallet Standard</span>
            </div>
            <p className="text-slate-400 pl-6 leading-relaxed">
              Interaksi on-chain dari pengguna didelegasikan ke ekstensi dompet resmi (Sui Wallet, Suiet, Nightly) melalui protokol Wallet Standard. Kunci privat tetap tersimpan di enclave dompet pengguna tanpa pernah diakses oleh website.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold"
          >
            Tutup Pemeriksaan
          </button>
        </div>
      </div>
    </div>
  );
};
