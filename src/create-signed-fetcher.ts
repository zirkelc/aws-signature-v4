import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import type { AwsCredentialIdentity, Provider } from "@aws-sdk/types";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import { getFetchFn } from "./get-fetch.js";
import { getHeaders } from "./get-headers.js";

export type SignedFetcherOptions = {
	service: string;
	region?: string;
	credentials?: AwsCredentialIdentity | Provider<AwsCredentialIdentity>;
	fetch?: typeof fetch;
};

export type CreateSignedFetcher = (init: SignedFetcherOptions) => typeof fetch;

/**
 * Create a signed fetch function that automatically signs requests with AWS Signature V4.
 * Service and region must be provided. Credentials can be provided if you want to sign requests with a specific set of credentials.
 * If no credentials are provided, the default credentials from `@aws-sdk/credential-provider-node` will be used.
 * See: https://docs.aws.amazon.com/opensearch-service/latest/developerguide/request-signing.html#request-signing-node
 * @param init
 * @returns fetch
 */
export const createSignedFetcher: CreateSignedFetcher = (
	opts: SignedFetcherOptions,
): typeof fetch => {
	const fetchFn = getFetchFn(opts.fetch);

	return async (input, init?) => {
		const service = opts.service;
		const region = opts.region || "us-east-1";
		const credentials = opts.credentials || defaultProvider();

		const url = new URL(
			typeof input === "string"
				? input
				: input instanceof URL
				  ? input.href
				  : input.url,
		);

		const headers = getHeaders(init?.headers);
		// host is required by AWS Signature V4: https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
		headers.set("host", url.host);

		const request = new HttpRequest({
			hostname: url.hostname,
			path: url.pathname,
			protocol: url.protocol,
			port: url.port ? Number(url.port) : undefined,
			username: url.username,
			password: url.password,
			method: init?.method?.toUpperCase() ?? "GET", // method must be uppercase
			body: init?.body,
			query: Object.fromEntries(url.searchParams.entries()),
			fragment: url.hash,
			headers: Object.fromEntries(headers.entries()),
		});

		const signer = new SignatureV4({
			credentials,
			service,
			region,
			sha256: Sha256,
		});

		const signedRequest = await signer.sign(request);

		return fetchFn(url, {
			...init,
			headers: signedRequest.headers,
			body: signedRequest.body,
			method: signedRequest.method,
		});
	};
};
