/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GasFeeBreakdown, NetworkCongestionData, PriorityTier } from '../types/dex';

export function calculatePtbGasEstimate(params: {
  congestion?: NetworkCongestionData;
  suiPriceUsd?: number;
  priorityTier?: PriorityTier;
  stepCount?: number;
  baseComputationUnits?: number;
}): GasFeeBreakdown {
  const {
    congestion,
    suiPriceUsd = 1.18,
    priorityTier = 'standard',
    baseComputationUnits = 1_250_000,
  } = params;

  const now = Date.now();
  const refGasPrice = congestion?.referenceGasPriceMist?.value ?? 100;
  const networkLevel = congestion?.congestionLevel?.value ?? 'NORMAL';

  // Congestion tier base multipliers
  const tierMultiplierMap: Record<PriorityTier, number> = {
    standard: 1.0,
    fast: networkLevel === 'HIGH' ? 1.35 : 1.15,
    turbo: networkLevel === 'HIGH' ? 1.70 : 1.30,
  };

  const priorityMultiplier = tierMultiplierMap[priorityTier];
  const effectiveGasPriceMist = Math.round(refGasPrice * priorityMultiplier);

  // Sui PTB standard unit estimates for flash loan
  const compUnits = baseComputationUnits;
  const storageUnitsMist = 2_980_000;
  const storageRebateMist = 2_850_000;

  // Computation cost in MIST
  const baseCompCostMist = compUnits * refGasPrice;
  const priorityCompCostMist = compUnits * (effectiveGasPriceMist - refGasPrice);

  // Net gas in MIST
  const netStorageCostMist = Math.max(0, storageUnitsMist - storageRebateMist);
  const baseGasCostMist = baseCompCostMist + netStorageCostMist;
  const totalNetGasCostMist = baseGasCostMist + priorityCompCostMist;

  const baseGasSui = baseGasCostMist / 1_000_000_000;
  const priorityGasSui = priorityCompCostMist / 1_000_000_000;
  const totalNetGasSui = totalNetGasCostMist / 1_000_000_000;
  const totalNetGasUsd = totalNetGasSui * suiPriceUsd;

  // Recommended Gas Budget in SUI (must comfortably cover execution without out-of-gas abort)
  const recommendedGasBudgetSui = 0.015;

  return {
    computationUnits: {
      value: compUnits,
      source: 'simulasi',
      sourceDetail: `Estimasi unit komputasi PTB 5 instruksi Move (${compUnits.toLocaleString()} units)`,
      timestamp: now,
    },
    storageUnits: {
      value: storageUnitsMist,
      source: 'simulasi',
      sourceDetail: `Alokasi penyimpanan objek sementara PTB (${storageUnitsMist.toLocaleString()} MIST)`,
      timestamp: now,
    },
    storageRebate: {
      value: storageRebateMist,
      source: 'simulasi',
      sourceDetail: `Rebate pengembalian penyimpanan setelah loan receipt dihapus (${storageRebateMist.toLocaleString()} MIST)`,
      timestamp: now,
    },
    gasPriceMist: {
      value: effectiveGasPriceMist,
      source: 'kuotasi',
      sourceDetail: `Harga gas efektif: ${refGasPrice} MIST * ${priorityMultiplier.toFixed(2)}x (Tingkat: ${priorityTier})`,
      timestamp: now,
    },
    baseGasSui: {
      value: parseFloat(baseGasSui.toFixed(6)),
      source: 'simulasi',
      sourceDetail: `Biaya gas dasar (Komputasi dasar + Net storage): ${baseGasSui.toFixed(6)} SUI`,
      timestamp: now,
    },
    priorityGasSui: {
      value: parseFloat(priorityGasSui.toFixed(6)),
      source: 'kuotasi',
      sourceDetail: `Tip prioritas validator untuk mode ${priorityTier}: ${priorityGasSui.toFixed(6)} SUI`,
      timestamp: now,
    },
    totalNetGasSui: {
      value: parseFloat(totalNetGasSui.toFixed(6)),
      source: 'simulasi',
      sourceDetail: `Total biaya gas bersih jaringan Sui: ${totalNetGasSui.toFixed(6)} SUI`,
      timestamp: now,
    },
    totalNetGasUsd: {
      value: parseFloat(totalNetGasUsd.toFixed(4)),
      source: 'simulasi',
      sourceDetail: `Setara nilai USD (@ $${suiPriceUsd} / SUI)`,
      timestamp: now,
    },
    recommendedGasBudgetSui: {
      value: recommendedGasBudgetSui,
      source: 'simulasi',
      sourceDetail: `Rekomendasi batas gas budget aman: ${recommendedGasBudgetSui} SUI (15,000,000 MIST)`,
      timestamp: now,
    },
  };
}
