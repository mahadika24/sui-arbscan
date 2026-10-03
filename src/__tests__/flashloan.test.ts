import { describe, it, expect } from 'vitest';
import {
  calculateFlashLoanArbitrage,
  formatSourcedValue,
  FLASH_LOAN_PROVIDERS,
} from '../services/flashLoanEngine';
import { CANONICAL_TOKENS } from '../services/tokens';
import { DexPool, SourcedValue } from '../types/dex';

describe('Flash Loan Calculation & Zero-Fake-Data Enforcement', () => {
  const dummyPoolA: DexPool = {
    id: 'pool-cetus-sui-usdc',
    protocol: 'Cetus',
    poolAddress: '0x455cf8d2ac91e7cb883f515874af750ed3cd18195c970b7a2d46235ac2b0c388',
    tokenA: CANONICAL_TOKENS.SUI,
    tokenB: CANONICAL_TOKENS.USDC,
    priceAtoB: {
      value: 1.25,
      source: 'on-chain',
      sourceDetail: 'Cetus Pool on-chain sqrt_price',
      timestamp: Date.now(),
    },
    priceBtoA: {
      value: 0.8,
      source: 'on-chain',
      sourceDetail: 'Cetus Pool on-chain sqrt_price invert',
      timestamp: Date.now(),
    },
    reserveA: {
      value: 500000,
      source: 'on-chain',
      sourceDetail: 'Object reserve',
      timestamp: Date.now(),
    },
    reserveB: {
      value: 625000,
      source: 'on-chain',
      sourceDetail: 'Object reserve',
      timestamp: Date.now(),
    },
    feeBps: {
      value: 25,
      source: 'on-chain',
      sourceDetail: 'Pool fee_rate 2500 (25 bps)',
      timestamp: Date.now(),
    },
    liquidityUsd: {
      value: 1250000,
      source: 'on-chain',
      sourceDetail: 'Pool liquidity',
      timestamp: Date.now(),
    },
    lastUpdated: Date.now(),
  };

  const dummyPoolB: DexPool = {
    id: 'pool-turbos-sui-usdc',
    protocol: 'Turbos',
    poolAddress: '0xae12e94ad7dac17e923982b81e16ab97ad0436de37522b61fe66930968ad966b',
    tokenA: CANONICAL_TOKENS.SUI,
    tokenB: CANONICAL_TOKENS.USDC,
    priceAtoB: {
      value: 1.15,
      source: 'on-chain',
      sourceDetail: 'Turbos Pool on-chain sqrt_price',
      timestamp: Date.now(),
    },
    priceBtoA: {
      value: 0.8695,
      source: 'on-chain',
      sourceDetail: 'Turbos Pool on-chain sqrt_price invert',
      timestamp: Date.now(),
    },
    reserveA: {
      value: 400000,
      source: 'on-chain',
      sourceDetail: 'Object reserve',
      timestamp: Date.now(),
    },
    reserveB: {
      value: 460000,
      source: 'on-chain',
      sourceDetail: 'Object reserve',
      timestamp: Date.now(),
    },
    feeBps: {
      value: 30,
      source: 'on-chain',
      sourceDetail: 'Pool fee 3000 (30 bps)',
      timestamp: Date.now(),
    },
    liquidityUsd: {
      value: 920000,
      source: 'on-chain',
      sourceDetail: 'Pool liquidity',
      timestamp: Date.now(),
    },
    lastUpdated: Date.now(),
  };

  it('rejects cross-arbitrage between Native USDC and Wormhole wUSDC', () => {
    const result = calculateFlashLoanArbitrage({
      borrowToken: CANONICAL_TOKENS.USDC, // Native Circle
      intermediateToken: CANONICAL_TOKENS.wUSDC, // Wormhole Bridged
      borrowAmount: 1000,
      provider: 'Navi',
      poolBuy: dummyPoolA,
      poolSell: dummyPoolB,
    });

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Aset berbeda!');
    }
  });

  it('calculates flash loan fees and net profit with exact source attribution', () => {
    const result = calculateFlashLoanArbitrage({
      borrowToken: CANONICAL_TOKENS.SUI,
      intermediateToken: CANONICAL_TOKENS.USDC,
      borrowAmount: 1000,
      provider: 'Navi',
      poolBuy: dummyPoolA,
      poolSell: dummyPoolB,
      suiPriceUsd: 1.18,
    });

    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.flashLoanProvider).toBe('Navi');
      expect(result.loanFeeBps.value).toBe(5);
      expect(result.loanFeeBps.source).toBe('on-chain');
      expect(result.estimatedGasSui.source).toBe('simulasi');
      expect(result.estimatedNetProfitToken.source).toBe('simulasi');
      expect(result.ptbPlan.length).toBe(5);
    }
  });

  it('formats empty values with "—" and explicit failure reasons, preventing fake numbers', () => {
    const emptyItem: SourcedValue<number> = {
      value: null,
      source: 'on-chain',
      sourceDetail: 'Sui RPC endpoint',
      timestamp: Date.now(),
      emptyReason: 'Pool tidak memiliki likuiditas',
    };

    const formatted = formatSourcedValue(emptyItem);
    expect(formatted.isEmpty).toBe(true);
    expect(formatted.display).toBe('— (Pool tidak memiliki likuiditas)');

    const validItem: SourcedValue<number> = {
      value: 42.5,
      source: 'on-chain',
      sourceDetail: 'Sui RPC Checkpoint #329783862',
      timestamp: Date.now(),
    };

    const validFormatted = formatSourcedValue(validItem, (v) => `${v.toFixed(2)} SUI`);
    expect(validFormatted.isEmpty).toBe(false);
    expect(validFormatted.display).toBe('42.50 SUI [On-chain]');
    expect(validFormatted.badge).toBe('[On-chain]');
  });

  it('verifies flash loan fee rates for all supported protocols', () => {
    expect(FLASH_LOAN_PROVIDERS.Navi.feeBps).toBe(5);
    expect(FLASH_LOAN_PROVIDERS.Scallop.feeBps).toBe(0);
    expect(FLASH_LOAN_PROVIDERS.Cetus.feeBps).toBe(25);
    expect(FLASH_LOAN_PROVIDERS.Bucket.feeBps).toBe(5);
  });
});
