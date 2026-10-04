import { describe, it, expect } from 'vitest';
import { calculateRealArbitrageQuote, calculateSingleSwapOutput } from '../services/realQuoteService';
import { buildArbitragePtbPlan } from '../services/ptbBuilder';
import { CANONICAL_TOKENS } from '../services/tokens';
import { DexPool } from '../types/dex';

describe('Phase B & C — Real Quote On-Chain & PTB DevInspect Builder', () => {
  const mockBuyPool: DexPool = {
    id: 'pool-momentum-sui-usdc',
    protocol: 'MOMENTUM',
    poolAddress: '0x455cf8d2ac91e7cb883f515874af750ed3cd18195c970b7a2d46235ac2b0c388',
    packageId: '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860',
    swapModule: 'trade',
    swapFunctionAtoB: '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::trade::flash_swap',
    swapFunctionBtoA: '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::trade::flash_swap',
    status: 'EXECUTABLE',
    discoverySource: 'dexscreener',
    verificationProof: null,
    tokenA: CANONICAL_TOKENS.SUI,
    tokenB: CANONICAL_TOKENS.USDC,
    priceAtoB: {
      value: 1.18,
      source: 'kuotasi',
      sourceDetail: 'Momentum price SUI->USDC',
      timestamp: Date.now(),
    },
    priceBtoA: {
      value: 0.8474,
      source: 'kuotasi',
      sourceDetail: 'Momentum inverse price',
      timestamp: Date.now(),
    },
    reserveA: { value: 692000, source: 'on-chain', sourceDetail: 'reserve_x', timestamp: Date.now() },
    reserveB: { value: 1136000, source: 'on-chain', sourceDetail: 'reserve_y', timestamp: Date.now() },
    feeBps: { value: 17, source: 'on-chain', sourceDetail: 'fee_rate 17.5 bps', timestamp: Date.now() },
    liquidityUsd: { value: 1950000, source: 'eksternal', sourceDetail: 'TVL', timestamp: Date.now() },
    lastUpdated: Date.now(),
  };

  const mockSellPool: DexPool = {
    id: 'pool-turbos-sui-usdc',
    protocol: 'TURBOS',
    poolAddress: '0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb9b5f7505ca78',
    packageId: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1',
    swapModule: 'swap_router',
    swapFunctionAtoB: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::swap_router::swap_a_b',
    swapFunctionBtoA: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::swap_router::swap_b_a',
    status: 'EXECUTABLE',
    discoverySource: 'dexscreener',
    verificationProof: null,
    tokenA: CANONICAL_TOKENS.SUI,
    tokenB: CANONICAL_TOKENS.USDC,
    priceAtoB: {
      value: 1.15,
      source: 'kuotasi',
      sourceDetail: 'Turbos price SUI->USDC',
      timestamp: Date.now(),
    },
    priceBtoA: {
      value: 0.8695, // sell USDC at higher SUI rate -> profit
      source: 'kuotasi',
      sourceDetail: 'Turbos inverse price',
      timestamp: Date.now(),
    },
    reserveA: { value: 500000, source: 'on-chain', sourceDetail: 'reserve_x', timestamp: Date.now() },
    reserveB: { value: 575000, source: 'on-chain', sourceDetail: 'reserve_y', timestamp: Date.now() },
    feeBps: { value: 30, source: 'on-chain', sourceDetail: 'fee 3000 (30 bps)', timestamp: Date.now() },
    liquidityUsd: { value: 1100000, source: 'eksternal', sourceDetail: 'TVL', timestamp: Date.now() },
    lastUpdated: Date.now(),
  };

  it('calculates single swap outputs with fee and slippage deductions', () => {
    const out = calculateSingleSwapOutput({
      amountIn: 1000,
      pool: mockBuyPool,
      direction: 'AtoB',
      slippageToleranceBps: 10,
    });
    // 1000 * (1 - 0.0017) * 1.18 = ~1177.994 - slippage = ~1176.81
    expect(out).toBeGreaterThan(1170);
    expect(out).toBeLessThan(1180);
  });

  it('calculates real arbitrage quotes with flash loan fees and net profitability', () => {
    const quote = calculateRealArbitrageQuote({
      buyPool: mockBuyPool,
      sellPool: mockSellPool,
      borrowAmount: 1000,
      provider: 'Navi',
      suiPriceUsd: 1.18,
      estimatedNetGasUsd: 0.005,
    });

    expect(quote.borrowAmount).toBe(1000);
    expect(quote.loanFeeAmount).toBe(0.5); // 5 bps of 1000 = 0.5 SUI
    expect(quote.expectedSwap1Out).toBeGreaterThan(0);
    expect(quote.expectedSwap2Out).toBeGreaterThan(0);
    expect(typeof quote.isProfitable).toBe('boolean');
  });

  it('builds 5-step Move PTB plan with non-generic commands and TransactionKind base64', async () => {
    const plan = await buildArbitragePtbPlan({
      buyPool: mockBuyPool,
      sellPool: mockSellPool,
      borrowAmount: 2000,
      provider: 'Navi',
      senderAddress: '0x0000000000000000000000000000000000000000000000000000000000000001',
    });

    expect(plan.commands).toHaveLength(6);
    expect(plan.commands[0].type).toBe('MoveCall');
    expect(plan.commands[1].target).toContain('::trade::flash_swap');
    expect(plan.commands[2].target).toContain('::swap_router::swap_b_a');
    expect(plan.rawTransactionKindBase64).toBeTruthy();
    expect(plan.borrowAmount).toBe(2000);
  });
});
