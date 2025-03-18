import { APIGatewayClient, GetRestApisCommand } from "@aws-sdk/client-api-gateway";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { describe, expect, it } from "vitest";
import { API_NAME, REGION, RESOURCE, RESPONSE, SERVICE, STAGE } from "../lib/api-gateway-test-stack.js";
import { testPaths, testQueryParams } from "./fixtures.js";

const client = new APIGatewayClient({ region: REGION });
const response = await client.send(new GetRestApisCommand({}));
const api = response.items?.find((api) => api.name === API_NAME);
if (!api) throw new Error("API not found");

const restApiId = api.id;

const apiRootUrl = `https://${restApiId}.execute-api.${REGION}.amazonaws.com/${STAGE}/${RESOURCE}/`;
console.log("API URL:", apiRootUrl);

describe("APIGateway", () => {
  describe("GET", () => {
    describe.each(testPaths)("Path: %s", async (path) => {
      describe.each(testQueryParams)("Query params: %s", async (queryParams) => {
        const url = `${apiRootUrl}${path}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ""}`;

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

          const data = await response.json();
          expect(data).toEqual(RESPONSE);
        });

        it("should throw an error for unsigned fetch", async () => {
          // Arrange

          // Act
          const response = await fetch(url);

          // Assert
          expect(response.status).toBe(403);
          expect(response.statusText).toBe("Forbidden");
        });
      });
    });
  });

  describe("POST", () => {
    describe.each(testPaths)("Path: %s", async (path) => {
      describe.each(testQueryParams)("Query params: %s", async (queryParams) => {
        const url = `${apiRootUrl}${path}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ""}`;
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

          const data = await response.json();
          expect(data).toEqual(RESPONSE);
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

          const data = await response.json();
          expect(data).toEqual(RESPONSE);
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
