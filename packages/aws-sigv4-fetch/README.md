<div align="center">

<h1>aws-sigv4-fetch</h1>

<p align="center">SignatureV4 fetch function implemented with the official AWS SDK</p>
<p align="center">
  <a href="https://www.npmjs.com/package/aws-sigv4-fetch" alt="aws-sigv4-fetch"><img src="https://img.shields.io/npm/dt/aws-sigv4-fetch?label=aws-sigv4-fetch"></a> <a href="https://github.com/zirkelc/aws-signature-v4/actions/workflows/ci.yml" alt="CI"><img src="https://img.shields.io/github/actions/workflow/status/zirkelc/aws-signature-v4/ci.yml?branch=main"></a>
</p>

</div>

This library wraps the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API so every request is signed with [AWS Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html). Signing is done by [`@smithy/signature-v4`](https://www.npmjs.com/package/@smithy/signature-v4), the same signer the AWS SDK uses, so signatures are computed exactly the way AWS expects.

## Why?

Most AWS services (API Gateway, Lambda Function URLs, AppSync, IAM, OpenSearch) can be locked behind IAM authentication. Once they are, a plain `fetch` is rejected with `403 Forbidden`, because every request must carry an `Authorization` header derived from your credentials, the request itself, and the current time. However, you may not want to:

- **Adopt a service-specific SDK client**: pulling in `@aws-sdk/client-*` just to call your own HTTP endpoint is a lot of dependency for one request
- **Hand-roll the signature**: SigV4 covers the method, URL, query string, headers and body, and getting the canonical form wrong fails with an opaque `403`
- **Rewrite your HTTP layer**: your code already calls `fetch`, and it should keep doing so

This library gives you a `fetch` function with the identical signature, so signing becomes a drop-in replacement.

> [!TIP]
> Using Axios, Ky, Got or another HTTP library instead? Use [`aws-sigv4-sign`](https://github.com/zirkelc/aws-signature-v4/tree/main/packages/aws-sigv4-sign), which returns a signed `Request` whose headers you can hand to any client.

## Installation

```bash
npm install aws-sigv4-fetch
```

Requires Node.js >= 20. Ships both ES Module and CommonJS builds with bundled TypeScript declarations, so no `@types/*` package is needed.

```ts
// ESM
import { createSignedFetcher } from 'aws-sigv4-fetch';

// CommonJS
const { createSignedFetcher } = require('aws-sigv4-fetch');
```

## Usage

`createSignedFetcher` takes the signing configuration once and returns a `fetch` function. The returned function has the same signature as the native `fetch`, so it accepts a `string`, a [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) or a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), plus an optional [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit).

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';

const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });

const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  method: 'POST',
  body: JSON.stringify({ a: 1 }),
  headers: { 'Content-Type': 'application/json' },
});
```

### Service and region

`service` is required and must match the AWS service you are calling. A mismatch fails with `Credential should be scoped to correct service: 'service'`. `region` is optional and defaults to `us-east-1`.

```ts
const signedFetch = createSignedFetcher({
  // service: must match the target, this is the most common source of 403s
  service: 'execute-api',
  // region: defaults to 'us-east-1'; global services like IAM are always signed for us-east-1
  region: 'eu-west-1',
});
```

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

`fetch` is optional and defaults to the global `fetch`, which is available natively in Node.js >= 20. Pass your own implementation when the global is missing or when you want the same instrumented `fetch` your application already uses.

```ts
import ponyfill from 'cross-fetch';

const signedFetch = createSignedFetcher({
  service: 'lambda',
  region: 'eu-west-1',
  // fetch: defaults to the global fetch
  fetch: ponyfill,
});
```

A global polyfill works too, in which case the option can be omitted entirely:

```ts
import 'cross-fetch/polyfill';

// fetch is now global, so it does not need to be passed
const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });
```

### Any client that accepts a `fetch`

Because the returned function is signature-compatible with `fetch`, any library that lets you swap in a custom `fetch` is signed without further glue. For example [`graphql-request`](https://www.npmjs.com/package/graphql-request):

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://mygraphqlapi.appsync-api.eu-west-1.amazonaws.com/graphql', {
  fetch: createSignedFetcher({ service: 'appsync', region: 'eu-west-1' }),
});

const result = await client.request(query, { input: { name: 'Item' } });
```

## Advanced

### Everything must be set before signing

> [!IMPORTANT]
> The signature covers the method, URL, query string, headers and body. Anything you change after signing invalidates it and the request fails with `403 Forbidden`. Pass the full `RequestInit` to the signed fetcher rather than mutating the request afterwards.

Custom headers are therefore part of the signature, while an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is passed straight through to the underlying `fetch`:

```ts
const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  headers: { 'X-Custom-Header': 'value' },
  signal: AbortSignal.timeout(5_000),
});
```

### Browser bundles

The Node-only credential provider is loaded through a dynamic import, and `aws-sigv4-sign` maps it to `false` in its `browser` field, so bundlers leave it out of browser builds entirely. This is why credentials must be explicit in the browser.

## API

### `createSignedFetcher(options)`

```ts
function createSignedFetcher(options: SignedFetcherOptions): typeof fetch;
```

Returns a `fetch` function that signs every request before sending it. Configuration is captured once, when the fetcher is created; the returned function takes only `fetch`'s own arguments.

```ts
const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });

// Same call signatures as the native fetch
await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/');
await signedFetch(new URL('https://mylambda.lambda-url.eu-west-1.on.aws/'));
await signedFetch(new Request('https://mylambda.lambda-url.eu-west-1.on.aws/'));
await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/', { method: 'POST', body: '{}' });
```

## Types

### `SignedFetcherOptions`

The options bag accepted by `createSignedFetcher`.

```ts
import type { SignedFetcherOptions } from 'aws-sigv4-fetch';

type SignedFetcherOptions = {
  service: string; // required, e.g. 'lambda' or 'execute-api'
  region?: string; // default: 'us-east-1'
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider; // default: resolved from the environment in Node.js
  fetch?: typeof fetch; // default: the global fetch
};
```

### `CreateSignedFetcher`

The type of `createSignedFetcher` itself. Useful when wrapping or injecting the factory.

```ts
import type { CreateSignedFetcher } from 'aws-sigv4-fetch';

type CreateSignedFetcher = (init: SignedFetcherOptions) => typeof fetch;
```

## License

MIT
