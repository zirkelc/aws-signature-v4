---
'aws-sigv4-fetch': major
'aws-sigv4-sign': major
---

Require Node.js >= 20 and update AWS SDK dependencies

**Breaking:** the minimum supported Node.js version is now 20 (previously 18, which reached end-of-life in April 2025). This is required by `@aws-sdk/credential-provider-node`, which dropped Node 18 support.

- Update `@aws-sdk/credential-provider-node` to `^3.972.66`
- Update `@smithy/signature-v4` to `^5.6.4` and `@smithy/protocol-http` to `^5.5.8`
- The error thrown when the default credential provider cannot be loaded now carries the underlying failure as its `cause`

The public API is unchanged. The ESM bundle is now emitted as `dist/index.mjs` (previously `dist/index.js`), which the `exports` map points at, so this only affects anyone who was deep-importing the bundle file by path instead of the package entry point.
