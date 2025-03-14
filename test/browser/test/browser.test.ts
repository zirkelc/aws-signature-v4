import { createSignedFetcher } from "aws-sigv4-fetch";
import { describe, expect, it } from "vitest";

const service = "iam";
const region = "us-east-1";
const url = "https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08";

describe("browser", () => {
  it("should make request with provided credentials", async () => {
    // Arrange
    const { defaultProvider } = await import("@aws-sdk/credential-provider-node");
    const credentials = defaultProvider();
    const signedFetch = createSignedFetcher({ service: service, region: region, credentials });

    // Act
    const response = await signedFetch(url);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("<GetUserResult>");
  });

  it("should throw an error without credentials", async () => {
    // Arrange
    const credentials = undefined;
    const signedFetch = createSignedFetcher({ service: service, region: region, credentials });

    // Act
    const response = signedFetch(url);

    // Assert
    await expect(response).rejects.toThrow();
  });

  it("should fail with unsigned request", async () => {
    // Arrange

    // Act
    const response = await fetch(url);

    // Assert
    expect(response.status).toBe(403);
    expect(response.statusText).toBe("Forbidden");
  });
});
