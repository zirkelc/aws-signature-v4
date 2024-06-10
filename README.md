[![CI](https://github.com/zirkelc/aws-sigv4-fetch/actions/workflows/ci.yml/badge.svg)](https://github.com/zirkelc/aws-sigv4-fetch/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/aws-sigv4-fetch)](https://www.npmjs.com/package/aws-sigv4-fetch)
[![npm](https://img.shields.io/npm/dt/aws-sigv4-fetch)](https://www.npmjs.com/package/aws-sigv4-fetch)

# aws-sigv4-fetch
AWS SignatureV4 fetch API function to automatically sign HTTP request with given AWS credentials. Built entirely on the newest version of the official [AWS SDK for JS](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html).

## Signature Version 4
> Signature Version 4 (SigV4) is the process to add authentication information to AWS API requests sent by HTTP. For security, most requests to AWS must be signed with an access key. The access key consists of an access key ID and secret access key, which are commonly referred to as your security credentials

[AWS documentation on Signature Version 4 signing process](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)

## ⚠️ ESM Support
Since v3, this package ships with ESM and CommonJS support. That means you can `import` or `require` the package in your project.

```ts
// ESM
import { createSignedFetcher } from 'aws-sigv4-fetch';

// CommonJS
const { createSignedFetcher } = require('aws-sigv4-fetch');
```

## Install
```sh
npm install --save aws-sigv4-fetch

yard add aws-sigv4-fetch

pnpm add aws-sigv4-fetch
```

## Usage
This package exports a function `createSignedFetcher` that returns a `fetch` function to automatically sign HTTP requests with AWS Signature V4 for the given AWS service and region. The credentials can be passed to the function directly, or they will be retrieved from the environment by `defaultProvider()` from package [`@aws-sdk/credential-provider-node`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_provider_node.html).
```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';

const signedFetch = createSignedFetcher({ service: 'appsync', region: 'eu-west-1' });
const url = 'https://mygraphqlapi.appsync-api.eu-west-1.amazonaws.com/graphql';

const body = { a: 1 };

const response = await signedFetch(url, {
  method: 'post',
  body: JSON.stringify(body),
  headers: {'Content-Type': 'application/json'}
});

const data = await response.json();
```

### Sign GraphQL Requests with `graphql-request`
If you are using [`graphql-request`](https://www.npmjs.com/package/graphql-request) as GraphQL library, you can easily sign all HTTP requests. The library has `fetch`option to pass a [custom `fetch` method](https://github.com/prisma-labs/graphql-request#using-a-custom-fetch-method):

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';
import { GraphQLClient } from 'graphql-request';

const query = `
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
      id
      createdAt
      updatedAt
      name
    }
  }
`;

const variables = {
  input: {
    name,
  },
};

const client = new GraphQLClient('https://mygraphqlapi.appsync-api.eu-west-1.amazonaws.com/graphql', {
  fetch: createSignedFetcher({ service: 'appsync', region: 'eu-west-1' }),
});

const result = await client.request(query, variables);
```

### Fetch
By default, `createSignedFetcher` uses the `fetch` function from the environment. Native `fetch` is supported in Node.js >= v18. If you are running in an environment where native `fetch` is **not** available, the `fetch` function must be polyfilled or provided as an argument to `createSignedFetcher`. This allows to use the same `fetch` function that is already used in your application. There are several ways to do this:

#### Native `fetch`
If native `fetch` is available, you don't have to pass it as argument to `createSignedFetcher`.

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';

// native fetch is available and doesn't have to be passed as argument
const signedFetch = createSignedFetcher({ service: 'iam', region: 'eu-west-1' });
```

#### Polyfill `fetch`
Install a fetch package like [`cross-fetch`](https://www.npmjs.com/package/cross-fetch) and import it as [polyfill](https://en.wikipedia.org/wiki/Polyfill_(programming)). The `fetch` function will be available **globally** after importing the polyfill.

```ts
import 'cross-fetch/polyfill';
import { createSignedFetcher } from 'aws-sigv4-fetch';

// fetch was imported globally and doesn't have to be passed as argument
const signedFetch = createSignedFetcher({ service: 'iam', region: 'eu-west-1' });
```

#### Pass `fetch` as an argument
Install a fetch package like [`cross-fetch`](https://www.npmjs.com/package/cross-fetch) and import it as [ponyfill](https://github.com/sindresorhus/ponyfill). The `fetch` function will be available **locally** after importing the ponyfill. Pass the `fetch` function as an argument to `createSignedFetcher`:

```ts
import fetch from 'cross-fetch';
import { createSignedFetcher } from 'aws-sigv4-fetch';

// fetch was imported locally and must be passed as argument
const signedFetch = createSignedFetcher({ service: 'iam', region: 'eu-west-1', fetch });
```

## Resources
- [Sign GraphQL Request with AWS IAM and Signature V4](https://dev.to/zirkelc/sign-graphql-request-with-aws-iam-and-signature-v4-2il6)
- [Amplify Signing a request from Lambda](https://docs.amplify.aws/lib/graphqlapi/graphql-from-nodejs/q/platform/js/#signing-a-request-from-lambda)
- [Signing HTTP requests to Amazon OpenSearch Service](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/request-signing.html#request-signing-node)
