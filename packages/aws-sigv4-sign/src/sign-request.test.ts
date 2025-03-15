import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  url,
  bodyFixture,
  credentials,
  date,
  getSignedHeaders,
  headersSigned,
  region,
  service,
} from "./__fixtures__.js";
import { type SignRequestOptions, signRequest } from "./sign-request.js";

declare global {
  interface RequestInit {
    duplex?: "half";
  }

  interface Request {
    duplex?: "half";
  }
}

vi.useFakeTimers();
vi.setSystemTime(date);

const options: SignRequestOptions = {
  service,
  region,
  credentials,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("signRequest", () => {
  describe("GET", () => {
    it("should fetch with string", async () => {
      const signedRequest = await signRequest(url, options);

      expect(signedRequest.url).toEqual(url);
      expect(signedRequest.method).toEqual("GET");
      expect(signedRequest.body).toEqual(null);

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);

      const authorization = signedHeaders.authorization;
      expect(authorization).toBe(
        "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7",
      );
    });

    it("should fetch with URL", async () => {
      const signedRequest = await signRequest(new URL(url), options);

      expect(signedRequest.url).toEqual(url);
      expect(signedRequest.method).toEqual("GET");
      expect(signedRequest.body).toEqual(null);

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toBe(
        "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7",
      );
    });

    it("should fetch with Request", async () => {
      const signedRequest = await signRequest(new Request(url), options);

      expect(signedRequest.url).toEqual(url);
      expect(signedRequest.method).toEqual("GET");
      expect(signedRequest.body).toEqual(null);

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toBe(
        "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7",
      );
    });
  });

  describe("POST", () => {
    describe("Body: undefined", () => {
      const body = undefined;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");
        expect(signedRequest.body).toEqual(null);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        const authorization = signedHeaders.authorization;
        expect(authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");
        expect(signedRequest.body).toEqual(null);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");
        expect(signedRequest.body).toEqual(null);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30",
        );
      });
    });

    describe("Body: string", () => {
      const { body } = bodyFixture.string;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        const authorization = signedHeaders.authorization;
        expect(authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26",
        );
      });
    });

    describe("Body: URLSearchParams", () => {
      const { body } = bodyFixture.urlSearchParams;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const text = await signedRequest.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const text = await signedRequest.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const text = await signedRequest.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb",
        );
      });
    });

    describe("Body: FormData", () => {
      const { body, init } = bodyFixture.formData;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", ...init }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const formData = await signedRequest.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", ...init }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const formData = await signedRequest.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", ...init }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const formData = await signedRequest.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2",
        );
      });
    });

    describe("Body: Blob", () => {
      const { body } = bodyFixture.blob;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const blob = await signedRequest.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const blob = await signedRequest.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const blob = await signedRequest.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232",
        );
      });
    });

    describe("Body: Uint8Array", () => {
      const { body } = bodyFixture.arrayBuffer;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const arrayBuffer = await signedRequest.arrayBuffer();
        expect(arrayBuffer).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const arrayBuffer = await signedRequest.arrayBuffer();
        expect(arrayBuffer).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");

        const arrayBuffer = await signedRequest.arrayBuffer();
        expect(arrayBuffer).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64",
        );
      });
    });

    describe("Duplex: Half", () => {
      const { body } = bodyFixture.string;

      it("should fetch with string", async () => {
        const signedRequest = await signRequest(url, { method: "POST", body, duplex: "half" }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");
        expect(signedRequest.duplex).toEqual("half");

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        const authorization = signedHeaders.authorization;
        expect(authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26",
        );
      });

      it("should fetch with URL", async () => {
        const signedRequest = await signRequest(new URL(url), { method: "POST", body, duplex: "half" }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");
        expect(signedRequest.duplex).toEqual("half");

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26",
        );
      });

      it("should fetch with Request", async () => {
        const signedRequest = await signRequest(new Request(url, { method: "POST", body, duplex: "half" }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual("POST");
        expect(signedRequest.duplex).toEqual("half");

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          "AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26",
        );
      });
    });
  });

  describe("Defaults", () => {
    it("should use default region us-east-1", async () => {
      const signedRequest = await signRequest(url, { ...options, region: undefined });

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);

      const authorization = signedHeaders.authorization;
      expect(authorization).toBe(
        "AWS4-HMAC-SHA256 Credential=foo/20000101/us-east-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=67f6f44fa40ae4a9191fad86c952f4cd2a498ec6d86c57a66609d55cd219cc62",
      );
    });
  });

  describe("Credentials", () => {
    const originalWindow = global.window;
    const originalDocument = global.document;

    beforeEach(() => {
      global.window = undefined as any;
      global.document = undefined as any;

      return () => {
        global.window = originalWindow;
        global.document = originalDocument;
      };
    });

    it("should use default node credentials provider", async () => {
      process.env.AWS_ACCESS_KEY_ID = "alpha";
      process.env.AWS_SECRET_ACCESS_KEY = "beta";

      const signedRequest = await signRequest(url, { ...options, credentials: undefined });

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);

      const authorization = signedHeaders.authorization;
      expect(authorization).toBe(
        "AWS4-HMAC-SHA256 Credential=alpha/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa4d914f9488ac9c9ba7b7fdfd9b9e3d03f87fcaa78718e9bce640b5f134a934",
      );
    });

    it("should throw error if credentials are not provided in browser environment", async () => {
      global.window = {} as any;
      global.document = {} as any;

      const signedRequest = signRequest(url, { ...options, credentials: undefined });

      await expect(signedRequest).rejects.toThrow();
    });
  });
});
