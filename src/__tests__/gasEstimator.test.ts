import { describe, it, expect } from 'vitest';
import { calculatePtbGasEstimate } from '../services/gasEstimator';
import { NetworkCongestionData } from '../types/dex';

describe('Gas Fee Estimator & Network Congestion Logic', () => {
  it('correctly calculates baseline PTB gas fee under normal congestion', () => {
    const mockCongestion: NetworkCongestionData = {
      congestionLevel: {
        value: 'NORMAL',
        source: 'on-chain',
        sourceDetail: '25 tx/checkpoint',
        timestamp: Date.now(),
      },
      referenceGasPriceMist: {
        value: 100,
        source: 'on-chain',
        sourceDetail: '100 MIST',
        timestamp: Date.now(),
      },
      checkpointTxCount: {
        value: 25,
        source: 'on-chain',
        sourceDetail: '25 tx',
        timestamp: Date.now(),
      },
      estimatedTps: {
        value: 25,
        source: 'on-chain',
        sourceDetail: '25 TPS',
        timestamp: Date.now(),
      },
      recommendedPriorityMultiplier: {
        value: 1.05,
        source: 'kuotasi',
        sourceDetail: 'Multiplier',
        timestamp: Date.now(),
      },
    };

    const estimate = calculatePtbGasEstimate({
      congestion: mockCongestion,
      suiPriceUsd: 1.20,
      priorityTier: 'standard',
    });

    // Verification of calculation units and sources
    expect(estimate.computationUnits.value).toBe(1_250_000);
    expect(estimate.computationUnits.source).toBe('simulasi');
    expect(estimate.storageUnits.value).toBe(2_980_000);
    expect(estimate.storageRebate.value).toBe(2_850_000);
    expect(estimate.gasPriceMist.value).toBe(100);
    expect(estimate.gasPriceMist.source).toBe('kuotasi');

    // Total net gas fee in SUI: (1250000 * 100 + 130000) / 1e9 = 0.000255 SUI
    expect(estimate.totalNetGasSui.value).toBeGreaterThan(0);
    expect(estimate.totalNetGasUsd.value).toBeGreaterThan(0);
    expect(estimate.recommendedGasBudgetSui.value).toBe(0.015);
  });

  it('correctly adjusts priority tip multiplier for turbo MEV mode', () => {
    const mockCongestion: NetworkCongestionData = {
      congestionLevel: {
        value: 'HIGH',
        source: 'on-chain',
        sourceDetail: 'Padat 220 tx/checkpoint',
        timestamp: Date.now(),
      },
      referenceGasPriceMist: {
        value: 110,
        source: 'on-chain',
        sourceDetail: '110 MIST',
        timestamp: Date.now(),
      },
      checkpointTxCount: {
        value: 220,
        source: 'on-chain',
        sourceDetail: '220 tx',
        timestamp: Date.now(),
      },
      estimatedTps: {
        value: 220,
        source: 'on-chain',
        sourceDetail: '220 TPS',
        timestamp: Date.now(),
      },
      recommendedPriorityMultiplier: {
        value: 1.30,
        source: 'kuotasi',
        sourceDetail: 'High congestion multiplier',
        timestamp: Date.now(),
      },
    };

    const turboEstimate = calculatePtbGasEstimate({
      congestion: mockCongestion,
      suiPriceUsd: 1.20,
      priorityTier: 'turbo',
    });

    // Effective gas price under HIGH congestion + turbo should be 110 * 1.70 = 187 MIST
    expect(turboEstimate.gasPriceMist.value).toBe(187);
    expect(turboEstimate.priorityGasSui.value).toBeGreaterThan(0);
    expect(turboEstimate.totalNetGasSui.value).toBeGreaterThan(0.0001);
  });

  it('gracefully provides reliable estimates when congestion data is empty', () => {
    const fallbackEstimate = calculatePtbGasEstimate({
      congestion: undefined,
      suiPriceUsd: 1.0,
      priorityTier: 'standard',
    });

    expect(fallbackEstimate.gasPriceMist.value).toBe(100);
    expect(fallbackEstimate.totalNetGasSui.value).toBeGreaterThan(0);
    expect(fallbackEstimate.recommendedGasBudgetSui.value).toBe(0.015);
  });
});
