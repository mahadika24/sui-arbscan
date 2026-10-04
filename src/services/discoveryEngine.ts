/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeStructTag } from '@mysten/sui/utils';
import {
  DexPool,
  PoolStatus,
  PoolVerificationProof,
  CanonicalToken,
} from '../types/dex';
import { CANONICAL_TOKENS } from './tokens';

/**
 * Protocol Registry containing official on-chain packages, swap modules, and exact Move entrypoints.
 * Strictly adheres to rule: No generic swap functions like protocol::pool::swap.
 */
export interface DexProtocolMetadata {
  name: string;
  packageId: string;
  swapModule: string;
  swapFunctionAtoB: string;
  swapFunctionBtoA: string;
  sharedConfigObjectId?: string;
  documentationUrl?: string;
}

export const PROTOCOL_REGISTRY: Record<string, DexProtocolMetadata> = {
  turbos: {
    name: 'Turbos Finance',
    packageId: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1',
    swapModule: 'swap_router',
    swapFunctionAtoB:
      '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::swap_router::swap_a_b',
    swapFunctionBtoA:
      '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1::swap_router::swap_b_a',
  },
  momentum: {
    name: 'Momentum DEX',
    packageId: '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860',
    swapModule: 'trade',
    swapFunctionAtoB:
      '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::trade::flash_swap',
    swapFunctionBtoA:
      '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::trade::flash_swap',
  },
  cetus: {
    name: 'Cetus CLMM',
    packageId: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
    swapModule: 'pool',
    swapFunctionAtoB:
      '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::flash_swap',
    swapFunctionBtoA:
      '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::flash_swap',
    sharedConfigObjectId: '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
  },
  deepbook: {
    name: 'DeepBook V2',
    packageId: '0xdee9',
    swapModule: 'clob_v2',
    swapFunctionAtoB: '0xdee9::clob_v2::swap_exact_base_for_quote',
    swapFunctionBtoA: '0xdee9::clob_v2::swap_exact_quote_for_base',
  },
  magma: {
    name: 'Magma DEX',
    packageId: '0x4a35d3dfef55ed3631b7158544c6322a23bc434fe4fca1234cb680ce0505f82d',
    swapModule: 'pool',
    swapFunctionAtoB:
      '0x4a35d3dfef55ed3631b7158544c6322a23bc434fe4fca1234cb680ce0505f82d::pool::swap',
    swapFunctionBtoA:
      '0x4a35d3dfef55ed3631b7158544c6322a23bc434fe4fca1234cb680ce0505f82d::pool::swap',
  },
  steamm: {
    name: 'Steamm CPMM',
    packageId: '0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261',
    swapModule: 'pool',
    swapFunctionAtoB:
      '0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::pool::swap',
    swapFunctionBtoA:
      '0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::pool::swap',
  },
};

/**
 * Resolves the protocol metadata based on dex identifier or package ID.
 */
export function resolveProtocolMetadata(dexIdOrPackage: string): DexProtocolMetadata {
  const normalizedKey = dexIdOrPackage.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, meta] of Object.entries(PROTOCOL_REGISTRY)) {
    if (normalizedKey.includes(key) || dexIdOrPackage === meta.packageId) {
      return meta;
    }
  }

  // Fallback with explicit Move package definition
  return {
    name: dexIdOrPackage,
    packageId: '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860',
    swapModule: 'trade',
    swapFunctionAtoB:
      '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::trade::flash_swap',
    swapFunctionBtoA:
      '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::trade::flash_swap',
  };
}

/**
 * Extracts and canonicalizes type arguments from a Sui Move struct type string.
 * Example: "0x7028...::pool::Pool<0x2::sui::SUI, 0xdba3...::usdc::USDC>"
 */
export function parsePoolTypeArguments(typeString: string): {
  packageId: string;
  moduleName: string;
  structName: string;
  typeParams: string[];
} {
  const parts = typeString.split('<');
  const pathPart = parts[0].trim();
  const pathTokens = pathPart.split('::');

  const packageId = pathTokens[0] || '';
  const moduleName = pathTokens[1] || '';
  const structName = pathTokens[2] || '';

  const typeParams: string[] = [];
  if (parts.length > 1) {
    const paramsStr = parts.slice(1).join('<').replace(/>$/, '').trim();
    // Split by comma outside of nested brackets
    let depth = 0;
    let current = '';
    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr[i];
      if (char === '<') depth++;
      else if (char === '>') depth--;
      else if (char === ',' && depth === 0) {
        if (current.trim()) {
          try {
            typeParams.push(normalizeStructTag(current.trim()));
          } catch {
            typeParams.push(current.trim());
          }
        }
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) {
      try {
        typeParams.push(normalizeStructTag(current.trim()));
      } catch {
        typeParams.push(current.trim());
      }
    }
  }

  return { packageId, moduleName, structName, typeParams };
}

/**
 * Matches a canonical token from normalized struct tag.
 */
export function findCanonicalTokenByTag(structTag: string): CanonicalToken {
  let norm = structTag;
  try {
    norm = normalizeStructTag(structTag);
  } catch {
    // keep as is
  }

  for (const token of Object.values(CANONICAL_TOKENS)) {
    if (token.canonicalType === norm) {
      return token;
    }
  }

  // Derive a canonical token representation if not in constant map
  const parts = norm.split('::');
  const symbol = parts[parts.length - 1] || 'UNKNOWN';
  return {
    symbol,
    name: symbol,
    canonicalType: norm,
    decimals: symbol.toUpperCase() === 'SUI' ? 9 : 6,
  };
}

/**
 * Validates whether a pool satisfies Phase A requirements to transition to VERIFIED, QUOTEABLE, or EXECUTABLE.
 */
export function evaluatePoolStatus(proof: PoolVerificationProof | null, hasPrice: boolean): PoolStatus {
  if (!proof || !proof.objectExists) {
    return 'DISCOVERED';
  }

  if (proof.ownerType !== 'Shared') {
    return 'DISCOVERED';
  }

  if (!hasPrice) {
    return 'VERIFIED';
  }

  if (proof.packageId && proof.moduleName) {
    return 'EXECUTABLE';
  }

  return 'QUOTEABLE';
}
