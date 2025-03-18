import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { expect } from "vitest";

export const date = "2000-01-01T00:00:00.000Z";

export const url = "https://foo.us-bar-1.amazonaws.com/";

export const service = "foo";
export const region = "us-bar-1";

export const credentials: AwsCredentialIdentity = {
  accessKeyId: "foo",
  secretAccessKey: "bar",
};

export const headersSigned = expect.objectContaining({
  host: `${service}.${region}.amazonaws.com`,
  "x-amz-date": "20000101T000000Z",
  "x-amz-content-sha256": expect.stringMatching(/^[a-f0-9]{64}$/),
  authorization: expect.stringMatching(
    /AWS4-HMAC-SHA256 Credential=([a-zA-Z0-9]+)\/(\d{8})\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9]+)\/aws4_request, SignedHeaders=([a-zA-Z0-9;-]+), Signature=([a-fA-F0-9]{64})/,
  ),
});

export const getSignedHeaders = (
  signedRequest: Request,
): Record<"authorization" | "host" | "x-amz-content-sha256" | "x-amz-date" | "x-amz-security-token", string> => {
  const headers: Record<string, string> = {};
  signedRequest.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
};

const formData = new FormData();
formData.append("foo", "bar");

export const bodyFixture = {
  string: {
    body: "foo",
  },
  urlSearchParams: {
    body: new URLSearchParams({ foo: "bar" }),
  },
  blob: {
    body: new Blob(["foo"]),
  },
  arrayBuffer: {
    body: new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer,
  },
  formData: {
    body: formData,
    /**
     * Undici generates a random boundary for each request.
     */
    init: {
      headers: {
        "Content-Type": "multipart/form-data; boundary=----formdata-undici-0.6204674738279623",
      },
      body:
        "------formdata-undici-0.6204674738279623\r\n" +
        'Content-Disposition: form-data; name="foo"\r\n' +
        "\r\n" +
        "bar\r\n" +
        "------formdata-undici-0.6204674738279623--\r\n",
    },
  },
};
