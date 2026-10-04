/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DexPool, FlashLoanProtocol, RealQuoteResult } from '../types/dex';
import { FLASH_LOAN_PROVIDERS } from './flashLoanEngine';

/**
 * Calculates a realistic swap output based on pool prices and trading fees.
 */
export function calculateSingleSwapOutput(params: {
  amountIn: number;
  pool: DexPool;
  direction: 'AtoB' | 'BtoA';
  slippageToleranceBps?: number;
}): number {
  const { amountIn, pool, direction, slippageToleranceBps = 10 } = params;

  const feeRate = (pool.feeBps.value ?? 25) / 10000;
  const effectiveIn = amountIn * (1 - feeRate);

  const price = direction === 'AtoB' ? (pool.priceAtoB.value ?? 1) : (pool.priceBtoA.value ?? 1);
  const rawOut = effectiveIn * price;

  const slippageDeduction = rawOut * (slippageToleranceBps / 10000);
  return Math.max(0, rawOut - slippageDeduction);
}

/**
 * Calculates a Real Quote across two verified pools with flash loan fees and gas deductions.
 */
export function calculateRealArbitrageQuote(params: {
  buyPool: DexPool;
  sellPool: DexPool;
  borrowAmount: number;
  provider: FlashLoanProtocol;
  suiPriceUsd?: number;
  estimatedNetGasUsd?: number;
}): RealQuoteResult {
  const {
    buyPool,
    sellPool,
    borrowAmount,
    provider,
    suiPriceUsd = 1.18,
    estimatedNetGasUsd = 0.005,
  } = params;

  // Step 1: Swap borrowed token (A) for intermediate token (B) on Buy Pool
  const swap1Out = calculateSingleSwapOutput({
    amountIn: borrowAmount,
    pool: buyPool,
    direction: 'AtoB',
  });

  // Step 2: Swap intermediate token (B) back to borrowed token (A) on Sell Pool
  const swap2Out = calculateSingleSwapOutput({
    amountIn: swap1Out,
    pool: sellPool,
    direction: 'BtoA',
  });

  // Flash loan fee calculation
  const providerInfo = FLASH_LOAN_PROVIDERS[provider];
  const loanFeeAmount = borrowAmount * (providerInfo.feeBps / 10000);
  const totalRepayRequired = borrowAmount + loanFeeAmount;

  const grossProfitToken = swap2Out - totalRepayRequired;
  const tokenBorrowSymbol = buyPool.tokenA.symbol;
  const priceUsd = tokenBorrowSymbol === 'SUI' ? suiPriceUsd : 1.0;
  const grossProfitUsd = grossProfitToken * priceUsd;
  const estimatedNetProfitUsd = grossProfitUsd - estimatedNetGasUsd;

  return {
    borrowAmount,
    expectedSwap1Out: parseFloat(swap1Out.toFixed(4)),
    expectedSwap2Out: parseFloat(swap2Out.toFixed(4)),
    loanFeeAmount: parseFloat(loanFeeAmount.toFixed(4)),
    grossProfitToken: parseFloat(grossProfitToken.toFixed(4)),
    grossProfitUsd: parseFloat(grossProfitUsd.toFixed(4)),
    estimatedNetProfitUsd: parseFloat(estimatedNetProfitUsd.toFixed(4)),
    isProfitable: estimatedNetProfitUsd > 0,
    quotedTimestamp: Date.now(),
  };
}
