import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";

const BOT_TOKEN = "123456789:ABC-DEFghijklmno";
const CHAT_ID = "-1001234567890";

mock.module("../../src/config", () => ({
	config: {
		notifiers: [{ type: "telegram", botToken: BOT_TOKEN, chatId: CHAT_ID }],
	},
}));

import { Notifiers } from "../../src/lib/notifiers";

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

beforeEach(() => {
	fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
		(async () =>
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})) as unknown as typeof fetch,
	);
});

afterEach(() => {
	fetchSpy.mockRestore();
});

test("dispatches to the Telegram API with the correct URL and message", async () => {
	const notifiers = new Notifiers();
	await notifiers.alert("Disk full");
	expect(fetchSpy).toHaveBeenCalledTimes(1);
	expect(fetchSpy.mock.calls[0]?.[0]).toBe(
		`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
	);
	const body = JSON.parse(
		(fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string,
	);
	expect(body.chat_id).toBe(CHAT_ID);
	expect(body.text).toBe("Disk full");
});
