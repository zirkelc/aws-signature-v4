import type { AwsCredentialIdentity, Provider } from "@aws-sdk/types";

/**
 * Determines if the code is running in a browser environment.
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Returns the default credential provider based on the environment.
 * In Node.js, it uses the default provider from @aws-sdk/credential-provider-node.
 * In a browser environment, it throws an error as credentials must be provided explicitly.
 */
export async function getCredentialProvider(): Promise<Provider<AwsCredentialIdentity>> {
  if (isBrowser())
    throw new Error(
      "AWS credentials provider is not available in browser environments. " +
        "You must provide credentials explicitly when calling signRequest in a browser.",
    );

  try {
    // Dynamic import to prevent bundling Node.js specific code in browser bundles
    const { defaultProvider } = await import("@aws-sdk/credential-provider-node");
    return defaultProvider();
  } catch (error) {
    // If import fails, we're likely in a non-Node.js environment that doesn't support the credential provider
    throw new Error("AWS credentials provider could not be loaded. You must provide credentials explicitly.");
  }
}
