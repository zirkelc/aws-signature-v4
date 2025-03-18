import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";
import type { SignRequestOptions } from "aws-sigv4-sign";
import { signRequest } from "aws-sigv4-sign";
import { getFetchFn } from "./get-fetch.js";

export type SignedFetcherOptions = {
  /**
   * The AWS service to sign requests for, e.g. `execute-api` for AWS API Gateway or `lambda` for Lambda Function URLs.
   */
  service: string;
  /**
   * The AWS region to sign requests for, e.g. `us-east-1` or `eu-west-2`.
   * Defaults to `us-east-1` if not provided.
   */
  region?: string;
  /**
   * The AWS credentials to use when signing requests.
   * Optional in Node.js environments where they will be retrieved from the environment using [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node).
   * In browser environments, credentials are **required** and must be provided explicitly.
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentity/ | AwsCredentialIdentity}
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentityProvider/ | AwsCredentialIdentityProvider}
   */
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  /**
   * The `fetch` function to use when signing requests.
   * Defaults to the native `fetch` function.
   */
  fetch?: typeof fetch;
};

export type CreateSignedFetcher = (init: SignedFetcherOptions) => typeof fetch;

/**
 * Creates a signed fetcher function that automatically signs requests using AWS Signature V4.
 *
 * @example
 * ```ts
 * const signedFetcher = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });
 *
 * const response = await signedFetcher('https://mylambda.lambda-url.eu-west-1.on.aws/', {
 *   method: 'POST',
 *   body: JSON.stringify({ a: 1 }),
 *   headers: { 'Content-Type': 'application/json' }
 * });
 * ```
 */
export const createSignedFetcher: CreateSignedFetcher = (options: SignedFetcherOptions): typeof fetch => {
  const fetchFn = getFetchFn(options.fetch);
  const signOptions: SignRequestOptions = {
    service: options.service,
    region: options.region,
    credentials: options.credentials,
  };

  return async (input, init?) => {
    const signedRequest = init ? await signRequest(input, init, signOptions) : await signRequest(input, signOptions);

    return fetchFn(signedRequest);
  };
};
