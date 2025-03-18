import { Sha256 } from "@aws-crypto/sha256-js";
import type { AwsCredentialIdentity, AwsCredentialIdentityProvider, Provider } from "@aws-sdk/types";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import { getDefaultCredentialProvider } from "./credential-provider.js";
import { parseRequest } from "./parse-request.js";

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
  headers["host"] = url.host;

  const service = options.service;
  const region = options.region || "us-east-1";
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
    query: Object.fromEntries(url.searchParams.entries()),
  });

  const signer = new SignatureV4({
    credentials,
    service,
    region,
    sha256: Sha256,
  });

  const { headers: signedHeaders } = await signer.sign(httpRequest);

  // Create a new request with the signed headers
  return new Request(input, { ...init, headers: signedHeaders });
}
