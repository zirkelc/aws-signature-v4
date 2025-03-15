import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "e2e/browser",
    // happy-dom fetch() doesn't work with signed requests
    // it probably changes the Request object in way that breaks the signature
    environment: "jsdom",
  },
});
