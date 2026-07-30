<div align="center">

<h1>AWS SigV4</h1>

<p align="center">Sign HTTP requests to AWS with the official AWS SDK signer</p>
<p align="center">
  <a href="https://www.npmjs.com/package/aws-sigv4-fetch" alt="aws-sigv4-fetch"><img src="https://img.shields.io/npm/dt/aws-sigv4-fetch?label=aws-sigv4-fetch"></a> <a href="https://www.npmjs.com/package/aws-sigv4-sign" alt="aws-sigv4-sign"><img src="https://img.shields.io/npm/dt/aws-sigv4-sign?label=aws-sigv4-sign"></a> <a href="https://github.com/zirkelc/aws-signature-v4/actions/workflows/ci.yml" alt="CI"><img src="https://img.shields.io/github/actions/workflow/status/zirkelc/aws-signature-v4/ci.yml?branch=main"></a>
</p>

</div>

Two libraries for signing HTTP requests with [AWS Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html): [`aws-sigv4-fetch`](./packages/aws-sigv4-fetch) wraps the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API, and [`aws-sigv4-sign`](./packages/aws-sigv4-sign) returns a signed [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) for any other HTTP client. Both are thin wrappers around [`@smithy/signature-v4`](https://www.npmjs.com/package/@smithy/signature-v4), the same signer the AWS SDK uses, so signatures are computed exactly the way AWS expects.

## Why?

Most AWS services (API Gateway, Lambda Function URLs, AppSync, IAM, OpenSearch) can be locked behind IAM authentication. Once they are, an unsigned request is rejected with `403 Forbidden`, because every request must carry an `Authorization` header derived from your credentials, the request itself, and the current time. However, you may not want to:

- **Adopt a service-specific SDK client**: pulling in `@aws-sdk/client-*` just to call your own HTTP endpoint is a lot of dependency for one request
- **Hand-roll the signature**: SigV4 covers the method, URL, query string, headers and body, and getting the canonical form wrong fails with an opaque `403`
- **Change HTTP client**: signing should not dictate whether you use `fetch`, Axios, Ky, Got or `node:https`

These libraries do the signing and nothing else, leaving the transport to you.

## Which Package?

|                 | [`aws-sigv4-fetch`](./packages/aws-sigv4-fetch)                     | [`aws-sigv4-sign`](./packages/aws-sigv4-sign)              |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Gives you**   | `createSignedFetcher()`, a drop-in `fetch` that signs every request | `signRequest()`, returning a `Request` with signed headers |
| **Use it when** | You call `fetch`, or use a library that accepts a custom `fetch`    | You use Axios, Ky, Got, `node:https` or anything else      |
| **You handle**  | Nothing, it is a `fetch` replacement                                | Reading the headers off and sending the request            |

If you use `fetch`, reach for `aws-sigv4-fetch`. It depends on `aws-sigv4-sign` internally, so there is no reason to install both.

## Installation

```bash
npm install aws-sigv4-fetch   # if you use fetch
npm install aws-sigv4-sign    # if you use any other HTTP client
```

Both require Node.js >= 20, ship ES Module and CommonJS builds, and bundle their TypeScript declarations, so no `@types/*` package is needed.

```ts
// ESM
import { createSignedFetcher } from 'aws-sigv4-fetch';

// CommonJS
const { createSignedFetcher } = require('aws-sigv4-fetch');
```

## How It Works

Signing derives a signature from the request's method, URL, query string, headers and body, and sends it in an `Authorization` header. Because the signature covers the request, it cannot be replayed against a different endpoint or with a modified body.

> Signature Version 4 (SigV4) is the process to add authentication information to AWS API requests sent by HTTP. For security, most requests to AWS must be signed with an access key.

— [AWS documentation on the Signature Version 4 signing process](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)

A signed request carries these headers:

```
authorization:         AWS4-HMAC-SHA256 Credential=.../20250101/eu-west-1/lambda/aws4_request, SignedHeaders=host;x-amz-date;..., Signature=...
host:                  mylambda.lambda-url.eu-west-1.on.aws
x-amz-date:            20250101T000000Z
x-amz-content-sha256:  ...
x-amz-security-token:  ...   # only when the credentials include a session token
```

## Usage

### With `fetch`

`createSignedFetcher` takes the signing configuration once and returns a `fetch` function with the identical signature, so it is a drop-in replacement.

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';

const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });

