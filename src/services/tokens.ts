/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeStructTag } from '@mysten/sui/utils';
import { CanonicalToken } from '../types/dex';

/**
 * Strict canonical token definitions on Sui Network.
 * Every type is wrapped in normalizeStructTag to prevent mismatching formats.
 */
export const SUI_COIN_TYPE = normalizeStructTag('0x2::sui::SUI');

// Native USDC issued directly by Circle on Sui
export const NATIVE_USDC_TYPE = normalizeStructTag(
  '0xdba34672e30cb065b1f93e3ab552186b49d32933167b42e928ec5f6147b25c1e::usdc::USDC'
);

// Wormhole Bridged USDC (wUSDC / USDCet)
export const WORMHOLE_USDC_TYPE = normalizeStructTag(
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
);

// Wormhole Bridged USDT (wUSDT / USDTet)
export const WORMHOLE_USDT_TYPE = normalizeStructTag(
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN'
);

// Cetus Protocol Token (CETUS)
export const CETUS_COIN_TYPE = normalizeStructTag(
  '0x06864a6f921804860930db6ddbe2e16acdf8504495ea74814132597b52325d30::cetus::CETUS'
);

// DeepBook Protocol Token (DEEP)
export const DEEP_COIN_TYPE = normalizeStructTag(
  '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP'
);

// NAVI Protocol Token (NAVX)
export const NAVX_COIN_TYPE = normalizeStructTag(
  '0xa99b8952d4f701c5d3197607a750c02ec01d0db217ef288ba5b05b8a6f3b0ae5::navx::NAVX'
);

// Scallop Protocol Token (SCA)
export const SCA_COIN_TYPE = normalizeStructTag(
  '0x70162142d43862a1c00aa1500301493873fa080356715d8d7224205f52863318::sca::SCA'
);

// Bucket Protocol Stablecoin (BUCK)
export const BUCK_COIN_TYPE = normalizeStructTag(
  '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK'
);

// Wormhole Bridged WETH (wETH)
export const WORMHOLE_ETH_TYPE = normalizeStructTag(
  '0xaf8d465bd2d728e622b800eb3d522677882264b44d1e032621114a80a07ec114::coin::COIN'
);

export const CANONICAL_TOKENS: Record<string, CanonicalToken> = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui Network Token',
    canonicalType: SUI_COIN_TYPE,
    decimals: 9,
    isStablecoin: false,
    notes: 'Native gas token of Sui blockchain',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Native Circle)',
    canonicalType: NATIVE_USDC_TYPE,
    decimals: 6,
    isStablecoin: true,
    notes: 'Official Circle native issuance on Sui. Distinct from Wormhole wUSDC.',
  },
  wUSDC: {
    symbol: 'wUSDC',
    name: 'USD Coin (Wormhole Bridge)',
    canonicalType: WORMHOLE_USDC_TYPE,
    decimals: 6,
    isStablecoin: true,
    notes: 'Legacy Wormhole-bridged USDC. Incompatible liquidity pool with Native USDC.',
  },
  wUSDT: {
    symbol: 'wUSDT',
    name: 'Tether USD (Wormhole Bridge)',
    canonicalType: WORMHOLE_USDT_TYPE,
    decimals: 6,
    isStablecoin: true,
    notes: 'Wormhole-bridged USDT.',
  },
  CETUS: {
    symbol: 'CETUS',
    name: 'Cetus Protocol Token',
    canonicalType: CETUS_COIN_TYPE,
    decimals: 9,
    isStablecoin: false,
    notes: 'Governance & utility token of Cetus CLMM',
  },
  DEEP: {
    symbol: 'DEEP',
    name: 'DeepBook Protocol Token',
    canonicalType: DEEP_COIN_TYPE,
    decimals: 6,
    isStablecoin: false,
    notes: 'Native CLOB token of DeepBook v3',
  },
  NAVX: {
    symbol: 'NAVX',
    name: 'NAVI Protocol Token',
    canonicalType: NAVX_COIN_TYPE,
    decimals: 9,
    isStablecoin: false,
    notes: 'Liquidity protocol token of NAVI',
  },
  SCA: {
    symbol: 'SCA',
    name: 'Scallop Token',
    canonicalType: SCA_COIN_TYPE,
    decimals: 9,
    isStablecoin: false,
    notes: 'Money market lending protocol token',
  },
  BUCK: {
    symbol: 'BUCK',
    name: 'Bucket USD',
    canonicalType: BUCK_COIN_TYPE,
    decimals: 9,
    isStablecoin: true,
    notes: 'Over-collateralized stablecoin on Sui',
  },
  wETH: {
    symbol: 'wETH',
    name: 'Wrapped Ethereum (Wormhole)',
    canonicalType: WORMHOLE_ETH_TYPE,
    decimals: 8,
    isStablecoin: false,
    notes: 'Wormhole bridged Ethereum',
  },
};

/**
 * Validates if two coin types are canonically identical.
 * Strictly uses normalizeStructTag to prevent evasion.
 */
export function areCoinsIdentical(typeA: string, typeB: string): boolean {
  try {
    return normalizeStructTag(typeA) === normalizeStructTag(typeB);
  } catch {
    return false;
  }
}

/**
 * Checks if comparison involves Native USDC and Wormhole USDC,
 * which are different assets and must never be matched in an atomic arbitrage loop.
 */
export function checkAssetMismatch(typeA: string, typeB: string): {
  isMismatch: boolean;
  message?: string;
} {
  try {
    const normA = normalizeStructTag(typeA);
    const normB = normalizeStructTag(typeB);

    if (
      (normA === NATIVE_USDC_TYPE && normB === WORMHOLE_USDC_TYPE) ||
      (normA === WORMHOLE_USDC_TYPE && normB === NATIVE_USDC_TYPE)
    ) {
      return {
        isMismatch: true,
        message: 'Aset berbeda! Native USDC (Circle) dan Wormhole wUSDC bukan token yang sama. Dilarang melakukan arbitrage silang langsung tanpa bridge.',
      };
    }
    return { isMismatch: false };
  } catch {
    return { isMismatch: false };
  }
}

/**
 * Formats a canonical struct tag for display: 0x000...002::sui::SUI -> 0x0002...::sui::SUI
 */
export function formatCanonicalType(type: string): string {
  try {
    const normalized = normalizeStructTag(type);
    const parts = normalized.split('::');
    if (parts.length >= 3) {
      const addr = parts[0];
      const shortAddr = addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
      return `${shortAddr}::${parts[1]}::${parts[2]}`;
    }
    return normalized;
  } catch {
    return type;
  }
}
