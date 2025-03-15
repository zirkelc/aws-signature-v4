import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";
import type { SignRequestOptions } from "aws-sigv4-sign";
import { signRequest } from "aws-sigv4-sign";
import { getFetchFn } from "./get-fetch.js";

export type SignedFetcherOptions = {
  service: string;
  region?: string;
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  fetch?: typeof fetch;
};

export type CreateSignedFetcher = (init: SignedFetcherOptions) => typeof fetch;

export const createSignedFetcher: CreateSignedFetcher = (options: SignedFetcherOptions): typeof fetch => {
  const fetchFn = getFetchFn(options.fetch);
  const signOptions: SignRequestOptions = {
    service: options.service,
    region: options.region,
    credentials: options.credentials,
  };

  return async (input, init?) => {
    const signedRequest = init ? await signRequest(input, init, signOptions) : await signRequest(input, signOptions);

    return fetchFn(signedRequest);
  };
};