const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  method: 'POST',
  body: JSON.stringify({ a: 1 }),
  headers: { 'Content-Type': 'application/json' },
});
```

Any library that accepts a custom `fetch` is signed without further glue, for example [`graphql-request`](https://www.npmjs.com/package/graphql-request):

```ts
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://mygraphqlapi.appsync-api.eu-west-1.amazonaws.com/graphql', {
  fetch: createSignedFetcher({ service: 'appsync', region: 'eu-west-1' }),
});
```

### With any other HTTP client

`signRequest` mirrors the `fetch` argument shape and appends a required options object. Read the headers off the returned `Request` and send them with your client, using `signedRequest.url` so the URL that was signed is the URL that is sent.

```ts
import { signRequest } from 'aws-sigv4-sign';

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  service: 'lambda',
  region: 'eu-west-1',
});

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

When there is a body, it must be signed too, so it goes in the `RequestInit` and the options move to the third argument:

```ts
const signedRequest = await signRequest(
  'https://mylambda.lambda-url.eu-west-1.on.aws/',
  { method: 'POST', body: JSON.stringify({ a: 1 }), headers: { 'Content-Type': 'application/json' } },
  { service: 'lambda', region: 'eu-west-1' },
);
```

### Service and region

`service` is required and must match the AWS service you are calling. A mismatch fails with `Credential should be scoped to correct service: 'service'`, and this is the most common cause of signing problems. `region` is optional and defaults to `us-east-1`.

| Target                           | `service`     |
| -------------------------------- | ------------- |
| API Gateway (REST and HTTP APIs) | `execute-api` |
| Lambda Function URL              | `lambda`      |
| AppSync                          | `appsync`     |
| IAM                              | `iam`         |
| OpenSearch / Elasticsearch       | `es`          |
| S3                               | `s3`          |

### Credentials

Credentials consist of an `accessKeyId`, a `secretAccessKey`, and optionally a `sessionToken` for temporary credentials. They are **optional in Node.js** and **required in the browser**.

When omitted in Node.js they are resolved with [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node), which checks, in order: environment variables, SSO token cache, web identity tokens, shared credentials and config files, and finally the EC2/ECS instance metadata service.

```ts
// Credentials are picked up from the environment
const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });
```

> [!IMPORTANT]
> The default provider is constructed once and reused for the lifetime of the process. The AWS SDK caches the credentials it resolves and refreshes them before they expire, so only the first signed request pays for the lookup. Because the provider is pinned, changes to `AWS_PROFILE` or the other credential environment variables after the first signed request are not picked up; pass `credentials` explicitly if you need to switch identities at runtime.

You can always pass credentials explicitly, which skips the lookup. The option accepts either a static [`AwsCredentialIdentity`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentity/) or an [`AwsCredentialIdentityProvider`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentityProvider/) function:

```ts
const signedFetch = createSignedFetcher({
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

const signedFetch = createSignedFetcher({
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

### Custom `fetch`

`aws-sigv4-fetch` only. The `fetch` option defaults to the global `fetch`, available natively in Node.js >= 20. Pass your own implementation when the global is missing or when you want the instrumented `fetch` your application already uses.

```ts
import ponyfill from 'cross-fetch';

