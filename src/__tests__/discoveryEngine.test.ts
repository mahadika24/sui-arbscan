import { describe, it, expect } from 'vitest';
import {
  parsePoolTypeArguments,
  resolveProtocolMetadata,
  evaluatePoolStatus,
  PROTOCOL_REGISTRY,
} from '../services/discoveryEngine';
import { PoolVerificationProof } from '../types/dex';
import { formatSourcedValue } from '../services/flashLoanEngine';

describe('Phase A — Discovery Engine & On-Chain Verification', () => {
  it('correctly parses Move struct type arguments and normalizes canonical token addresses', () => {
    const rawType =
      '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860::pool::Pool<0x2::sui::SUI, 0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC>';

    const parsed = parsePoolTypeArguments(rawType);

    expect(parsed.packageId).toBe('0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860');
    expect(parsed.moduleName).toBe('pool');
    expect(parsed.structName).toBe('Pool');
    expect(parsed.typeParams).toHaveLength(2);
    expect(parsed.typeParams[0]).toBe('0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI');
    expect(parsed.typeParams[1]).toBe('0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC');
  });

  it('guarantees non-generic Move swap functions per protocol (never protocol::pool::swap)', () => {
    const turbosMeta = resolveProtocolMetadata('turbos-finance');
    expect(turbosMeta.swapFunctionAtoB).toContain('::swap_router::swap_a_b');
    expect(turbosMeta.swapFunctionBtoA).toContain('::swap_router::swap_b_a');
    expect(turbosMeta.swapFunctionAtoB).not.toBe('turbos::pool::swap');

    const momentumMeta = resolveProtocolMetadata('momentum');
    expect(momentumMeta.swapFunctionAtoB).toContain('::trade::flash_swap');

    const deepbookMeta = PROTOCOL_REGISTRY.deepbook;
    expect(deepbookMeta.swapFunctionAtoB).toBe('0xdee9::clob_v2::swap_exact_base_for_quote');
  });

  it('evaluates status lifecycle: DISCOVERED -> VERIFIED -> QUOTEABLE -> EXECUTABLE', () => {
    // Stage 1: Unverified or missing object
    expect(evaluatePoolStatus(null, false)).toBe('DISCOVERED');

    const unverifiedProof: PoolVerificationProof = {
      verifiedAt: Date.now(),
      objectExists: false,
      version: '0',
      digest: '',
      onChainType: '',
      ownerType: 'Address',
      packageId: '',
      moduleName: '',
      verifiedTokenA: '',
      verifiedTokenB: '',
      verifiedReserveA: null,
      verifiedReserveB: null,
      verifiedFeeBps: null,
      rawRpcOutputSnippet: '',
    };
    expect(evaluatePoolStatus(unverifiedProof, false)).toBe('DISCOVERED');

    // Stage 2: Verified shared object on Sui RPC
    const verifiedProof: PoolVerificationProof = {
      ...unverifiedProof,
      objectExists: true,
      ownerType: 'Shared',
      version: '1034558680',
      digest: '5nsGbjhChM5f55M7hmZwoqcQUz8sgawAz9pjQT4KsHSu',
      onChainType: '0x7028...::pool::Pool<...>',
      packageId: '0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860',
      moduleName: 'pool',
    };
    expect(evaluatePoolStatus(verifiedProof, false)).toBe('VERIFIED');

    // Stage 3 & 4: Has price and Move entrypoint -> EXECUTABLE
    expect(evaluatePoolStatus(verifiedProof, true)).toBe('EXECUTABLE');
  });

  it('strictly labels external aggregator data as [Kuotasi] or [Eksternal], never [On-chain]', () => {
    const externalPrice = {
      value: 1.185,
      source: 'kuotasi' as const,
      sourceDetail: 'Harga DexScreener',
      timestamp: Date.now(),
    };
    const formattedPrice = formatSourcedValue(externalPrice);
    expect(formattedPrice.badge).toBe('[Kuotasi]');
    expect(formattedPrice.display).toContain('[Kuotasi]');
    expect(formattedPrice.display).not.toContain('[On-chain]');

    const externalTvl = {
      value: 5000000,
      source: 'eksternal' as const,
      sourceDetail: 'TVL DexScreener',
      timestamp: Date.now(),
    };
    const formattedTvl = formatSourcedValue(externalTvl);
    expect(formattedTvl.badge).toBe('[Eksternal]');
    expect(formattedTvl.display).toContain('[Eksternal]');
    expect(formattedTvl.display).not.toContain('[On-chain]');
  });
});
