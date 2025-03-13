import { beforeEach, describe, expect, it, vi } from "vitest";
import { credentials } from "./__fixtures__.js";
import { getCredentialProvider } from "./credential-provider.js";

vi.mock("@aws-sdk/credential-provider-node", async () => {
  return {
    defaultProvider: vi.fn().mockReturnValue(() => Promise.resolve(credentials)),
  };
});

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

describe("getCredentialProvider", () => {
  it("should attempt to load defaultProvider in node environment", async () => {
    // Arrange

    // Act
    const credentialProvider = await getCredentialProvider();
    const resolvedCredentials = await credentialProvider();

    // Assert
    expect(resolvedCredentials).toEqual(credentials);
  });

  it("should throw error when in browser environment", async () => {
    // Arrange
    global.window = {} as any;
    global.document = {} as any;

    // Act
    const result = getCredentialProvider();

    // Assert
    await expect(result).rejects.toThrow("AWS credentials provider is not available in browser environments");
  });
});
