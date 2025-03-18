import { GetFunctionUrlConfigCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { describe, expect, it } from "vitest";
import { FUNCTION_NAME, REGION, RESPONSE, SERVICE } from "../lib/lambda-test-stack.js";
import { testPaths, testQueryParams } from "./fixtures.js";

const client = new LambdaClient({ region: REGION });
const response = await client.send(new GetFunctionUrlConfigCommand({ FunctionName: FUNCTION_NAME }));
if (!response.FunctionUrl) throw new Error("Function URL not found");

const functionUrl = response.FunctionUrl;
console.log("Function URL:", functionUrl);

describe("Lambda Function URL", () => {
  describe("GET", () => {
    describe.each(testPaths)("Path: %s", (path) => {
      describe.each(testQueryParams)("Query params: %s", async (queryParams) => {
        const url = `${functionUrl}${path}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ""}`;

        it("should fetch with string", async () => {
          // Arrange
          const signedFetch = createSignedFetcher({ service: SERVICE, region: REGION });

          // Act
          const response = await signedFetch(url);

          // Assert
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toEqual(RESPONSE);
        });

        it("should fetch with URL", async () => {
          // Arrange
          const signedFetch = createSignedFetcher({ service: SERVICE, region: REGION });

          // Act
          const response = await signedFetch(new URL(url));

          // Assert
          expect(response.status).toBe(200);

          const data = await response.json();
          expect(data).toEqual(RESPONSE);
        });

        it("should fetch with Request", async () => {
          // Arrange
          const signedFetch = createSignedFetcher({ service: SERVICE, region: REGION });

          // Act
          const response = await signedFetch(new Request(url));

          // Assert
          expect(response.status).toBe(200);
        });

        it("should throw an error for unsigned fetch", async () => {
          // Arrange

          // Act
          const response = await fetch(url, {
            method: "GET",
          });

          // Assert
          expect(response.status).toBe(403);
          expect(response.statusText).toBe("Forbidden");
        });
      });
    });
  });

  describe("POST", () => {
    describe.each(testPaths)("Path: %s", (path) => {
      describe.each(testQueryParams)("Query params: %s", async (queryParams) => {
        const url = `${functionUrl}${path}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ""}`;
        const method = "POST";
        const headers = {
          "Content-Type": "application/json",
        };
        const body = JSON.stringify({});

        it("should fetch with string", async () => {
          // Arrange
          const signedFetch = createSignedFetcher({ service: SERVICE, region: REGION });

          // Act
          const response = await signedFetch(url, {
            method,
            body,
            headers,
          });

          // Assert
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toEqual(RESPONSE);
        });

        it("should fetch with URL", async () => {
          // Arrange
          const signedFetch = createSignedFetcher({ service: SERVICE, region: REGION });

          // Act
          const response = await signedFetch(new URL(url), {
            method,
            body,
            headers,
          });

          // Assert
          expect(response.status).toBe(200);
        });

        it("should fetch with Request", async () => {
          // Arrange
          const signedFetch = createSignedFetcher({ service: SERVICE, region: REGION });

          // Act
          const response = await signedFetch(
            new Request(url, {
              method,
              body,
              headers,
            }),
          );

          // Assert
          expect(response.status).toBe(200);
        });

        it("should throw an error for unsigned fetch", async () => {
          // Arrange

          // Act
          const response = await fetch(url, {
            method,
            body,
            headers,
          });

          // Assert
          expect(response.status).toBe(403);
          expect(response.statusText).toBe("Forbidden");
        });
      });
    });
  });
});
