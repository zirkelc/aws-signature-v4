[![CI](https://github.com/zirkelc/aws-sigv4/actions/workflows/ci.yml/badge.svg)](https://github.com/zirkelc/aws-sigv4/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/dt/aws-sigv4-fetch?label=aws-sigv4-fetch)](https://www.npmjs.com/package/aws-sigv4-fetch)
[![npm](https://img.shields.io/npm/dt/aws-sigv4-sign?label=aws-sigv4-sign)](https://www.npmjs.com/package/aws-sigv4-sign)

# AWS SigV4 libraries

This repository contains two libraries to sign HTTP requests with AWS Signature Version 4 (SigV4):

- [`aws-sigv4-fetch`](./packages/aws-sigv4-fetch/README.md) creates a `fetch` function to automatically sign HTTP requests.
- [`aws-sigv4-sign`](./packages/aws-sigv4-sign/README.md) creates a `Request` object with signed headers that can be used with any other HTTP library.

## What is Signature Version 4?
> Signature Version 4 (SigV4) is the process to add authentication information to AWS API requests sent by HTTP. For security, most requests to AWS must be signed with an access key. The access key consists of an access key ID and secret access key, which are commonly referred to as your security credentials

[AWS documentation on Signature Version 4 signing process](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)

## Which library should I use?

### Are you using the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API?

Install the `aws-sigv4-fetch` package and use the `createSignedFetcher` function to create a signed [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function:

```ts
import { createSignedFetcher } from 'aws-sigv4-fetch';

const signedFetch = createSignedFetcher({ service: 'lambda', region: 'eu-west-1' });

const response = await signedFetch('https://mylambda.lambda-url.eu-west-1.on.aws/');
```

### Are you using [`Axios`](https://github.com/axios/axios), [`Ky`](https://github.com/sindresorhus/ky), [`Got`](https://github.com/sindresorhus/got), [`node:http`](https://nodejs.org/api/https.html) or any other HTTP library?

Install the `aws-sigv4-sign` package and use the `signRequest` function to create a signed [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object:

```ts
import { signRequest } from 'aws-sigv4-sign';

const url = 'https://mylambda.lambda-url.eu-west-1.on.aws/';

const signedRequest = await signRequest(url, {
  service: 'lambda',
  region: 'eu-west-1'
});

// Convert headers to a plain object
const headers = Object.fromEntries(signedRequest.headers.entries());

// Axios
import axios from "axios";
const response = await axios(url, { headers });

// Ky
import ky from "ky";
const response = await ky.get(url, { headers });

// Got
import got from "got";
const response = await got(url, { headers });
```

### Are you using [`graphql-request`](https://www.npmjs.com/package/graphql-request)?

Install the `aws-sigv4-fetch` package and use the `createSignedFetcher` function to create a signed [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function and pass it to the [`fetch`](https://github.com/graffle-js/graffle/blob/b732f4595b2619cc0f0c23e69e8316f37e29713b/src/legacy/helpers/types.ts#L63-L71) option of the [`GraphQLClient`](https://github.com/graffle-js/graffle/blob/b732f4595b2619cc0f0c23e69e8316f37e29713b/src/legacy/classes/GraphQLClient.ts#L20-L21):

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

## Usage

Go to the docs of [aws-sigv4-fetch](./packages/aws-sigv4-fetch/README.md) or [aws-sigv4-sign](./packages/aws-sigv4-sign/README.md) for more information.

## License
MIT
