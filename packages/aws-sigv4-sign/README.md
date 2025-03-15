# aws-sigv4-sign
A small library for signing HTTP requests with AWS Signature Version 4 (SigV4) authentication, built with the official AWS SDK.

> [!TIP]
> If you are using the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API, consider using the [`aws-sigv4-fetch`](https://github.com/zirkelc/aws-sigv4/tree/main/packages/aws-sigv4-fetch) package to automatically sign requests.

## Install
```sh
npm install --save aws-sigv4-sign
```

## ESM and CommonJS
This package ships with ES Module and CommonJS support. That means you can `import` or `require` the package in your project depending on your module format.

```ts
// ESM
import { signRequest } from 'aws-sigv4-sign';

// CommonJS
const { signRequest } = require('aws-sigv4-sign');
```

## Usage
This package exports a `signRequest` function that returns a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object with signed headers for AWS Signature V4 (SigV4) authentication.
The function is overloaded with the same signature as the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) API and an optional `options` parameter.

```ts
import { signRequest, SignRequestOptions } from 'aws-sigv4-sign';

const options: SignRequestOptions = {
  service: 'lambda',         // required
  region: 'eu-west-1',       // optional (defaults to 'us-east-1')
  credentials: {             // optional in Node.js (defaults to credentials from environment), required in browser
    accessKeyId: '...',
    secretAccessKey: '...',
  }
};

const url = 'https://mylambda.lambda-url.eu-west-1.on.aws/';

// signRequest(input: string, options: SignRequestOptions)
const signedRequest = await signRequest(url, options);

// signRequest(input: URL, options: SignRequestOptions)
const signedRequest = await signRequest(new URL(url), options);

// signRequest(input: Request, options: SignRequestOptions)
const signedRequest = await signRequest(new Request(url), options);

// signRequest(input: string, init?: RequestInit, options: SignRequestOptions)
const signedRequest = await signRequest(url,
  {
    method: 'POST',
    body: JSON.stringify({ a: 1 }),
    headers: { 'Content-Type': 'application/json' }
  },
  options
);
```

