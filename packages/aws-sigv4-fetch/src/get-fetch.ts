export const getFetchFn = (customFetchFn?: typeof fetch): typeof fetch => {
  if (customFetchFn) {
    return customFetchFn;
  }

  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }

  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }

  throw new Error('No fetch implementation found');
};
