import { beforeEach, describe, expect, it, vi } from "vitest";
import { type SignedFetcherOptions, createSignedFetcher } from "./create-signed-fetcher.js";
import { url, bodyFixture, credentials, date, getSignedHeaders, headersSigned, region, service } from "./fixtures.js";

const fetchMock = vi.fn(fetch).mockResolvedValue(new Response());
let signedFetch: typeof fetch;

vi.useFakeTimers();
vi.setSystemTime(date);

const options: SignedFetcherOptions = {
  service,
  region,
  credentials,
  fetch: fetchMock,
};

beforeEach(() => {
  vi.clearAllMocks();

  signedFetch = createSignedFetcher(options);
});

describe("createSignedFetcher", () => {
  describe("GET", () => {
    it("should fetch with string", async () => {
      await signedFetch(url);

      expect(fetchMock).toHaveBeenCalled();
      const [request] = fetchMock.mock.calls[0] as [Request];

      expect(request.url).toEqual(url);
      expect(request.method).toEqual("GET");
      expect(request.body).toEqual(null);

      const signedHeaders = getSignedHeaders(request);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toMatchInlineSnapshot(
        `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7"`,
      );
    });

    it("should fetch with URL", async () => {
      await signedFetch(new URL(url));

      expect(fetchMock).toHaveBeenCalled();
      const [request] = fetchMock.mock.calls[0] as [Request];

      expect(request.url).toEqual(url);
      expect(request.method).toEqual("GET");
      expect(request.body).toEqual(null);

      const signedHeaders = getSignedHeaders(request);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toMatchInlineSnapshot(
        `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7"`,
      );
    });

    it("should fetch with Request", async () => {
      await signedFetch(new Request(url));

      expect(fetchMock).toHaveBeenCalled();
      const [request] = fetchMock.mock.calls[0] as [Request];

      expect(request.url).toEqual(url);
      expect(request.method).toEqual("GET");
      expect(request.body).toEqual(null);

      const signedHeaders = getSignedHeaders(request);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toMatchInlineSnapshot(
        `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7"`,
      );
    });
  });

  describe("POST", () => {
    describe("Body: undefined", () => {
      const body = undefined;

      it("should fetch with string", async () => {
        await signedFetch(url, { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");
        expect(request.body).toEqual(null);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30"`,
        );
      });

      it("should fetch with URL", async () => {
        await signedFetch(new URL(url), { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");
        expect(request.body).toEqual(null);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30"`,
        );
      });

      it("should fetch with Request", async () => {
        await signedFetch(new Request(url, { method: "POST", body }));

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");
        expect(request.body).toEqual(null);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30"`,
        );
      });
    });

    describe(`Body: String("foo")`, () => {
      const { body } = bodyFixture.string;

      it("should fetch with string", async () => {
        await signedFetch(url, { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const text = await request.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26"`,
        );
      });

      it("should fetch with URL", async () => {
        await signedFetch(new URL(url), { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const text = await request.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26"`,
        );
      });

      it("should fetch with Request", async () => {
        await signedFetch(new Request(url, { method: "POST", body }));

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const text = await request.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26"`,
        );
      });
    });

    describe(`Body: URLSearchParams({ foo: "bar" })`, () => {
      const { body } = bodyFixture.urlSearchParams;

      it("should fetch with string", async () => {
        await signedFetch(url, { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const text = await request.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb"`,
        );
      });

      it("should fetch with URL", async () => {
        await signedFetch(new URL(url), { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const text = await request.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb"`,
        );
      });

      it("should fetch with Request", async () => {
        await signedFetch(new Request(url, { method: "POST", body }));

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const text = await request.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb"`,
        );
      });
    });

    describe(`Body: FormData({ foo: "bar" })`, () => {
      const { body, init } = bodyFixture.formData;

      it("should fetch with string", async () => {
        await signedFetch(url, { method: "POST", ...init });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const formData = await request.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2"`,
        );
      });

      it("should fetch with URL", async () => {
        await signedFetch(new URL(url), { method: "POST", ...init });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const formData = await request.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2"`,
        );
      });

      it("should fetch with Request", async () => {
        await signedFetch(new Request(url, { method: "POST", ...init }));

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const formData = await request.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2"`,
        );
      });
    });

    describe(`Body: Blob(["foo"])`, () => {
      const { body } = bodyFixture.blob;

      it("should fetch with string", async () => {
        await signedFetch(url, { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const blob = await request.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232"`,
        );
      });

      it("should fetch with URL", async () => {
        await signedFetch(new URL(url), { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const blob = await request.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232"`,
        );
      });

      it("should fetch with Request", async () => {
        await signedFetch(new Request(url, { method: "POST", body }));

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const blob = await request.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232"`,
        );
      });
    });

    describe("Body: Uint8Array([0xde, 0xad, 0xbe, 0xef])", () => {
      const { body } = bodyFixture.arrayBuffer;

      it("should fetch with string", async () => {
        await signedFetch(url, { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const arrayBuffer = await request.arrayBuffer();
        expect(arrayBuffer).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64"`,
        );
      });

      it("should fetch with URL", async () => {
        await signedFetch(new URL(url), { method: "POST", body });

        expect(fetchMock).toHaveBeenCalled();
        const [request] = fetchMock.mock.calls[0] as [Request];
        expect(request.url).toEqual(url);
        expect(request.method).toEqual("POST");

        const arrayBuffer = await request.arrayBuffer();
        expect(arrayBuffer).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer);

        const signedHeaders = getSignedHeaders(request);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toMatchInlineSnapshot(
          `"AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64"`,
        );
      });
    });
  });

  it("should fetch with additional headers", async () => {
    await signedFetch(url, {
      headers: {
        "x-amz-test-header": "test-value",
        "x-api-key": "test-api-key",
      },
    });

    expect(fetchMock).toHaveBeenCalled();
    const [request] = fetchMock.mock.calls[0] as [Request];

    expect(request.url).toEqual(url);
    expect(request.method).toEqual("GET");
    expect(request.body).toEqual(null);
    expect(request.headers.get("x-amz-test-header")).toEqual("test-value");
    expect(request.headers.get("x-api-key")).toEqual("test-api-key");
  });

  it("should abort fetch", async () => {
    const signedFetch = createSignedFetcher({ ...options, fetch });

    const controller = new AbortController();
    const signal = controller.signal;

    const response = signedFetch(url, {
      signal,
    });

    controller.abort();

    await expect(response).rejects.toThrowErrorMatchingInlineSnapshot(`[AbortError: This operation was aborted]`);
  });
});
