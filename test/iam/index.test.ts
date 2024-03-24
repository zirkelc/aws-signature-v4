import "cross-fetch/polyfill";
import { beforeAll, describe, expect, it } from "vitest";
import { createSignedFetcher } from "../../dist/index.js";

const SERVICE = "iam";
const REGION = "us-east-1";

beforeAll(() => {});

describe("IAM", () => {
	it("should handle GET", async () => {
		const url = "https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08";

		const fetch = createSignedFetcher({ service: SERVICE, region: REGION });
		const response = await fetch(url, {
			method: "get",
		});

		expect(response.status).toBe(200);

		const data = await response.text();
		expect(data).toContain("<GetUserResult>");
	});

	it("should handle POST", async () => {
		const url = "https://iam.amazonaws.com/";
		const body = "Action=GetUser&Version=2010-05-08";

		const fetch = createSignedFetcher({ service: SERVICE, region: REGION });
		const response = await fetch(url, {
			method: "post",
			body,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
			},
		});

		expect(response.status).toBe(200);

		const data = await response.text();
		expect(data).toContain("<GetUserResult>");
	});

	it("should fallback method to GET", async () => {
		const url = "https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08";

		const fetch = createSignedFetcher({
			service: SERVICE,
			region: REGION,
		});
		const response = await fetch(url);

		expect(response.status).toBe(200);

		const data = await response.text();
		expect(data).toContain("<GetUserResult>");
	});

	it("should handle additional headers", async () => {
		const url = "https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08";

		const headers = {
			"x-amz-test-header": "test-value",
			"x-api-key": "test-api-key",
		};

		const fetch = createSignedFetcher({
			service: SERVICE,
			region: REGION,
		});

		const response = await fetch(url, {
			method: "GET",
			headers,
		});

		expect(response.status).toBe(200);

		const data = await response.text();
		expect(data).toContain("<GetUserResult>");
	});

	it("should handle url fragments", async () => {
		const url =
			"https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08#test-fragment";

		const fetch = createSignedFetcher({
			service: SERVICE,
			region: REGION,
		});

		const response = await fetch(url, {
			method: "GET",
		});

		expect(response.status).toBe(200);

		const data = await response.text();
		expect(data).toContain("<GetUserResult>");
	});

	it("should abort request", async () => {
		const url = "https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08";

		const controller = new AbortController();
		const signal = controller.signal;

		const fetch = createSignedFetcher({
			service: SERVICE,
			region: REGION,
		});

		const response = fetch(url, {
			method: "GET",
			signal,
		});

		controller.abort();

		await expect(response).rejects.toThrow();
	});

	it("should throw an error for unsigned fetch", async () => {
		const url = "https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08";

		const response = await fetch(url, {
			method: "GET",
		});

		expect(response.status).toBe(403);
		expect(response.statusText).toBe("Forbidden");
	});
});
