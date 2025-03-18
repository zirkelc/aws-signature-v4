import "cross-fetch/polyfill";
import { describe, expect, it } from "vitest";
import { url } from "./fixtures.js";
import { parseRequest } from "./parse-request.js";

describe("parseRequest", () => {
  describe("string input", () => {
    it("should parse `string` input", async () => {
      // Arrange
      const input = url;

      // Act
      const parsed = await parseRequest(input);

      // Assert
      expect(parsed.url).toEqual(new URL(url));
      expect(parsed.method).toEqual("GET");
      expect(parsed.headers).toEqual({});
    });
  });

  describe("URL input", () => {
    it("should parse `URL` input", async () => {
      // Arrange
      const input = new URL(url);

      // Act
      const parsed = await parseRequest(input);

      // Assert
      expect(parsed.url).toEqual(new URL(url));
      expect(parsed.method).toEqual("GET");
      expect(parsed.headers).toEqual({});
    });
  });

  describe("Request input", () => {
    it("should parse simple `Request` input", async () => {
      // Arrange
      const simpleRequest = new Request(url);

      // Act
      const parsed = await parseRequest(simpleRequest);

      // Assert
      expect(parsed.url).toEqual(new URL(url));
      expect(parsed.method).toEqual("GET");
      expect(parsed.headers).toEqual({});
      expect(parsed.body).toBeUndefined();
    });

    it("should parse complex `Request` input", async () => {
      // Arrange
      const complexRequest = new Request(url, {
        method: "POST",
        body: "foo",
        headers: { header1: "value1", header2: "value2" },
      });

      // Act
      const parsedComplex = await parseRequest(complexRequest);

      // Assert
      expect(parsedComplex.url).toEqual(new URL(url));
      expect(parsedComplex.method).toEqual("POST");
      expect(parsedComplex.headers).toEqual({
        "content-type": "text/plain;charset=UTF-8",
        header1: "value1",
        header2: "value2",
      });
      expect(parsedComplex.body).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe("body", () => {
    it("should parse body of `Request`", async () => {
      // Arrange
      const input = new Request(url, { method: "POST", body: "foo" });

      // Act
      const parsed = await parseRequest(input);

      // Assert
      expect(parsed.body).toBeInstanceOf(ArrayBuffer);
    });

    it("should parse body of `RequestInit`", async () => {
      // Arrange
      const init = { method: "POST", body: "foo" };

      // Act
      const parsed = await parseRequest(url, init);

      // Assert
      expect(parsed.body).toEqual(new TextEncoder().encode("foo").buffer);
    });

    it("should override body of `Request` from `RequestInit`", async () => {
      // Arrange
      const input = new Request(url, { method: "POST", body: "foo" });
      const init = { body: "bar" };

      // Act
      const parsed = await parseRequest(input, init);

      // Assert
      expect(parsed.body).toEqual(new TextEncoder().encode("bar").buffer);
    });
  });

  describe("headers", () => {
    it("should parse `Headers` to plain object", async () => {
      // Arrange
      const headers = new Headers({ header1: "value1", header2: "value2" });

      // Act
      const parsed = await parseRequest(url, { headers });

      // Assert
      expect(parsed.headers).toEqual({
        header1: "value1",
        header2: "value2",
      });
    });

    it("should parse `HeadersInit` to plain object", async () => {
      // Arrange
      const init = { headers: { header1: "value1", header2: "value2" } as HeadersInit };

      // Act
      const parsed = await parseRequest(url, init);

      // Assert
      expect(parsed.headers).toEqual({ header1: "value1", header2: "value2" });
    });

    it("should parse array of headers to plain object", async () => {
      // Arrange
      const init = {
        headers: [
          ["header1", "value1"],
          ["header2", "value2"],
        ] as [string, string][],
      };

      // Act
      const parsed = await parseRequest(url, init);

      // Assert
      expect(parsed.headers).toEqual({ header1: "value1", header2: "value2" });
    });

    it("should override headers of `Request` from `RequestInit`", async () => {
      // Arrange
      const input = new Request(url, {
        headers: { header1: "value1", header2: "value2" },
      });
      const init = {
        headers: { header3: "value3", header4: "value4" },
      };

      // Act
      const parsed = await parseRequest(input, init);

      // Assert
      expect(parsed.headers).toEqual({
        header3: "value3",
        header4: "value4",
      });
    });
  });

  describe("method", () => {
    it("should set default method to GET", async () => {
      // Arrange
      const input = url;

      // Act
      const parsed = await parseRequest(input);

      // Assert
      expect(parsed.method).toEqual("GET");
    });

    it("should override method of `Request` from `RequestInit`", async () => {
      // Arrange
      const input = new Request(url, { method: "GET" });
      const init = { method: "POST" };

      // Act
      const parsed = await parseRequest(input, init);

      // Assert
      expect(parsed.method).toEqual("POST");
    });

    it("should uppercase method from `Request`", async () => {
      // Arrange
      const input = new Request(url, { method: "post" });

      // Act
      const parsed = await parseRequest(input);

      // Assert
      expect(parsed.method).toEqual("POST");
    });

    it("should uppercase method from `RequestInit`", async () => {
      // Arrange
      const init = { method: "get" };

      // Act
      const parsed = await parseRequest(url, init);

      // Assert
      expect(parsed.method).toEqual("GET");
    });
  });

  it("should throw error if input is invalid", async () => {
    // Assert
    await expect(() => parseRequest("")).rejects.toThrow();
    await expect(() => parseRequest(null as any)).rejects.toThrow();
    await expect(() => parseRequest(undefined as any)).rejects.toThrow();
    await expect(() => parseRequest({} as any)).rejects.toThrow();
  });
});