The returned [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object contains the signed authorization [`headers`](https://developer.mozilla.org/en-US/docs/Web/API/Response/headers) with the following keys: `authorization`, `host`, `x-amz-date`, `x-amz-content-sha256`, `x-amz-security-token` (optional).

```ts
const signedRequest = await signRequest(url, options);

// Fetch the signed request
const response = await fetch(signedRequest);

// Log the signed headers from the request
console.log(signedRequest.headers.get('authorization')); // AWS4-HMAC-SHA256 Credential=.../20250101/us-east-1/lambda/aws4_request, SignedHeaders=host;x-amz-date;x-amz-content-sha256;x-amz-security-token, Signature=...
console.log(signedRequest.headers.get('host')); // mylambda.lambda-url.eu-west-1.on.aws
console.log(signedRequest.headers.get('x-amz-date')); // 20250101T000000Z
console.log(signedRequest.headers.get('x-amz-content-sha256')); // ...
console.log(signedRequest.headers.get('x-amz-security-token')); // only if credentials include a session token

// Convert the signed headers to plain object
const headers = Object.fromEntries(signedRequest.headers.entries());
console.log(headers.authorization); // AWS4-HMAC-SHA256 Credential=.../20250101/us-east-1/lambda/aws4_request, SignedHeaders=host;x-amz-date;x-amz-content-sha256;x-amz-security-token, Signature=...
```

The `headers` is a [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object and can be converted to plain object for use with other HTTP libraries.

### Options

The `signRequest` function accepts the following options:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `service` | `string` | Required | The `service` is **required** and must match the AWS service you are signing requests for. If it doesn't match, the request will fail with an error like: `Credential should be scoped to correct service: 'service'`. |
| `region` | `string` | `us-east-1` | The `region` is **optional** and defaults to `us-east-1` if not provided. Some services like IAM are global and don't require a region. |
| `credentials` | `object` | Optional in Node.js, required in browser | The `credentials` is **optional** in Node.js environments where they will be retrieved from the environment using [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node). In browser environments, credentials are **required** and must be provided explicitly. |

#### Credentials

Credential handling differs between Node.js and browser environments:

##### Node.js
In Node.js environments, credentials are **optional**. If not provided, they will be automatically loaded from the environment using [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node), which checks several sources in this order:
- Environment variables exposed via process.env
- SSO credentials from token cache
- Web identity token credentials
- Shared credentials and config ini files
- The EC2/ECS Instance Metadata Service

##### Browser
In browser environments, credentials are **required** and must be provided explicitly for security reasons. The recommended method to provide credentials is to use Amazon Cognito Identity or web federated identity providers using [`@aws-sdk/credential-providers`](https://www.npmjs.com/package/@aws-sdk/credential-providers).

> [!WARNING]
> Never hardcode AWS credentials in browser applications. Hard coding credentials poses a risk of exposing your access key ID and secret access key.

```ts
import { fromCognitoIdentity } from "@aws-sdk/credential-providers"

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', {
  service: 'lambda',
  region: 'eu-west-1',
  credentials: fromCognitoIdentity({
    // Required. The unique identifier for the identity against which credentials
    // will be issued.
    identityId: "us-east-1:128d0a74-c82f-4553-916d-90053example",
    // Optional. The ARN of the role to be assumed when multiple roles were received in the token
    // from the identity provider.
    customRoleArn: "arn:aws:iam::1234567890:role/MYAPP-CognitoIdentity",
    // Optional. A set of name-value pairs that map provider names to provider tokens.
    // Required when using identities associated with external identity providers such as Facebook.
    logins: {
      "graph.facebook.com": "FBTOKEN",
      "www.amazon.com": "AMAZONTOKEN",
      "accounts.google.com": "GOOGLETOKEN",
      "api.twitter.com": "TWITTERTOKEN'",
      "www.digits.com": "DIGITSTOKEN",
    },
    // Optional overrides. This is passed to an inner Cognito client
    // instantiated to resolve the credentials. Region and profile
    // are inherited from the upper client if present unless overridden.
    clientConfig: {},
  }),
});
```

## Examples

The following examples show how to use the signed request with different HTTP libraries.

### [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

```ts
import { signRequest } from "aws-sigv4-sign";

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', { service: 'lambda', region: 'eu-west-1' });
const response = await fetch(signedRequest);
```

### [Axios](https://github.com/axios/axios)
```ts
import axios from "axios";
import { signRequest } from "aws-sigv4-sign";

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', { service: 'lambda', region: 'eu-west-1' });
const headers = Object.fromEntries(signedRequest.headers.entries());
const response = await axios(signedRequest.url, { headers });
```

### [Got](https://github.com/sindresorhus/got)

```ts
import { signRequest } from "aws-sigv4-sign";
import got from "got";

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', { service: 'lambda', region: 'eu-west-1' });
const headers = Object.fromEntries(signedRequest.headers.entries());
const response = await got(signedRequest.url, { headers });
```

### [Ky](https://github.com/sindresorhus/ky)

```ts
import { signRequest } from "aws-sigv4-sign";
import ky from "ky";

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', { service: 'lambda', region: 'eu-west-1' });
const headers = Object.fromEntries(signedRequest.headers.entries());
const response = await ky.get(signedRequest.url, { headers });
```

### [node:https](https://nodejs.org/api/https.html)

```ts
import { signRequest } from "aws-sigv4-sign";
import { request } from "node:https";

const signedRequest = await signRequest('https://mylambda.lambda-url.eu-west-1.on.aws/', { service: 'lambda', region: 'eu-west-1' });
const headers = Object.fromEntries(signedRequest.headers.entries());
const body = "";
const response = new Promise((resolve, reject) => {
  const req = request(signedRequest.url, { headers }, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () =>
      resolve({
        status: res.statusCode ?? 0,
        statusText: res.statusMessage,
        data,
      }),
    );
  });

  req.on("error", reject);

  if (body) {
    req.write(body);
  }

  req.end();
});
```

## License
MIT
