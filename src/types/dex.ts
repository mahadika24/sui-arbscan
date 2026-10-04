/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DataSourceType = 'on-chain' | 'simulasi' | 'kuotasi' | 'eksternal';

export interface SourcedValue<T = number | string> {
  value: T | null;
  source: DataSourceType;
  sourceDetail: string;
  timestamp: number;
  emptyReason?: string;
}

export interface CanonicalToken {
  symbol: string;
  name: string;
  canonicalType: string; // strictly normalized via normalizeStructTag
  decimals: number;
  iconUrl?: string;
  isStablecoin?: boolean;
  notes?: string;
}

export type DexProtocol =
  | 'Cetus'
  | 'Turbos'
  | 'DeepBook'
  | 'DeepBook_V3'
  | 'Kriya'
  | 'Aftermath'
  | 'FlowX'
  | 'Momentum'
  | 'Steamm'
  | 'Magma'
  | string;

export type FlashLoanProtocol = 'Navi' | 'Scallop' | 'Cetus' | 'Bucket';

export type PoolStatus = 'DISCOVERED' | 'VERIFIED' | 'QUOTEABLE' | 'EXECUTABLE';

export interface PoolVerificationProof {
  verifiedAt: number;
  objectExists: boolean;
  version: string;
  digest: string;
  onChainType: string;
  ownerType: 'Shared' | 'Address' | 'Immutable';
  initialSharedVersion?: number | string;
  packageId: string;
  moduleName: string;
  verifiedTokenA: string;
  verifiedTokenB: string;
  verifiedReserveA: number | null;
  verifiedReserveB: number | null;
  verifiedFeeBps: number | null;
  rawRpcOutputSnippet: string;
}

export interface DexPool {
  id: string;
  protocol: DexProtocol;
  poolAddress: string;
  packageId: string;
  swapModule: string;
  swapFunctionAtoB: string; // real exact function e.g. 0x91bf...::swap_router::swap_a_b
  swapFunctionBtoA: string; // real exact function e.g. 0x91bf...::swap_router::swap_b_a
  status: PoolStatus;
  tokenA: CanonicalToken;
  tokenB: CanonicalToken;
  priceAtoB: SourcedValue<number>;
  priceBtoA: SourcedValue<number>;
  reserveA: SourcedValue<number>;
  reserveB: SourcedValue<number>;
  feeBps: SourcedValue<number>;
  liquidityUsd: SourcedValue<number>;
  discoverySource: 'on-chain' | 'dexscreener' | 'cetus-clmm' | 'turbos-clmm' | 'deepbook-v2';
  verificationProof: PoolVerificationProof | null;
  lastUpdated: number;
}

export interface ArbitrageOpportunity {
  id: string;
  tokenBorrow: CanonicalToken;
  tokenIntermediate: CanonicalToken;
  flashLoanProvider: FlashLoanProtocol;
  loanFeeBps: SourcedValue<number>;
  dexBuy: {
    protocol: DexProtocol;
    poolAddress: string;
    price: SourcedValue<number>;
  };
  dexSell: {
    protocol: DexProtocol;
    poolAddress: string;
    price: SourcedValue<number>;
  };
  grossSpreadPct: SourcedValue<number>;
  simulatedBorrowAmount: number;
  estimatedLoanFeeAmount: SourcedValue<number>;
  estimatedGasSui: SourcedValue<number>;
  estimatedGasCostUsd: SourcedValue<number>;
  estimatedNetProfitToken: SourcedValue<number>;
  estimatedNetProfitUsd: SourcedValue<number>;
  netRoiPct: SourcedValue<number>;
  isProfitable: boolean;
  status: 'PROFITABLE' | 'UNPROFITABLE' | 'HIGH_SLIPPAGE' | 'INSUFFICIENT_LIQUIDITY';
  ptbPlan: PtbStep[];
}

export interface PtbStep {
  stepIndex: number;
  action: 'FLASH_BORROW' | 'SWAP_BUY' | 'SWAP_SELL' | 'FLASH_REPAY' | 'TRANSFER_PROFIT';
  targetProtocol: string;
  moveFunction: string;
  typeArguments: string[];
  argumentsSummary: string[];
  gasAllocationEstimateSui: number;
}

