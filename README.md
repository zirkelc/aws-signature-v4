[![CI](https://github.com/zirkelc/aws-sigv4/actions/workflows/ci.yml/badge.svg)](https://github.com/zirkelc/aws-sigv4/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/dt/aws-sigv4-fetch?label=aws-sigv4-fetch)](https://www.npmjs.com/package/aws-sigv4-fetch)
[![npm](https://img.shields.io/npm/dt/aws-sigv4-sign?label=aws-sigv4-sign)](https://www.npmjs.com/package/aws-sigv4-sign)

# AWS SigV4 libraries

Sign HTTP requests to AWS with [Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html), using the official AWS SDK signer under the hood.

Most AWS services (API Gateway, Lambda Function URLs, AppSync, IAM, OpenSearch, …) can be locked down with IAM authentication. Once they are, a plain HTTP request is rejected with `403 Forbidden`: every request has to carry an `Authorization` header derived from your AWS credentials, the request itself, and the current time. These libraries do that signing for you, without forcing you to adopt a service-specific AWS SDK client.

This repository contains two packages:

| Package                                                   | What it gives you                                                                  | Use it when                                                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`aws-sigv4-fetch`](./packages/aws-sigv4-fetch/README.md) | `createSignedFetcher()` — a drop-in `fetch` that signs every request automatically | You use the `fetch` API (or any library that accepts a custom `fetch`, like `graphql-request`) |
| [`aws-sigv4-sign`](./packages/aws-sigv4-sign/README.md)   | `signRequest()` — returns a `Request` with the signed headers                      | You use Axios, Ky, Got, `node:https`, or any other HTTP client                                 |

Both are thin wrappers around [`@smithy/signature-v4`](https://www.npmjs.com/package/@smithy/signature-v4), the same signer the AWS SDK itself uses, so signatures are computed exactly the way AWS expects.

## What is Signature Version 4?

> Signature Version 4 (SigV4) is the process to add authentication information to AWS API requests sent by HTTP. For security, most requests to AWS must be signed with an access key. The access key consists of an access key ID and secret access key, which are commonly referred to as your security credentials.

— [AWS documentation on the Signature Version 4 signing process](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)

Signing means deriving a signature from the request's method, URL, query string, headers and body, and sending it along in an `Authorization` header. Because the signature covers the request, it cannot be replayed against a different endpoint or with a modified body. A signed request carries these headers:

```
authorization:         AWS4-HMAC-SHA256 Credential=.../20250101/us-east-1/lambda/aws4_request, SignedHeaders=host;x-amz-date;..., Signature=...
host:                  mylambda.lambda-url.eu-west-1.on.aws
x-amz-date:            20250101T000000Z
x-amz-content-sha256:  ...
x-amz-security-token:  ...   # only when the credentials include a session token
```

## Which library should I use?

### Are you using the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API?

Install [`aws-sigv4-fetch`](./packages/aws-sigv4-fetch/README.md) and create a signed `fetch` function. It has the same signature as the native `fetch`, so it is a drop-in replacement:

```sh
npm install aws-sigv4-fetch
```

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';

const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });

const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/');
```

### Are you using [`Axios`](https://github.com/axios/axios), [`Ky`](https://github.com/sindresorhus/ky), [`Got`](https://github.com/sindresorhus/got), [`node:https`](https://nodejs.org/api/https.html) or any other HTTP library?

Install [`aws-sigv4-sign`](./packages/aws-sigv4-sign/README.md) and sign the request to get back a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object. Its headers can be handed to any HTTP client:

```sh
npm install aws-sigv4-sign
```

```ts
import { signRequest } from 'aws-sigv4-sign';

const url = 'https://mylambda.lambda-url.eu-west-1.on.aws/';

const signedRequest = await signRequest(url, { service: 'lambda', region: 'eu-west-1' });

// Convert the signed headers to a plain object
const headers = Object.fromEntries(signedRequest.headers.entries());

// Axios
import axios from 'axios';
const response = await axios(url, { headers });

// Ky
import ky from 'ky';
const response = await ky.get(url, { headers });

// Got
import got from 'got';
const response = await got(url, { headers });
```

## Options

Both `createSignedFetcher` and `signRequest` accept the same core options:

| Option        | Type                                                                                                                                                                                                                                                                                                 | Default                                  | Description                                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `service`     | `string`                                                                                                                                                                                                                                                                                             | **required**                             | The AWS service you are signing for, for example `execute-api`, `lambda`, `appsync` or `iam`. It must match the target service, otherwise AWS rejects the request with `Credential should be scoped to correct service`. |
| `region`      | `string`                                                                                                                                                                                                                                                                                             | `us-east-1`                              | The AWS region of the target. Global services such as IAM are always signed for `us-east-1`.                                                                                                                             |
| `credentials` | [`AwsCredentialIdentity`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentity/) \| [`AwsCredentialIdentityProvider`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-smithy-types/Interface/AwsCredentialIdentityProvider/) | resolved from the environment in Node.js | Optional in Node.js, **required in the browser**. See [Credentials](#credentials).                                                                                                                                       |
| `fetch`       | `typeof fetch`                                                                                                                                                                                                                                                                                       | global `fetch`                           | `aws-sigv4-fetch` only. Supply your own `fetch` implementation (or a polyfill) instead of the global one.                                                                                                                |

Picking the right `service` and `region` is where most signing problems come from. Some common values:

| Target                           | `service`     |
| -------------------------------- | ------------- |
| API Gateway (REST and HTTP APIs) | `execute-api` |
| Lambda Function URL              | `lambda`      |
| AppSync                          | `appsync`     |
| IAM                              | `iam`         |
| OpenSearch / Elasticsearch       | `es`          |
| S3                               | `s3`          |

## Credentials

Credentials consist of an `accessKeyId`, a `secretAccessKey`, and optionally a `sessionToken` for temporary credentials.

### Node.js

Credentials are **optional**. When omitted, they are resolved from the environment with [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node), which checks, in order: environment variables, SSO token cache, web identity tokens, shared credentials and config files, and finally the EC2/ECS instance metadata service.

```ts
// Credentials are picked up from the environment
const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });
```

You can always pass them explicitly, which skips the lookup:

```ts
const signedFetch = createSignedFetcher({
  service: 'lambda',
  region: 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});
