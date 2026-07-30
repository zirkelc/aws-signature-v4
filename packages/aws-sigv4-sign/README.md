<div align="center">

<h1>aws-sigv4-sign</h1>

<p align="center">SignatureV4 sign function implemented with the official AWS SDK</p>
<p align="center">
  <a href="https://www.npmjs.com/package/aws-sigv4-sign" alt="aws-sigv4-sign"><img src="https://img.shields.io/npm/dt/aws-sigv4-sign?label=aws-sigv4-sign"></a> <a href="https://github.com/zirkelc/aws-signature-v4/actions/workflows/ci.yml" alt="CI"><img src="https://img.shields.io/github/actions/workflow/status/zirkelc/aws-signature-v4/ci.yml?branch=main"></a>
</p>

</div>

This library signs HTTP requests with [AWS Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html) and returns a standard [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) carrying the signed headers, ready to hand to any HTTP client. Signing is done by [`@smithy/signature-v4`](https://www.npmjs.com/package/@smithy/signature-v4), the same signer the AWS SDK uses, so signatures are computed exactly the way AWS expects.

## Why?

Most AWS services (API Gateway, Lambda Function URLs, AppSync, IAM, OpenSearch) can be locked behind IAM authentication. Once they are, an unsigned request is rejected with `403 Forbidden`, because every request must carry an `Authorization` header derived from your credentials, the request itself, and the current time. However, you may not want to:

- **Adopt a service-specific SDK client**: pulling in `@aws-sdk/client-*` just to call your own HTTP endpoint is a lot of dependency for one request
- **Hand-roll the signature**: SigV4 covers the method, URL, query string, headers and body, and getting the canonical form wrong fails with an opaque `403`
- **Change HTTP client**: you already use Axios, Ky, Got or `node:https`, and signing should not dictate that choice

This library computes the signature and gives you back plain headers, leaving the transport entirely up to you.

> [!TIP]
> Using the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API? Use [`aws-sigv4-fetch`](https://github.com/zirkelc/aws-signature-v4/tree/main/packages/aws-sigv4-fetch), which wraps this library in a drop-in `fetch` replacement that signs every request for you.

## Installation

```bash
npm install aws-sigv4-sign
```

Requires Node.js >= 20. Ships both ES Module and CommonJS builds with bundled TypeScript declarations, so no `@types/*` package is needed.

```ts
// ESM
import { signRequest } from 'aws-sigv4-sign';

// CommonJS
const { signRequest } = require('aws-sigv4-sign');
```

## Usage

`signRequest` mirrors the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) argument shape and appends a required options object. The input can be a `string`, a [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) or a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), with an optional [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) in between.

```ts
import { signRequest } from 'aws-sigv4-sign';

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  service: 'lambda',
  region: 'eu-west-1',
});

const response = await fetch(signedRequest);
```

### Reading the signed headers

The returned `Request` carries the signing headers on its [`headers`](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers) property. Convert them to a plain object to pass them to a client that does not accept a `Request`.

```ts
const signedRequest = await signRequest(url, { service: 'lambda', region: 'eu-west-1' });

const headers = Object.fromEntries(signedRequest.headers.entries());

headers.authorization; // AWS4-HMAC-SHA256 Credential=.../20250101/eu-west-1/lambda/aws4_request, SignedHeaders=..., Signature=...
headers.host; // mylambda.lambda-url.eu-west-1.on.aws
headers['x-amz-date']; // 20250101T000000Z
headers['x-amz-content-sha256']; // hex-encoded SHA-256 of the body
headers['x-amz-security-token']; // only when the credentials include a session token
```

### Sending with any HTTP client

Every client works the same way: sign, read the headers, send. Pass `signedRequest.url` rather than the original input, so the URL that was signed is the URL that is sent.

```ts
const signedRequest = await signRequest(url, { service: 'lambda', region: 'eu-west-1' });
const headers = Object.fromEntries(signedRequest.headers.entries());

// Axios
import axios from 'axios';
await axios(signedRequest.url, { headers });

// Ky
import ky from 'ky';
await ky.get(signedRequest.url, { headers });

// Got
import got from 'got';
await got(signedRequest.url, { headers });

// node:https
import { request } from 'node:https';
request(signedRequest.url, { headers }, (res) => {
  /* ... */
}).end();
```

### Sending a body

The body is part of the signature, so it has to be passed to `signRequest` in the `RequestInit` and sent unchanged. With a body, the options move to the third argument.

```ts
const signedRequest = await signRequest(
  'https://mylambda.lambda-url.eu-west-1.on.aws/',
  {
    method: 'POST',
    body: JSON.stringify({ a: 1 }),
    headers: { 'Content-Type': 'application/json' },
  },
  { service: 'lambda', region: 'eu-west-1' },
);
```

### Service and region

