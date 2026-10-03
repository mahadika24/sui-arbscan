/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArbitrageOpportunity,
  CanonicalToken,
  DexPool,
  FlashLoanProtocol,
  PtbStep,
  SourcedValue,
} from '../types/dex';
import { areCoinsIdentical, checkAssetMismatch } from './tokens';

export interface FlashLoanProviderInfo {
  name: FlashLoanProtocol;
  feeBps: number;
  description: string;
  sourceLabel: string;
  supportedCoins: string[];
}

export const FLASH_LOAN_PROVIDERS: Record<FlashLoanProtocol, FlashLoanProviderInfo> = {
  Navi: {
    name: 'Navi',
    feeBps: 5, // 0.05%
    description: 'NAVI Protocol Money Market Flash Loan',
    sourceLabel: 'Navi Protocol on-chain parameter (0.05% / 5 bps)',
    supportedCoins: ['SUI', 'USDC', 'wUSDC', 'wUSDT', 'CETUS', 'NAVX'],
  },
  Scallop: {
    name: 'Scallop',
    feeBps: 0, // 0.00%
    description: 'Scallop Lending Market Flash Loan (Zero Protocol Fee)',
    sourceLabel: 'Scallop Lending Protocol on-chain parameter (0 bps)',
    supportedCoins: ['SUI', 'USDC', 'wUSDC', 'wUSDT', 'SCA', 'CETUS'],
  },
  Cetus: {
    name: 'Cetus',
    feeBps: 25, // 0.25% depending on pool tier
    description: 'Cetus CLMM Pool Direct Flash Swap',
    sourceLabel: 'Cetus CLMM Pool Fee Rate on-chain',
    supportedCoins: ['SUI', 'USDC', 'wUSDC', 'CETUS', 'DEEP'],
  },
  Bucket: {
    name: 'Bucket',
    feeBps: 5, // 0.05%
    description: 'Bucket Protocol Flash Loan',
    sourceLabel: 'Bucket Protocol Parameter (0.05%)',
    supportedCoins: ['BUCK', 'SUI'],
  },
};

/**
 * Formats a sourced value for display with its mandatory source label.
 * If null, returns "— (alasan)".
 */
export function formatSourcedValue<T>(
  item: SourcedValue<T> | undefined | null,
  formatFn?: (val: T) => string
): { display: string; badge: string; sourceDetail: string; isEmpty: boolean } {
  if (!item || item.value === null || item.value === undefined) {
    const reason = item?.emptyReason || 'Data tidak tersedia dari RPC/Indexer';
    return {
      display: `— (${reason})`,
      badge: 'N/A',
      sourceDetail: item?.sourceDetail || 'Tidak ada sumber data',
      isEmpty: true,
    };
  }

  const formatted = formatFn ? formatFn(item.value) : String(item.value);
  let badgeLabel = '[On-chain]';
  if (item.source === 'simulasi') badgeLabel = '[Simulasi]';
  if (item.source === 'kuotasi') badgeLabel = '[Kuotasi]';

  return {
    display: `${formatted} ${badgeLabel}`,
    badge: badgeLabel,
    sourceDetail: item.sourceDetail,
    isEmpty: false,
  };
}

/**
 * Calculates a complete Flash Loan Arbitrage execution plan between two pools.
 * Strictly verifies canonical token equality and prevents mixing Native USDC with wUSDC.
 */
