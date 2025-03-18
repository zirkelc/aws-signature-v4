import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDefaultCredentialProvider } from "./credential-provider.js";
import { credentials } from "./fixtures.js";

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

describe("getDefaultCredentialProvider", () => {
  it("should load default credentials provider in node environment", async () => {
    // Arrange

    // Act
    const defaultCredentialProvider = await getDefaultCredentialProvider();
    const resolvedCredentials = await defaultCredentialProvider();

    // Assert
    expect(resolvedCredentials).toEqual(credentials);
  });

  it("should throw error when in browser environment", async () => {
    // Arrange
    global.window = {} as any;
    global.document = {} as any;

    // Act
    const result = getDefaultCredentialProvider();

    // Assert
    await expect(result).rejects.toThrow("AWS credentials provider is not available in browser environments");
  });
});
