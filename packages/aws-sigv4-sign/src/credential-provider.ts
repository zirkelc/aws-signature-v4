import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';

/**
 * Determines if the code is running in a browser environment.
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * The pending or resolved default credential provider.
 *
 * The promise is cached rather than the provider it resolves to, so that
 * concurrent callers all await the same construction and exactly one provider
 * instance is ever built.
 */
let cachedDefaultProvider: Promise<AwsCredentialIdentityProvider> | undefined;

async function loadDefaultCredentialProvider(): Promise<AwsCredentialIdentityProvider> {
  try {
    // Dynamic import to prevent bundling Node.js specific code in browser bundles
    const { defaultProvider } = await import('@aws-sdk/credential-provider-node');
    return defaultProvider();
  } catch (error) {
    // If import fails, we're likely in a non-Node.js environment that doesn't support the credential provider
    throw new Error('AWS credentials provider could not be loaded. You must provide credentials explicitly.', {
      cause: error,
    });
  }
}

/**
 * Returns the default credential provider based on the environment.
 * In Node.js, it uses the default provider from @aws-sdk/credential-provider-node.
 * In a browser environment, it throws an error as credentials must be provided explicitly.
 *
 * The provider is constructed once and reused for the lifetime of the process.
 * The AWS SDK caches resolved credentials per provider instance and refreshes
 * them before they expire, so reusing one instance avoids re-resolving
 * credentials (and leaking the HTTP resources used to fetch them) on every call.
 */
export async function getDefaultCredentialProvider(): Promise<AwsCredentialIdentityProvider> {
  if (isBrowser())
    throw new Error(
      `AWS credentials provider is not available in browser environments. You must provide credentials explicitly when calling signRequest in a browser.`,
    );

  if (!cachedDefaultProvider) {
    cachedDefaultProvider = loadDefaultCredentialProvider();

    // A transient failure must not be cached permanently, so the next call can retry
    cachedDefaultProvider.catch(() => {
      cachedDefaultProvider = undefined;
    });
  }

  return cachedDefaultProvider;
}
