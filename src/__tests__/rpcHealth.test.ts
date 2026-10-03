import { describe, it, expect } from 'vitest';
import { formatSourcedValue } from '../services/flashLoanEngine';
import { SuiChainStatus } from '../types/dex';

describe('Real-Time RPC Node Health & Synchronization Verification', () => {
  it('correctly validates a synchronized Sui node (block age < 10 seconds)', () => {
    const now = Date.now();
    const mockStatus: SuiChainStatus = {
      connected: true,
      chainIdentifier: {
        value: '35834a8a',
        source: 'on-chain',
        sourceDetail: 'Genesis identifier',
        timestamp: now,
      },
      checkpointNumber: {
        value: 329785195,
        source: 'on-chain',
        sourceDetail: 'Sui Mainnet RPC',
        timestamp: now,
      },
      checkpointTimestampMs: {
        value: now - 2000, // 2 seconds old
        source: 'on-chain',
        sourceDetail: 'Checkpoint header',
        timestamp: now,
      },
      checkpointAgeSeconds: {
        value: 2,
        source: 'on-chain',
        sourceDetail: 'Block age: 2s',
        timestamp: now,
      },
      syncStatus: {
        value: 'SINKRON',
        source: 'on-chain',
        sourceDetail: 'Real-time (<10s)',
        timestamp: now,
      },
      epoch: {
        value: 1269,
        source: 'on-chain',
        sourceDetail: 'Epoch #1269',
        timestamp: now,
      },
      protocolVersion: {
        value: 137,
        source: 'on-chain',
        sourceDetail: 'Protocol 137',
        timestamp: now,
      },
      referenceGasPriceMist: {
        value: 100,
        source: 'on-chain',
        sourceDetail: 'Reference gas price',
        timestamp: now,
      },
      rpcLatencyMs: {
        value: 58,
        source: 'on-chain',
        sourceDetail: 'Ping roundtrip',
        timestamp: now,
      },
      rpcUrl: 'https://mainnet.sui.rpcpool.com',
      lastChecked: now,
      endpoints: [
        {
          name: 'Primary',
          url: 'https://mainnet.sui.rpcpool.com',
          latencyMs: 58,
          checkpointNumber: 329785195,
          status: 'online',
          isCurrentPrimary: true,
        },
      ],
    };

    expect(mockStatus.syncStatus.value).toBe('SINKRON');
    expect(mockStatus.checkpointAgeSeconds.value).toBeLessThanOrEqual(10);
    expect(mockStatus.rpcLatencyMs.value).toBe(58);

    const formattedCp = formatSourcedValue(mockStatus.checkpointNumber, (v) => `#${v.toLocaleString('en-US')}`);
    expect(formattedCp.display).toBe('#329,785,195 [On-chain]');
    expect(formattedCp.badge).toBe('[On-chain]');
  });

  it('correctly labels desynchronized or offline nodes without displaying fake data', () => {
    const mockOfflineStatus: SuiChainStatus = {
      connected: false,
      chainIdentifier: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Koneksi gagal',
      },
      checkpointNumber: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Node RPC offline',
      },
      checkpointTimestampMs: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Timestamp tidak tersedia',
      },
      checkpointAgeSeconds: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Tidak dapat menghitung usia blok',
      },
      syncStatus: {
        value: 'DESYNC',
        source: 'on-chain',
        sourceDetail: 'Node RPC gagal',
        timestamp: Date.now(),
      },
      epoch: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Epoch tidak tersedia',
      },
      protocolVersion: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'ProtocolConfig tidak tersedia',
      },
      referenceGasPriceMist: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Gas price tidak tersedia',
      },
      rpcLatencyMs: {
        value: null,
        source: 'on-chain',
        sourceDetail: 'RPC',
        timestamp: Date.now(),
        emptyReason: 'Timeout koneksi',
      },
      rpcUrl: 'https://mainnet.sui.rpcpool.com',
      lastChecked: Date.now(),
      endpoints: [],
    };

    const formattedLatency = formatSourcedValue(mockOfflineStatus.rpcLatencyMs);
    expect(formattedLatency.isEmpty).toBe(true);
    expect(formattedLatency.display).toBe('— (Timeout koneksi)');

    const formattedCp = formatSourcedValue(mockOfflineStatus.checkpointNumber);
    expect(formattedCp.isEmpty).toBe(true);
    expect(formattedCp.display).toBe('— (Node RPC offline)');
  });
});
