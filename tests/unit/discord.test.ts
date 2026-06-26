import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { sendDiscordAlert } from "../../src/lib/notifiers/discord";

const WEBHOOK = "https://discord.com/api/webhooks/123456789/token";

let fetchMock = mock(async () => new Response("", { status: 204 }));

beforeEach(() => {
	fetchMock = mock(async () => new Response("", { status: 204 }));
	global.fetch = fetchMock as unknown as typeof fetch;
});

describe("sendDiscordAlert", () => {
	test("POSTs to the webhook URL with content and username", async () => {
		await sendDiscordAlert(WEBHOOK, "Server is on fire");
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(WEBHOOK);
		const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(init.method).toBe("POST");
		const body = JSON.parse(init.body as string);
		expect(body.content).toBe("Server is on fire");
		expect(body.username).toBe("Alerterr");
	});

	test("sets Content-Type header to application/json", async () => {
		await sendDiscordAlert(WEBHOOK, "test");
		const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
			"application/json",
		);
	});

	test("resolves without throwing on 2xx response", async () => {
		await expect(sendDiscordAlert(WEBHOOK, "ok")).resolves.toBeUndefined();
	});

	describe("error handling", () => {
		let consoleErrorSpy: ReturnType<typeof spyOn>;

		beforeEach(() => {
			consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		test("logs the status code when webhook returns a non-ok response", async () => {
			global.fetch = mock(
				async () => new Response("Bad Request", { status: 400 }),
			) as unknown as typeof fetch;
			await sendDiscordAlert(WEBHOOK, "test");
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("400");
		});

		test("logs an error message when fetch throws a network error", async () => {
			global.fetch = mock(async () => {
				throw new Error("Network unreachable");
			}) as unknown as typeof fetch;
			await sendDiscordAlert(WEBHOOK, "test");
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain(
				"Failed to send alert to Discord",
			);
		});
	});
});
