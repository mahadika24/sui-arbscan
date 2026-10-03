import { describe, it, expect } from 'vitest';
import { normalizeStructTag } from '@mysten/sui/utils';

describe('Canonical Coin Tag Verification', () => {
  it('normalizes 0x2::sui::SUI to canonical 64-char address', () => {
    const normalized = normalizeStructTag('0x2::sui::SUI');
    expect(normalized).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
    );
  });

  it('proves Native USDC and Wormhole USDC are strictly distinct assets', () => {
    const nativeUsdc = normalizeStructTag('0xdba34672e30cb065b1f93e3ab552186b49d32933167b42e928ec5f6147b25c1e::usdc::USDC');
    const wormholeUsdc = normalizeStructTag('0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN');
    expect(nativeUsdc).not.toBe(wormholeUsdc);
  });
});
