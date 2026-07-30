# aws-sigv4-sign

## [2.0.1](https://github.com/zirkelc/aws-signature-v4/compare/aws-sigv4-sign@2.0.0...aws-sigv4-sign@2.0.1) (2026-07-30)


### Documentation

* call out that the default credential provider is cached ([cc59c26](https://github.com/zirkelc/aws-signature-v4/commit/cc59c265a1af81a90bc06b471f6bfe7e1829febc))
* restructure the root and package READMEs ([c9ee42b](https://github.com/zirkelc/aws-signature-v4/commit/c9ee42bdf2d1a58f2f1b2bd91c7b5757b0cc6630))

## [2.0.0](https://github.com/zirkelc/aws-signature-v4/compare/aws-sigv4-sign@1.2.1...aws-sigv4-sign@2.0.0) (2026-07-30)


### ⚠ BREAKING CHANGES

* the published packages now require Node >= 20, because @aws-sdk/credential-provider-node dropped Node 18 (EOL April 2025). The CI matrix moves to 20/22/24 and a changeset queues both packages as major.

### Bug Fixes

* **build:** let tsdown run attw natively and drop the redundant prepublish build ([4ebefad](https://github.com/zirkelc/aws-signature-v4/commit/4ebefadfa67bce2f674f493fc27351cffa9acab3))
* reuse default credential provider across signed requests ([#41](https://github.com/zirkelc/aws-signature-v4/issues/41)) ([05dc590](https://github.com/zirkelc/aws-signature-v4/commit/05dc590008fd10f37039e3267652bce688e5a19c)), closes [#40](https://github.com/zirkelc/aws-signature-v4/issues/40)


### Miscellaneous Chores

* **release:** reset versions to the last published release ([69106b2](https://github.com/zirkelc/aws-signature-v4/commit/69106b204c6ef2de1670aa85ec2c619bd1bb9e20))
* upgrade dependencies and migrate toolchain ([89ae195](https://github.com/zirkelc/aws-signature-v4/commit/89ae195e3cebb63493b9b2b79d413d27847d3889))

## 1.2.1

### Patch Changes

- 878eafe: fix: signature is wrong if url has duplicate query param keys

## 1.2.0

### Minor Changes

- 2af3ec8: feat: support signing requests in the browser

## 1.1.0

### Minor Changes

- 6d62f18: fix: always use arrayBuffer