const signedFetch = createSignedFetcher({
  service: 'lambda',
  region: 'eu-west-1',
  // fetch: defaults to the global fetch
  fetch: ponyfill,
});
```

## Advanced

### Sign last

> [!IMPORTANT]
> The signature covers the method, URL, query string, headers and body. Anything you change after signing invalidates it and the request fails with `403 Forbidden`. Pass the full `RequestInit` when signing rather than mutating the request afterwards, and send `signedRequest.url` rather than the URL you started with.

Custom headers are therefore part of the signature, while an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is passed straight through:

```ts
const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  headers: { 'X-Custom-Header': 'value' },
  signal: AbortSignal.timeout(5_000),
});
```

### Browsers

Both libraries work in the browser, provided credentials are passed explicitly. The Node-only credential provider is loaded through a dynamic import, and `aws-sigv4-sign` maps it to `false` in its `browser` field, so bundlers leave it out of browser builds entirely.

## API

### `createSignedFetcher(options)`

From [`aws-sigv4-fetch`](./packages/aws-sigv4-fetch).

```ts
function createSignedFetcher(options: SignedFetcherOptions): typeof fetch;

type SignedFetcherOptions = {
  service: string; // required, e.g. 'lambda' or 'execute-api'
  region?: string; // default: 'us-east-1'
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider; // default: resolved from the environment in Node.js
  fetch?: typeof fetch; // default: the global fetch
};
```

Returns a `fetch` function that signs every request. Configuration is captured once when the fetcher is created; the returned function takes only `fetch`'s own arguments. Also exports the `CreateSignedFetcher` type, which is the type of the factory itself.

### `signRequest(input, options)`

From [`aws-sigv4-sign`](./packages/aws-sigv4-sign).

```ts
function signRequest(input: string | Request | URL, options: SignRequestOptions): Promise<Request>;
function signRequest(input: string | Request | URL, init: RequestInit, options: SignRequestOptions): Promise<Request>;

type SignRequestOptions = {
  service: string; // required, e.g. 'lambda' or 'execute-api'
  region?: string; // default: 'us-east-1'
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider; // default: resolved from the environment in Node.js
};
```

Returns a new `Request` with the SigV4 headers applied. The `host` header is always set from the URL, because SigV4 requires it. Pass `options` second when there is no `RequestInit`, third when there is.

### `parseRequest(input, init?)`

From [`aws-sigv4-sign`](./packages/aws-sigv4-sign).

```ts
function parseRequest(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{ url: URL; method: string; headers: Record<string, string>; body?: ArrayBuffer }>;
```

Normalizes `fetch`-style arguments into their parts, with header names lowercased and the body read into an `ArrayBuffer`. Values in `init` override those on a `Request` input. Used internally by `signRequest`, exported for callers that need the normalized request without signing it.

### `getDefaultCredentialProvider()`

From [`aws-sigv4-sign`](./packages/aws-sigv4-sign).

```ts
function getDefaultCredentialProvider(): Promise<AwsCredentialIdentityProvider>;
```

Returns the default provider from [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node), constructed once and reused for the lifetime of the process. Rejects in browser environments. This is what `signRequest` calls when `credentials` is omitted; you rarely need it directly.

## Development

This is a pnpm monorepo:

```
packages/aws-sigv4-sign     # signRequest()
packages/aws-sigv4-fetch    # createSignedFetcher(), built on aws-sigv4-sign
test/http                   # end-to-end tests for fetch, Axios, Got and node:https
test/browser                # end-to-end tests in a browser-like environment
test/aws                    # CDK stacks (API Gateway, Lambda Function URL) and their tests
```

```bash
pnpm install
pnpm build        # bundle both packages and validate the published types
pnpm typecheck
pnpm lint         # oxlint --fix
pnpm format       # oxfmt --write
pnpm test:unit
pnpm test:e2e     # signs real requests against AWS; requires credentials
```

The published packages run on Node >= 20, but building them needs Node >= 22, because that is what the bundler (`tsdown`) and pnpm 11 require. The unit tests run against the TypeScript sources, so they execute on every supported Node version without a build.

The end-to-end suite signs real requests against AWS: an API Gateway REST API and a Lambda Function URL (both with IAM authentication, deployed from `test/aws`), and the IAM API. It runs across `fetch`, Axios, Got and `node:https`, and in a browser-like environment, so that a broken signature is caught against the real service rather than a mock.

## License

MIT
