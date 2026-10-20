import { describe, expect, it, vi } from 'vitest';
import { api, ApiError, request } from './api';

describe('HTTP client', () => {
  it('accepts empty success responses from DELETE and BARS POST', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    await expect(api.remove('lab-works', 5)).resolves.toBeUndefined();
    await expect(api.link(3, 5, 'remove')).resolves.toBeUndefined();
    expect(fetch.mock.calls[1][0]).toBe('/api/bars/discipline/3/labwork/5/remove');
    expect(fetch.mock.calls[1][1].method).toBe('POST');
  });
  it('preserves the backend validation message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 409, message: 'У лабораторной уже есть дисциплина' }), { status: 409 })));
    await expect(api.link(3, 5, 'add')).rejects.toMatchObject({ status: 409, message: 'У лабораторной уже есть дисциплина' });
  });
  it('distinguishes a connection failure from an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('labs', '/lab-works/1')).rejects.toBeInstanceOf(ApiError);
    await expect(request('labs', '/lab-works/1')).rejects.toMatchObject({ status: 0 });
  });
  it('does not treat an HTML proxy page as entity JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Error</html>', { status: 200 })));
    await expect(api.get('lab-works', 1)).rejects.toThrow('неожиданный формат');
  });
});
