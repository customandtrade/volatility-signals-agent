import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import massive, { callRest, tryCandidates, MassiveConfig, _clearMassiveCache } from '@/services/massive';

const ORIGINAL_ENV = process.env.MASSIVE_API_KEY;

describe('massive service', () => {
  beforeEach(() => {
    process.env.MASSIVE_API_KEY = 'test-key';
    _clearMassiveCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.MASSIVE_API_KEY = ORIGINAL_ENV;
    _clearMassiveCache();
  });

  it('callRest should fetch JSON and cache result', async () => {
    const mockJson = { ok: true, data: { hello: 'world' } };
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => mockJson });
    vi.stubGlobal('fetch', fetchMock as any);

    const res1 = await callRest('/test', undefined, 60);
    const res2 = await callRest('/test', undefined, 60);

    expect(res1).toEqual(mockJson);
    expect(res2).toEqual(mockJson);
    // fetch should be called only once because of caching
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('callRest should retry on transient failures', async () => {
    const mockJson = { success: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, text: async () => 'error' })
      .mockResolvedValueOnce({ ok: true, json: async () => mockJson });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await callRest('/retry', undefined, 15, 1, 1);
    expect(res).toEqual(mockJson);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('tryCandidates should try multiple paths until success', async () => {
    const goodJson = { data: { results: [{ last_trade_price: 123 }] } };
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/v1/quotes')) {
        return Promise.reject(new Error('network')); // fail first path
      }
      return Promise.resolve({ ok: true, json: async () => goodJson });
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const res = await tryCandidates(['/v1/quotes', '/v2/quotes'], { symbols: 'SPY' }, 8);
    expect(res).toEqual(goodJson);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('throws when all candidates fail', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('boom'));
    vi.stubGlobal('fetch', fetchMock as any);

    await expect(tryCandidates(['/a', '/b'], { symbol: 'X' }, 1)).rejects.toThrow(/No Massive endpoints succeeded/);
  });
});