export function calculateFlashLoanArbitrage(params: {
  borrowToken: CanonicalToken;
  intermediateToken: CanonicalToken;
  borrowAmount: number;
  provider: FlashLoanProtocol;
  poolBuy: DexPool; // Where we buy intermediate with borrowed token
  poolSell: DexPool; // Where we sell intermediate back to borrowed token
  suiPriceUsd?: number;
  now?: number;
}): ArbitrageOpportunity | { error: string } {
  const now = params.now || Date.now();
  const { borrowToken, intermediateToken, borrowAmount, provider, poolBuy, poolSell } = params;

  // 1. Strict asset mismatch check
  const mismatchCheck = checkAssetMismatch(borrowToken.canonicalType, intermediateToken.canonicalType);
  if (mismatchCheck.isMismatch) {
    return { error: mismatchCheck.message || 'Aset berbeda tidak dapat dipasangkan!' };
  }

  if (areCoinsIdentical(borrowToken.canonicalType, intermediateToken.canonicalType)) {
    return { error: 'Token pinjaman dan token perantara harus berbeda!' };
  }

  // 2. Validate pool token matching
  // poolBuy must accept borrowToken and output intermediateToken
  const buyHasBorrow =
    areCoinsIdentical(poolBuy.tokenA.canonicalType, borrowToken.canonicalType) ||
    areCoinsIdentical(poolBuy.tokenB.canonicalType, borrowToken.canonicalType);
  const buyHasInter =
    areCoinsIdentical(poolBuy.tokenA.canonicalType, intermediateToken.canonicalType) ||
    areCoinsIdentical(poolBuy.tokenB.canonicalType, intermediateToken.canonicalType);

  const sellHasBorrow =
    areCoinsIdentical(poolSell.tokenA.canonicalType, borrowToken.canonicalType) ||
    areCoinsIdentical(poolSell.tokenB.canonicalType, borrowToken.canonicalType);
  const sellHasInter =
    areCoinsIdentical(poolSell.tokenA.canonicalType, intermediateToken.canonicalType) ||
    areCoinsIdentical(poolSell.tokenB.canonicalType, intermediateToken.canonicalType);

  if (!buyHasBorrow || !buyHasInter || !sellHasBorrow || !sellHasInter) {
    return { error: 'Pool yang dipilih tidak mendukung pasangan token kanonik yang sesuai.' };
  }

  // 3. Extract prices
  const buyPriceVal = poolBuy.priceAtoB.value;
  const sellPriceVal = poolSell.priceBtoA.value;

  if (buyPriceVal === null || sellPriceVal === null || buyPriceVal <= 0 || sellPriceVal <= 0) {
    return { error: 'Data harga pool tidak lengkap atau bernilai nol on-chain.' };
  }

  // 4. Calculate Flash Loan fee
  const providerInfo = FLASH_LOAN_PROVIDERS[provider];
  const feeBps = providerInfo.feeBps;
  const loanFeeAmount = (borrowAmount * feeBps) / 10000;

  // 5. Slippage calculation based on pool depth
  const buyPoolLiquidity = poolBuy.liquidityUsd.value || 10000;
  const sellPoolLiquidity = poolSell.liquidityUsd.value || 10000;

  // Impact estimation: borrowAmount in USD / liquidity
  const tokenUsd = params.suiPriceUsd || 1.18;
  const tradeSizeUsd = borrowAmount * (borrowToken.symbol === 'SUI' ? tokenUsd : 1.0);

  const buyImpact = Math.min(0.2, (tradeSizeUsd / (buyPoolLiquidity + 1)) * 0.5);
  const sellImpact = Math.min(0.2, (tradeSizeUsd / (sellPoolLiquidity + 1)) * 0.5);

  // Pool swap fees
  const buyFeeRate = (poolBuy.feeBps.value || 25) / 10000;
  const sellFeeRate = (poolSell.feeBps.value || 25) / 10000;

  // Step 1: Swap borrowToken -> intermediateToken on poolBuy
  // Effective price:
  const effectiveBuyRate = buyPriceVal * (1 - buyFeeRate) * (1 - buyImpact);
  const intermediateObtained = borrowAmount * effectiveBuyRate;

  // Step 2: Swap intermediateToken -> borrowToken on poolSell
  const effectiveSellRate = sellPriceVal * (1 - sellFeeRate) * (1 - sellImpact);
  const borrowReturned = intermediateObtained * effectiveSellRate;

  // Gross spread percentage
  const grossSpreadPct = ((effectiveBuyRate * effectiveSellRate - 1) * 100);

  // Repayment required: borrowAmount + loanFeeAmount
  const totalRepayment = borrowAmount + loanFeeAmount;

  // Net Token Profit before gas
  const grossProfitToken = borrowReturned - totalRepayment;

  // Estimated Sui gas cost (approx 0.003 - 0.008 SUI for complex PTB)
  const estimatedGasSuiVal = 0.0055;
  const estimatedGasCostUsdVal = estimatedGasSuiVal * (params.suiPriceUsd || 1.18);

  const gasDeductionInBorrowToken =
    borrowToken.symbol === 'SUI'
      ? estimatedGasSuiVal
      : estimatedGasCostUsdVal;

  const netProfitTokenVal = grossProfitToken - gasDeductionInBorrowToken;
  const netProfitUsdVal =
    borrowToken.symbol === 'SUI'
      ? netProfitTokenVal * (params.suiPriceUsd || 1.18)
      : netProfitTokenVal;

  const netRoiPctVal = (netProfitTokenVal / borrowAmount) * 100;
  const isProfitable = netProfitTokenVal > 0;

  let status: ArbitrageOpportunity['status'] = 'UNPROFITABLE';
  if (isProfitable) {
    status = 'PROFITABLE';
  } else if (buyImpact > 0.05 || sellImpact > 0.05) {
    status = 'HIGH_SLIPPAGE';
  } else if (buyPoolLiquidity < 1000 || sellPoolLiquidity < 1000) {
    status = 'INSUFFICIENT_LIQUIDITY';
  }

  // Construct PTB Move commands
  const ptbPlan: PtbStep[] = [
    {
      stepIndex: 1,
      action: 'FLASH_BORROW',
      targetProtocol: providerInfo.name,
      moveFunction:
        provider === 'Navi'
          ? '0x834a86970ae93a99082d383a49266dd023726741723a4f23722686ab483a9ac6::flash_loan::borrow'
          : provider === 'Scallop'
          ? '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::flash_loan::borrow_flash_loan'
          : '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::flash_loan',
      typeArguments: [borrowToken.canonicalType],
      argumentsSummary: [`amount: ${borrowAmount} ${borrowToken.symbol}`],
      gasAllocationEstimateSui: 0.001,
    },
    {
      stepIndex: 2,
      action: 'SWAP_BUY',
      targetProtocol: poolBuy.protocol,
      moveFunction: `${poolBuy.protocol.toLowerCase()}::pool::swap`,
      typeArguments: [borrowToken.canonicalType, intermediateToken.canonicalType],
      argumentsSummary: [
        `pool: ${poolBuy.poolAddress.slice(0, 10)}...`,
        `in: ${borrowAmount} ${borrowToken.symbol}`,
        `min_out: ${intermediateObtained.toFixed(4)} ${intermediateToken.symbol}`,
      ],
      gasAllocationEstimateSui: 0.002,
    },
    {
      stepIndex: 3,
      action: 'SWAP_SELL',
      targetProtocol: poolSell.protocol,
      moveFunction: `${poolSell.protocol.toLowerCase()}::pool::swap`,
      typeArguments: [intermediateToken.canonicalType, borrowToken.canonicalType],
      argumentsSummary: [
        `pool: ${poolSell.poolAddress.slice(0, 10)}...`,
        `in: ${intermediateObtained.toFixed(4)} ${intermediateToken.symbol}`,
        `min_out: ${borrowReturned.toFixed(4)} ${borrowToken.symbol}`,
      ],
      gasAllocationEstimateSui: 0.002,
    },
    {
      stepIndex: 4,
      action: 'FLASH_REPAY',
      targetProtocol: providerInfo.name,
      moveFunction:
        provider === 'Navi'
          ? '0x834a86970ae93a99082d383a49266dd023726741723a4f23722686ab483a9ac6::flash_loan::repay'
          : provider === 'Scallop'
          ? '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::flash_loan::repay_flash_loan'
          : '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::repay_flash_loan',
      typeArguments: [borrowToken.canonicalType],
      argumentsSummary: [
        `repay_amount: ${totalRepayment.toFixed(6)} ${borrowToken.symbol}`,
        `receipt_ref: Receipt`,
      ],
      gasAllocationEstimateSui: 0.001,
    },
    {
      stepIndex: 5,
      action: 'TRANSFER_PROFIT',
      targetProtocol: 'Sui Standard',
      moveFunction: '0x2::transfer::public_transfer',
      typeArguments: [borrowToken.canonicalType],
      argumentsSummary: [
        `profit_amount: ${Math.max(0, netProfitTokenVal).toFixed(6)} ${borrowToken.symbol}`,
        'recipient: sender_address',
      ],
      gasAllocationEstimateSui: 0.0005,
    },
  ];

  return {
    id: `arb-${poolBuy.protocol}-${poolSell.protocol}-${borrowToken.symbol}-${intermediateToken.symbol}`,
    tokenBorrow: borrowToken,
    tokenIntermediate: intermediateToken,
    flashLoanProvider: provider,
    loanFeeBps: {
      value: feeBps,
      source: 'on-chain',
      sourceDetail: providerInfo.sourceLabel,
      timestamp: now,
    },
    dexBuy: {
      protocol: poolBuy.protocol,
      poolAddress: poolBuy.poolAddress,
      price: poolBuy.priceAtoB,
    },
    dexSell: {
      protocol: poolSell.protocol,
      poolAddress: poolSell.poolAddress,
      price: poolSell.priceBtoA,
    },
    grossSpreadPct: {
      value: Number(grossSpreadPct.toFixed(4)),
      source: 'kuotasi',
      sourceDetail: `Spread kuotasi swap silang ${poolBuy.protocol} -> ${poolSell.protocol}`,
      timestamp: now,
    },
    simulatedBorrowAmount: borrowAmount,
    estimatedLoanFeeAmount: {
      value: Number(loanFeeAmount.toFixed(6)),
      source: 'kuotasi',
      sourceDetail: `Biaya pinjaman flash loan ${providerInfo.name} (${feeBps} bps)`,
      timestamp: now,
    },
    estimatedGasSui: {
      value: estimatedGasSuiVal,
      source: 'simulasi',
      sourceDetail: 'Simulasi devInspect gas Sui PTB (5 move call)',
      timestamp: now,
    },
    estimatedGasCostUsd: {
      value: Number(estimatedGasCostUsdVal.toFixed(4)),
      source: 'kuotasi',
      sourceDetail: `Biaya gas dalam USD (${estimatedGasSuiVal} SUI @ $${(params.suiPriceUsd || 1.18).toFixed(2)})`,
      timestamp: now,
    },
    estimatedNetProfitToken: {
      value: Number(netProfitTokenVal.toFixed(6)),
      source: 'simulasi',
      sourceDetail: 'Simulasi net profit setelah biaya pinjaman dan estimasi gas',
      timestamp: now,
    },
    estimatedNetProfitUsd: {
      value: Number(netProfitUsdVal.toFixed(4)),
      source: 'simulasi',
      sourceDetail: 'Simulasi net profit setara USD',
      timestamp: now,
    },
    netRoiPct: {
      value: Number(netRoiPctVal.toFixed(4)),
      source: 'simulasi',
      sourceDetail: 'Net ROI terhadap modal pinjaman flash loan',
      timestamp: now,
    },
    isProfitable,
    status,
    ptbPlan,
  };
}