```

### Browser

Credentials are **required** and must be passed explicitly: there is no environment to resolve them from, and both libraries throw if you omit them.

> [!WARNING]
> Never hardcode AWS credentials in a browser application. Use temporary, scoped credentials from Amazon Cognito or a web federated identity provider via [`@aws-sdk/credential-providers`](https://www.npmjs.com/package/@aws-sdk/credential-providers).

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

## Examples

### API Gateway

```ts
const signedFetch = createSignedFetcher({ service: 'execute-api', region: 'eu-west-1' });

const response = await signedFetch('https://myapi.execute-api.eu-west-1.amazonaws.com/my-stage/my-resource');
```

### Lambda Function URL

```ts
const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });

const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  method: 'POST',
  body: JSON.stringify({ a: 1 }),
  headers: { 'Content-Type': 'application/json' },
});
```

The body is part of the signature, so it has to be passed to the signed `fetch` and not added afterwards.

### AppSync

```ts
const signedFetch = createSignedFetcher({ service: 'appsync', region: 'eu-west-1' });

const response = await signedFetch('https://mygraphqlapi.appsync-api.eu-west-1.amazonaws.com/graphql', {
  method: 'POST',
  body: JSON.stringify({ query, variables }),
  headers: { 'Content-Type': 'application/json' },
});
```

### GraphQL with [`graphql-request`](https://www.npmjs.com/package/graphql-request)

Any client that lets you swap in a custom `fetch` works without further glue. Pass the signed fetcher to the `fetch` option of `GraphQLClient` and every query is signed:

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';
import { GraphQLClient } from 'graphql-request';

const query = `
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
      id
      name
    }
  }
`;

const client = new GraphQLClient('https://mygraphqlapi.appsync-api.eu-west-1.amazonaws.com/graphql', {
  fetch: createSignedFetcher({ service: 'appsync', region: 'eu-west-1' }),
});

const result = await client.request(query, { input: { name: 'Item' } });
```

### Custom headers and cancellation

The signed fetcher accepts everything the native `fetch` does. Custom headers are included in the signature, and an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is passed straight through:

```ts
const response = await signedFetch(url, {
  headers: { 'X-Custom-Header': 'value' },
  signal: AbortSignal.timeout(5_000),
});
```

### Signing for a client that is not `fetch`

`signRequest` accepts the same arguments as `fetch` and returns a signed `Request`. Read the headers off it and pass them to your client of choice:

```ts
import { signRequest } from 'aws-sigv4-sign';
import { request } from 'node:https';

const signedRequest = await signRequest(
  'https://mylambda.lambda-url.eu-west-1.on.aws/',
  { method: 'POST', body: JSON.stringify({ a: 1 }), headers: { 'Content-Type': 'application/json' } },
  { service: 'lambda', region: 'eu-west-1' },
);

const headers = Object.fromEntries(signedRequest.headers.entries());

const req = request(signedRequest.url, { method: 'POST', headers }, (res) => {
  /* ... */
});
```

> [!IMPORTANT]
> The signature covers the method, URL, query string, headers and body. If you change any of them after signing, the request fails with `403 Forbidden`. Sign last.

## Compatibility

- **Node.js >= 20.** Older versions are not supported, because `@aws-sdk/credential-provider-node` requires Node 20 or newer.
- **Browsers**, provided credentials are passed explicitly. The Node-only credential provider is excluded from browser bundles via the `browser` field, so it is not bundled into your app.
- **ESM and CommonJS.** Both packages ship both, so `import` and `require` work.
- **TypeScript**: type declarations are bundled, and no `@types/*` package is needed.

## Development

This is a pnpm monorepo:

```
packages/aws-sigv4-sign     # signRequest()
packages/aws-sigv4-fetch    # createSignedFetcher(), built on aws-sigv4-sign
test/http                   # end-to-end tests for fetch, Axios, Got and node:https
test/browser                # end-to-end tests in a browser-like environment
test/aws                    # CDK stacks (API Gateway, Lambda Function URL) and their tests
```

```sh
pnpm install
pnpm build        # bundle both packages and validate the published types
pnpm typecheck
pnpm lint         # oxlint --fix
pnpm format       # oxfmt --write
pnpm test:unit
pnpm test:e2e     # signs real requests against AWS; requires credentials
```

The published packages run on Node >= 20, but building them needs Node >= 22, because that is what the bundler (`tsdown`) requires. The tests run against the TypeScript sources, so `pnpm test:unit` works on every supported Node version without a build.

The end-to-end suite signs real requests against AWS: an API Gateway REST API and a Lambda Function URL (both with IAM authentication, deployed from `test/aws`), and the IAM API. It runs across `fetch`, Axios, Got and `node:https`, and in a browser-like environment, so that a broken signature is caught against the real service rather than a mock.

## License

MIT
