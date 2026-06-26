import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "bun:test";

const WEBHOOK = "https://discord.com/api/webhooks/123456789/token";

mock.module("../../src/config", () => ({
	config: {
		notifiers: [{ type: "discord", webhookUrl: WEBHOOK }],
	},
}));

import { notify } from "../../src/lib/notify";

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

beforeEach(() => {
	fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
		(async () => new Response("", { status: 204 })) as unknown as typeof fetch,
	);
});

afterEach(() => {
	fetchSpy.mockRestore();
});

describe("notify", () => {
	test("dispatches to the discord webhook with the correct URL and message", async () => {
		await notify("CPU is too hot");
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0]?.[0]).toBe(WEBHOOK);
		const body = JSON.parse(
			(fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string,
		);
		expect(body.content).toBe("CPU is too hot");
	});

	test("logs the alert message to console before dispatching", async () => {
		const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
		await notify("Disk full");
		expect(
			consoleSpy.mock.calls.some((args) =>
				String(args[0]).includes("Disk full"),
			),
		).toBe(true);
		consoleSpy.mockRestore();
	});
});