`service` is required and must match the AWS service you are calling. A mismatch fails with `Credential should be scoped to correct service: 'service'`. `region` is optional and defaults to `us-east-1`.

Common values:

| Target                           | `service`     |
| -------------------------------- | ------------- |
| API Gateway (REST and HTTP APIs) | `execute-api` |
| Lambda Function URL              | `lambda`      |
| AppSync                          | `appsync`     |
| IAM                              | `iam`         |
| OpenSearch / Elasticsearch       | `es`          |
| S3                               | `s3`          |

### Credentials

Credentials are **optional in Node.js** and **required in the browser**. When omitted in Node.js they are resolved with [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node), which checks, in order: environment variables, SSO token cache, web identity tokens, shared credentials and config files, and finally the EC2/ECS instance metadata service.

```ts
// Credentials are picked up from the environment
const signedRequest = await signRequest(url, { service: 'lambda', region: 'eu-west-1' });
```

> [!IMPORTANT]
> The default provider is constructed once and reused for the lifetime of the process. The AWS SDK caches the credentials it resolves and refreshes them before they expire, so only the first signed request pays for the lookup. Because the provider is pinned, changes to `AWS_PROFILE` or the other credential environment variables after the first signed request are not picked up; pass `credentials` explicitly if you need to switch identities at runtime.

You can always pass credentials explicitly, which skips the lookup. The option accepts either a static [`AwsCredentialIdentity`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentity/) or an [`AwsCredentialIdentityProvider`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentityProvider/) function:

```ts
const signedRequest = await signRequest(url, {
  service: 'lambda',
  region: 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    // sessionToken: only for temporary credentials, adds the x-amz-security-token header
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});
```

In the browser there is no environment to resolve from, so omitting `credentials` throws. Use temporary, scoped credentials from Amazon Cognito or a web federated identity provider via [`@aws-sdk/credential-providers`](https://www.npmjs.com/package/@aws-sdk/credential-providers):

```ts
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const signedRequest = await signRequest(url, {
  service: 'execute-api',
  region: 'eu-west-1',
  credentials: fromCognitoIdentityPool({
    identityPoolId: 'eu-west-1:...',
    clientConfig: { region: 'eu-west-1' },
  }),
});
```

> [!WARNING]
> Never hardcode AWS credentials in a browser application. Doing so exposes your access key ID and secret access key to anyone who loads the page.

## Advanced

### Sign last

> [!IMPORTANT]
> The signature covers the method, URL, query string, headers and body. Anything you change after signing invalidates it and the request fails with `403 Forbidden`. In particular, do not add headers or query parameters to the request after calling `signRequest`, and send `signedRequest.url` rather than the URL you started with.

### Browser bundles

The Node-only credential provider is loaded through a dynamic import, and this package maps it to `false` in its `browser` field, so bundlers leave it out of browser builds entirely. This is why credentials must be explicit in the browser.

## API

### `signRequest(input, options)`

```ts
function signRequest(input: string | Request | URL, options: SignRequestOptions): Promise<Request>;
function signRequest(input: string | Request | URL, init: RequestInit, options: SignRequestOptions): Promise<Request>;
```

Returns a new `Request` with the SigV4 headers applied. The `host` header is always set from the URL, because SigV4 requires it. Two overloads: pass `options` second when there is no `RequestInit`, third when there is.

```ts
await signRequest(url, { service: 'lambda' });
await signRequest(url, { method: 'POST', body: '{}' }, { service: 'lambda' });
```

### `parseRequest(input, init?)`

```ts
function parseRequest(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{
  url: URL;
  method: string;
  headers: Record<string, string>;
  body?: ArrayBuffer;
}>;
```

Normalizes the `fetch`-style arguments into their parts, with header names lowercased and the body read into an `ArrayBuffer`. Values in `init` override those on a `Request` input. `signRequest` uses this internally; it is exported for callers that need the normalized request without signing it.

```ts
const { url, method, headers } = await parseRequest(url, { method: 'POST' });
```

### `getDefaultCredentialProvider()`

```ts
function getDefaultCredentialProvider(): Promise<AwsCredentialIdentityProvider>;
```

Returns the default provider from [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node), constructed once and reused for the lifetime of the process. Rejects in browser environments, where credentials must be explicit. This is what `signRequest` calls when `credentials` is omitted; you rarely need it directly.

```ts
const provider = await getDefaultCredentialProvider();
const credentials = await provider();
```

## Types

### `SignRequestOptions`

The options object accepted by `signRequest`.

```ts
import type { SignRequestOptions } from 'aws-sigv4-sign';

type SignRequestOptions = {
  service: string; // required, e.g. 'lambda' or 'execute-api'
  region?: string; // default: 'us-east-1'
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider; // default: resolved from the environment in Node.js
};
```

## License

MIT