export interface SimulationResult {
  success: boolean;
  statusLabel: string;
  borrowAmount: number;
  returnAmount: number | null;
  feeAmount: number | null;
  netProfit: number | null;
  gasUsedComputation: SourcedValue<number>;
  gasUsedStorage: SourcedValue<number>;
  storageRebate: SourcedValue<number>;
  netGasCostSui: SourcedValue<number>;
  executionDurationMs: number;
  simulatedTimestamp: number;
  logs: string[];
  rawError?: string;
  abortCode?: string;
  suiRpcEndpoint: string;
}

export interface SuiRpcEndpointStatus {
  name: string;
  url: string;
  latencyMs: number | null;
  checkpointNumber: number | null;
  status: 'online' | 'degraded' | 'offline';
  isCurrentPrimary: boolean;
}

export type CongestionLevel = 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH';
export type PriorityTier = 'standard' | 'fast' | 'turbo';

export interface NetworkCongestionData {
  congestionLevel: SourcedValue<CongestionLevel>;
  referenceGasPriceMist: SourcedValue<number>;
  checkpointTxCount: SourcedValue<number>;
  estimatedTps: SourcedValue<number>;
  recommendedPriorityMultiplier: SourcedValue<number>;
}

export interface GasFeeBreakdown {
  computationUnits: SourcedValue<number>;
  storageUnits: SourcedValue<number>;
  storageRebate: SourcedValue<number>;
  gasPriceMist: SourcedValue<number>;
  baseGasSui: SourcedValue<number>;
  priorityGasSui: SourcedValue<number>;
  totalNetGasSui: SourcedValue<number>;
  totalNetGasUsd: SourcedValue<number>;
  recommendedGasBudgetSui: SourcedValue<number>;
}

export interface RealQuoteResult {
  borrowAmount: number;
  expectedSwap1Out: number;
  expectedSwap2Out: number;
  loanFeeAmount: number;
  grossProfitToken: number;
  grossProfitUsd: number;
  estimatedNetProfitUsd: number;
  isProfitable: boolean;
  quotedTimestamp: number;
}

export interface DevInspectBalanceChange {
  coinType: string;
  coinSymbol: string;
  amountDelta: number;
  amountDeltaRaw: string;
  isPositive: boolean;
}

export interface DevInspectResult {
  status: 'success' | 'failure';
  executedEpoch: number;
  executionDurationMs: number;
  gasUsed: {
    computationCost: number;
    storageCost: number;
    storageRebate: number;
    netGasMist: number;
    netGasSui: number;
    netGasUsd: number;
  };
  rawStatus: string;
  abortCode?: string;
  balanceChanges: DevInspectBalanceChange[];
  netBalanceDeltaToken: number;
  netProfitUsd: number;
  safeToExecute: boolean;
  rejectionReason?: string;
  simulatedAt: number;
  ptbCommandCount: number;
}

export interface BotRunnerConfig {
  isRunning: boolean;
  minProfitThresholdUsd: number;
  maxGasBudgetSui: number;
  pollIntervalSeconds: number;
  targetProvider: FlashLoanProtocol;
  zeroKeyIsolated: boolean;
}

export interface SuiChainStatus {
  connected: boolean;
  chainIdentifier: SourcedValue<string>;
  checkpointNumber: SourcedValue<number>;
  checkpointTimestampMs: SourcedValue<number>;
  checkpointAgeSeconds: SourcedValue<number>;
  syncStatus: SourcedValue<'SINKRON' | 'TERLAMBAT' | 'DESYNC'>;
  epoch: SourcedValue<number>;
  protocolVersion: SourcedValue<number>;
  referenceGasPriceMist: SourcedValue<number>;
  rpcLatencyMs: SourcedValue<number>;
  rpcUrl: string;
  lastChecked: number;
  endpoints: SuiRpcEndpointStatus[];
  congestion?: NetworkCongestionData;
}
