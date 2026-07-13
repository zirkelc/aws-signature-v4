import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFetchFn } from './get-fetch.js';

describe('getFetchFn', () => {
  const fetchMock = vi.fn();
  globalThis.fetch = fetchMock;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns custom fetch function if provided', () => {
    const customFetchFn = vi.fn();
    expect(getFetchFn(customFetchFn)).toBe(customFetchFn);
  });

  it('returns bound window.fetch if no custom fetch function is provided and window is defined', () => {
    const windowFetchMock = vi.fn();
    const spy = vi.spyOn(windowFetchMock as any, 'bind');
    // @ts-expect-error
    global.window = { fetch: windowFetchMock };

    getFetchFn();
    expect(spy).toHaveBeenCalledWith(window);

    // @ts-expect-error
    global.window = undefined;
  });

  it('returns bound globalThis.fetch if no custom fetch function is provided, window is not defined, and globalThis is defined', () => {
    const spy = vi.spyOn(fetchMock as any, 'bind');

    getFetchFn();
    expect(spy).toHaveBeenCalledWith(globalThis);
  });

  it('throws an error if no fetch implementation is found', () => {
    // @ts-expect-error
    global.fetch = undefined;
    // @ts-expect-error
    global.window = undefined;
    // @ts-expect-error
    globalThis.fetch = undefined;

    expect(() => getFetchFn()).toThrow('No fetch implementation found');
  });
});
