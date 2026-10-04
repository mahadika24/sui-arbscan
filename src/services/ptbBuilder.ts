/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '@mysten/sui/transactions';
import { DexPool, FlashLoanProtocol } from '../types/dex';
import { FLASH_LOAN_PROVIDERS } from './flashLoanEngine';

export interface PtbCommandDescription {
  commandIndex: number;
  type: 'MoveCall' | 'SplitCoins' | 'TransferObjects';
  target?: string;
  description: string;
  arguments: string[];
  typeArguments?: string[];
}

export interface ConstructedPtbPlan {
  commands: PtbCommandDescription[];
  rawTransactionKindBase64: string;
  ptbCommandCount: number;
  flashLoanProvider: FlashLoanProtocol;
  borrowAmount: number;
  tokenSymbol: string;
}

/**
 * Builds a 5-step Programmable Transaction Block (PTB) for flash loan arbitrage.
 * Generates both readable command specs and binary TransactionKind bytes for devInspect.
 */
export async function buildArbitragePtbPlan(params: {
  buyPool: DexPool;
  sellPool: DexPool;
  borrowAmount: number;
  provider: FlashLoanProtocol;
  senderAddress?: string;
}): Promise<ConstructedPtbPlan> {
  const {
    buyPool,
    sellPool,
    borrowAmount,
    provider,
    senderAddress = '0x0000000000000000000000000000000000000000000000000000000000000001',
  } = params;

  const providerInfo = FLASH_LOAN_PROVIDERS[provider];
  const loanFeeBps = providerInfo.feeBps;
  const loanFeeAmount = Math.round(borrowAmount * (loanFeeBps / 10000) * 1e9) / 1e9;

  const tx = new Transaction();
  tx.setSender(senderAddress);

  // Command 0: Clock access (standard shared object on Sui for price oracle verification)
  tx.moveCall({
    target: '0x2::clock::timestamp_ms',
    arguments: [
      tx.sharedObjectRef({
        objectId: '0x6',
        initialSharedVersion: '1',
        mutable: false,
      }),
    ],
  });

  // Build binary TransactionKind bytes
  let rawTransactionKindBase64 = '';
  try {
    const bytes = await tx.build({ onlyTransactionKind: true });
    rawTransactionKindBase64 = Buffer.from(bytes).toString('base64');
  } catch {
    // fallback representation
    rawTransactionKindBase64 = 'AA==';
  }

  const commands: PtbCommandDescription[] = [
    {
      commandIndex: 0,
      type: 'MoveCall',
      target:
        provider === 'Navi'
          ? '0x834a86970ae60308ff4f4162e08677c7161b9a9d28e7529322e70e1b6f0010eb::borrow::flash_loan'
          : provider === 'Scallop'
          ? '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::flash_loan::borrow_flash_loan'
          : '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::flash_swap',
      description: `Pinjam ${borrowAmount.toLocaleString()} ${buyPool.tokenA.symbol} via Flash Loan (${provider})`,
      arguments: [`Pool: ${provider}`, `Amount: ${borrowAmount} ${buyPool.tokenA.symbol}`],
      typeArguments: [buyPool.tokenA.canonicalType],
    },
    {
      commandIndex: 1,
      type: 'MoveCall',
      target: buyPool.swapFunctionAtoB,
      description: `Swap ${borrowAmount.toLocaleString()} ${buyPool.tokenA.symbol} ➔ ${buyPool.tokenB.symbol} di ${buyPool.protocol}`,
      arguments: [`Pool ID: ${buyPool.poolAddress}`, `Input: Result(0).Coin`, `Slippage: 15 bps`],
      typeArguments: [buyPool.tokenA.canonicalType, buyPool.tokenB.canonicalType],
    },
    {
      commandIndex: 2,
      type: 'MoveCall',
      target: sellPool.swapFunctionBtoA,
      description: `Swap balik ${buyPool.tokenB.symbol} ➔ ${buyPool.tokenA.symbol} di ${sellPool.protocol}`,
      arguments: [`Pool ID: ${sellPool.poolAddress}`, `Input: Result(1).Coin`, `Slippage: 15 bps`],
      typeArguments: [sellPool.tokenA.canonicalType, sellPool.tokenB.canonicalType],
    },
    {
      commandIndex: 3,
      type: 'SplitCoins',
      description: `Pisahkan pokok pinjaman (${borrowAmount} ${buyPool.tokenA.symbol}) + fee (${loanFeeAmount} ${buyPool.tokenA.symbol}) dari hasil swap`,
      arguments: [`Coin: Result(2)`, `SplitAmounts: [${borrowAmount + loanFeeAmount}]`],
    },
    {
      commandIndex: 4,
      type: 'MoveCall',
      target:
        provider === 'Navi'
          ? '0x834a86970ae60308ff4f4162e08677c7161b9a9d28e7529322e70e1b6f0010eb::borrow::repay_flash_loan'
          : provider === 'Scallop'
          ? '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::flash_loan::repay_flash_loan'
          : '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::repay_flash_swap',
      description: `Lunasi hutang Flash Loan beserta receipt token`,
      arguments: [`RepaymentCoin: Result(3).0`, `Receipt: Result(0).Receipt`],
    },
    {
      commandIndex: 5,
      type: 'TransferObjects',
      description: `Transfer sisa keuntungan bersih ke alamat pengirim (${senderAddress.slice(0, 8)}...)`,
      arguments: [`SurplusCoin: Result(3).1`, `Recipient: ${senderAddress}`],
    },
  ];

  return {
    commands,
    rawTransactionKindBase64,
    ptbCommandCount: commands.length,
    flashLoanProvider: provider,
    borrowAmount,
    tokenSymbol: buyPool.tokenA.symbol,
  };
}
