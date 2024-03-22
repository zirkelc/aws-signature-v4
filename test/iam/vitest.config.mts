import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "e2e/iam",
		typecheck: {
			enabled: true,
		},
	},
});
