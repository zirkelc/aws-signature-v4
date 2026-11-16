import { Sha256 } from '@aws-crypto/sha256-js';
import type { AwsCredentialIdentity, AwsCredentialIdentityProvider, QueryParameterBag } from '@aws-sdk/types';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import { getDefaultCredentialProvider } from './credential-provider.js';
import { parseRequest } from './parse-request.js';

/**
 * Signing names of the S3 data and S3 Control APIs (including S3 Express One Zone, S3 on Outposts and S3 Object Lambda).
 * These sign the request path as it is sent: no second URI encoding and no normalization of empty segments.
 * All other services, including S3 Tables and S3 Vectors, expect the path to be URI-encoded again.
 * The AWS SDK S3 and S3 Control clients disable `signingEscapePath` for the same reason.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html#create-canonical-request}
 */
const UNESCAPED_PATH_SERVICES = new Set(['s3', 's3express', 's3-outposts', 's3-object-lambda']);

export type SignRequestOptions = {
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
   * When omitted, the default provider is constructed once and reused for the lifetime of the
   * process, so environment changes are not picked up after the first signed request. Pass this
   * option explicitly to control credential resolution yourself.
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentity/ | AwsCredentialIdentity}
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentityProvider/ | AwsCredentialIdentityProvider}
   */
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
};

/**
 * Signs a request using AWS Signature V4 and returns a `Request` object.
 *
 * @example
 * ```ts
 * const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', {
 *   service: 'lambda',
 *   region: 'eu-west-1'
 * });
 *
 * const response = await fetch(signedRequest);
 * ```
 */
export function signRequest(input: string | Request | URL, options: SignRequestOptions): Promise<Request>;
/**
 * Signs a request using AWS Signature V4 and returns a `Request` object.
 *
 * @example
 * ```ts
 * const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/',
 *  {
 *    method: 'POST',
 *    body: JSON.stringify({ a: 1 }),
 *    headers: { 'Content-Type': 'application/json' }
 *  },
 *  {
 *    service: 'lambda',
 *    region: 'eu-west-1'
 *  }
 * );
 *
 * const response = await fetch(signedRequest);
 * ```
 */
export function signRequest(
  input: string | Request | URL,
  init: RequestInit,
  options: SignRequestOptions,
): Promise<Request>;
export async function signRequest(
  ...args:
    | [input: string | Request | URL, options: SignRequestOptions]
    | [input: string | Request | URL, init: RequestInit, options: SignRequestOptions]
): Promise<Request> {
  let input: string | Request | URL;
  let init: RequestInit | undefined;
  let options: SignRequestOptions;

  if (args.length === 2) {
    input = args[0];
    options = args[1];
  } else {
    input = args[0];
    init = args[1];
    options = args[2];
  }

  const { url, method, headers, body } = await parseRequest(input, init);

  // host is required by AWS Signature V4: https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
  headers['host'] = url.host;

  const service = options.service;
  const region = options.region || 'us-east-1';
  const credentials = options.credentials || (await getDefaultCredentialProvider());

  const httpRequest = new HttpRequest({
    method,
    body,
    headers,
    hostname: url.hostname,
    path: url.pathname,
    protocol: url.protocol,
    port: url.port ? Number(url.port) : undefined,
    username: url.username,
    password: url.password,
    fragment: url.hash,
    // Query paramaters accept multiple values per key
    query: Array.from(url.searchParams.entries()).reduce<QueryParameterBag>((acc, [key, value]) => {
      if (Array.isArray(acc[key])) {
        acc[key].push(value);
      } else {
        acc[key] = [value];
      }
      return acc;
    }, {}),
  });

  const signer = new SignatureV4({
    credentials,
    service,
    region,
    sha256: Sha256,
    uriEscapePath: !UNESCAPED_PATH_SERVICES.has(service),
  });

  const { headers: signedHeaders } = await signer.sign(httpRequest);

  // Create a new request with the signed headers
  return new Request(input, { ...init, headers: signedHeaders });
}
