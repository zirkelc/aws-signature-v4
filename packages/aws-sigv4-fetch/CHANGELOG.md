# aws-sigv4-fetch

## [5.0.1](https://github.com/zirkelc/aws-signature-v4/compare/aws-sigv4-fetch@5.0.0...aws-sigv4-fetch@5.0.1) (2026-07-30)


### Documentation

* call out that the default credential provider is cached ([cc59c26](https://github.com/zirkelc/aws-signature-v4/commit/cc59c265a1af81a90bc06b471f6bfe7e1829febc))
* restructure the root and package READMEs ([c9ee42b](https://github.com/zirkelc/aws-signature-v4/commit/c9ee42bdf2d1a58f2f1b2bd91c7b5757b0cc6630))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * aws-sigv4-sign bumped to 2.0.1

## [5.0.0](https://github.com/zirkelc/aws-signature-v4/compare/aws-sigv4-fetch@4.4.1...aws-sigv4-fetch@5.0.0) (2026-07-30)


### ⚠ BREAKING CHANGES

* the published packages now require Node >= 20, because @aws-sdk/credential-provider-node dropped Node 18 (EOL April 2025). The CI matrix moves to 20/22/24 and a changeset queues both packages as major.

### Bug Fixes

* **build:** let tsdown run attw natively and drop the redundant prepublish build ([4ebefad](https://github.com/zirkelc/aws-signature-v4/commit/4ebefadfa67bce2f674f493fc27351cffa9acab3))


### Miscellaneous Chores

* **release:** reset versions to the last published release ([69106b2](https://github.com/zirkelc/aws-signature-v4/commit/69106b204c6ef2de1670aa85ec2c619bd1bb9e20))
* upgrade dependencies and migrate toolchain ([89ae195](https://github.com/zirkelc/aws-signature-v4/commit/89ae195e3cebb63493b9b2b79d413d27847d3889))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * aws-sigv4-sign bumped to 2.0.0

## 4.4.1

### Patch Changes

- 878eafe: fix: signature is wrong if url has duplicate query param keys
- Updated dependencies [878eafe]
  - aws-sigv4-sign@1.2.1

## 4.4.0

### Minor Changes

- 2af3ec8: feat: support signing requests in the browser

### Patch Changes

- Updated dependencies [2af3ec8]
  - aws-sigv4-sign@1.2.0

## 4.3.1

### Patch Changes

- Updated dependencies [6d62f18]
  - aws-sigv4-sign@1.1.0

## 4.3.0

### Minor Changes

- ecf73b7: feat: use aws-sigv4-sign to create a sigend `Request` object
