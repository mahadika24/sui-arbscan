/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DataSourceType = 'on-chain' | 'simulasi' | 'kuotasi';

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

export type DexProtocol = 'Cetus' | 'Turbos' | 'DeepBook_V3' | 'Kriya' | 'Aftermath' | 'FlowX';

export type FlashLoanProtocol = 'Navi' | 'Scallop' | 'Cetus' | 'Bucket';

export interface DexPool {
  id: string;
  protocol: DexProtocol;
  poolAddress: string;
  tokenA: CanonicalToken;
  tokenB: CanonicalToken;
  priceAtoB: SourcedValue<number>;
  priceBtoA: SourcedValue<number>;
  reserveA: SourcedValue<number>;
  reserveB: SourcedValue<number>;
  feeBps: SourcedValue<number>;
  liquidityUsd: SourcedValue<number>;
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
}
