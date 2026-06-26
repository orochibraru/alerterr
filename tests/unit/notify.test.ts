import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

const WEBHOOK = "https://discord.com/api/webhooks/123456789/token";
const sendDiscordAlertSpy = mock(async (_url: string, _msg: string) => {});

mock.module("../../src/config", () => ({
	config: {
		notifiers: [{ type: "discord", webhookUrl: WEBHOOK }],
	},
}));

mock.module("../../src/lib/notifiers/discord", () => ({
	sendDiscordAlert: sendDiscordAlertSpy,
}));

import { notify } from "../../src/lib/notify";

describe("notify", () => {
	beforeEach(() => {
		sendDiscordAlertSpy.mockClear();
	});

	test("calls sendDiscordAlert with the correct webhookUrl and message", async () => {
		await notify("CPU is too hot");
		expect(sendDiscordAlertSpy).toHaveBeenCalledTimes(1);
		expect(sendDiscordAlertSpy.mock.calls[0]?.[0]).toBe(WEBHOOK);
		expect(sendDiscordAlertSpy.mock.calls[0]?.[1]).toBe("CPU is too hot");
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
