import { describe, it, expect } from 'vitest';
import {
  SUI_COIN_TYPE,
  NATIVE_USDC_TYPE,
  WORMHOLE_USDC_TYPE,
  WORMHOLE_USDT_TYPE,
  CETUS_COIN_TYPE,
  DEEP_COIN_TYPE,
  CANONICAL_TOKENS,
  areCoinsIdentical,
  checkAssetMismatch,
  formatCanonicalType,
} from '../services/tokens';
import { normalizeStructTag } from '@mysten/sui/utils';

describe('Coin Canonical Normalization & Asset Isolation', () => {
  it('correctly formats SUI canonical address', () => {
    expect(SUI_COIN_TYPE).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
    );
    expect(areCoinsIdentical('0x2::sui::SUI', SUI_COIN_TYPE)).toBe(true);
  });

  it('strictly segregates Native USDC (Circle) and Wormhole wUSDC', () => {
    // Native USDC from Circle
    expect(NATIVE_USDC_TYPE).toContain('0xdba34672e30cb065b1f93e3ab552186b49d32933167b42e928ec5f6147b25c1e');
    // Wormhole USDC
    expect(WORMHOLE_USDC_TYPE).toContain('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf');

    // Distinct assets must NEVER be considered identical
    expect(areCoinsIdentical(NATIVE_USDC_TYPE, WORMHOLE_USDC_TYPE)).toBe(false);
    expect(areCoinsIdentical(NATIVE_USDC_TYPE, WORMHOLE_USDT_TYPE)).toBe(false);

    // Mismatch check must flag Native USDC vs Wormhole USDC as dangerous
    const mismatch = checkAssetMismatch(NATIVE_USDC_TYPE, WORMHOLE_USDC_TYPE);
    expect(mismatch.isMismatch).toBe(true);
    expect(mismatch.message).toContain('Aset berbeda!');
  });

  it('rejects short-tag evasion like 0xdba3::usdc::USDC matching wormhole', () => {
    expect(
      areCoinsIdentical(
        '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        '0xdba34672e30cb065b1f93e3ab552186b49d32933167b42e928ec5f6147b25c1e::usdc::USDC'
      )
    ).toBe(false);
  });

  it('all registered canonical tokens normalize successfully', () => {
    for (const [key, token] of Object.entries(CANONICAL_TOKENS)) {
      expect(token.canonicalType).toBe(normalizeStructTag(token.canonicalType));
      expect(token.decimals).toBeGreaterThanOrEqual(6);
      expect(token.symbol).toBe(key);
    }
  });

  it('formats canonical address cleanly for UI without losing type', () => {
    const formatted = formatCanonicalType(SUI_COIN_TYPE);
    expect(formatted).toBe('0x0000...0002::sui::SUI');
    const formattedDeep = formatCanonicalType(DEEP_COIN_TYPE);
    expect(formattedDeep).toContain('deep::DEEP');
    const formattedCetus = formatCanonicalType(CETUS_COIN_TYPE);
    expect(formattedCetus).toContain('cetus::CETUS');
  });
});
