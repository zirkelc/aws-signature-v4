import { beforeEach, describe, expect, it, vi } from 'vitest';
import { credentials, region, service, url } from './fixtures.js';

const { mockDefaultProvider } = vi.hoisted(() => ({
  mockDefaultProvider: vi.fn(),
}));

vi.mock(import('@aws-sdk/credential-provider-node'), () => ({
  defaultProvider: mockDefaultProvider,
}));

const originalWindow = global.window;
const originalDocument = global.document;

/**
 * The default provider is cached at module scope, so the module registry has to
 * be reset between tests to keep them isolated.
 */
async function importCredentialProvider() {
  vi.resetModules();
  return import('./credential-provider.js');
}

beforeEach(() => {
  global.window = undefined as any;
  global.document = undefined as any;
  mockDefaultProvider.mockReset();
  mockDefaultProvider.mockReturnValue(() => Promise.resolve(credentials));

  return () => {
    global.window = originalWindow;
    global.document = originalDocument;
  };
});

describe('getDefaultCredentialProvider', () => {
  it('should load default credentials provider in node environment', async () => {
    // Arrange
    const { getDefaultCredentialProvider } = await importCredentialProvider();

    // Act
    const defaultCredentialProvider = await getDefaultCredentialProvider();
    const resolvedCredentials = await defaultCredentialProvider();

    // Assert
    expect(resolvedCredentials).toEqual(credentials);
  });

  it('should throw error when in browser environment', async () => {
    // Arrange
    const { getDefaultCredentialProvider } = await importCredentialProvider();
    global.window = {} as any;
    global.document = {} as any;

    // Act
    const result = getDefaultCredentialProvider();

    // Assert
    await expect(result).rejects.toThrow('AWS credentials provider is not available in browser environments');
  });

  it('should construct the provider once across sequential calls', async () => {
    // Arrange
    const { getDefaultCredentialProvider } = await importCredentialProvider();

    // Act
    const first = await getDefaultCredentialProvider();
    const second = await getDefaultCredentialProvider();
    const third = await getDefaultCredentialProvider();

    // Assert
    expect(mockDefaultProvider.mock.calls.length).toBe(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('should construct the provider once across concurrent calls', async () => {
    // Arrange
    const { getDefaultCredentialProvider } = await importCredentialProvider();

    // Act
    const providers = await Promise.all([
      getDefaultCredentialProvider(),
      getDefaultCredentialProvider(),
      getDefaultCredentialProvider(),
    ]);

    // Assert
    expect(mockDefaultProvider.mock.calls.length).toBe(1);
    expect(providers[1]).toBe(providers[0]);
    expect(providers[2]).toBe(providers[0]);
  });

  it('should not cache a failed construction', async () => {
    // Arrange
    const { getDefaultCredentialProvider } = await importCredentialProvider();
    mockDefaultProvider.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    // Act
    const failed = getDefaultCredentialProvider();
    await expect(failed).rejects.toThrow('AWS credentials provider could not be loaded');
    const recovered = await getDefaultCredentialProvider();

    // Assert
    expect(mockDefaultProvider.mock.calls.length).toBe(2);
    expect(await recovered()).toEqual(credentials);
  });
});

describe('signRequest without explicit credentials', () => {
  it('should construct the provider once across multiple signs', async () => {
    // Arrange
    vi.resetModules();
    const { signRequest } = await import('./sign-request.js');

    // Act
    for (let i = 0; i < 5; i++) {
      await signRequest(url, { service, region });
    }

    // Assert
    expect(mockDefaultProvider.mock.calls.length).toBe(1);
  });
});
