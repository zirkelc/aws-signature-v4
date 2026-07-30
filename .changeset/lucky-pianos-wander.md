---
'aws-sigv4-fetch': minor
'aws-sigv4-sign': minor
---

Reuse the default credential provider across requests

When no `credentials` option is passed, the default provider from `@aws-sdk/credential-provider-node` was constructed on every signed request. The AWS SDK caches resolved credentials per provider instance, so a fresh instance per request never hit that cache: every request re-resolved credentials from scratch (shared config files, web identity token exchange, or the instance metadata service) and allocated new HTTP resources to do so. In long-running processes those accumulated, and under load the added latency was significant.

The provider is now constructed once and reused. The pending construction is cached, so concurrent first requests share a single instance, and a failed construction is not cached so the next call can retry.

**Behavior change:** the provider is pinned for the lifetime of the process, so changes to `AWS_PROFILE` or the other credential environment variables after the first signed request are no longer picked up. Pass `credentials` explicitly to switch identities at runtime. Credential _refresh_ is unaffected: the SDK still refreshes before expiry.
