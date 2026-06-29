/**
 * Docker integration test: builds the Linux binary, spins up an ubuntu:22.04
 * container via testcontainers, runs `baba setup` with piped answers, and
 * verifies that config.json is written correctly and the binary is functional.
 *
 * Requires:
 *   - Docker daemon running
 *   - dist/bun-linux-x64 built (bun run build)
 *
 * Skipped automatically when the binary is absent.
 */

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { GenericContainer } from "testcontainers";

const BINARY_PATH = "dist/bun-linux-x64";
const SKIP = !existsSync(BINARY_PATH);

// ── Prompt answer sequence ────────────────────────────────────────────────────
//
// 21 answers: machine name + 3 general + discord y + url + telegram n
//             + all check defaults (14 prompts for cpu/load/mem/disk/temp/gpu)
//
// Any remaining prompts (if binary asks more than expected) get "" via EOF.

const MACHINE_NAME = "test-docker-server";
const WEBHOOK_URL = "https://discord.com/api/webhooks/99999/test-token";

function buildAnswers(): string {
	const lines = [
		MACHINE_NAME, // machineName
		"", // intervalSeconds (60)
		"", // reminderIntervalMinutes (30)
		"", // database.path
		"y", // Discord? yes
		WEBHOOK_URL, // Discord webhook URL
		"n", // Telegram? no
		"",
		"",
		"", // cpu: enabled, threshold, breaches
		"",
		"",
		"", // load: enabled, threshold, breaches
		"",
		"",
		"", // memory: enabled, threshold, breaches
		"",
		"",
		"", // disk: enabled, threshold, volumes
		"", // temperature: disabled (default N)
		"", // gpu: disabled (default N)
	];
	return lines.join("\n");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// keep-alive so exec() doesn't fail with "container not running"
const KEEP_ALIVE = ["sh", "-c", "tail -f /dev/null"];

describe.skipIf(SKIP)("baba setup (Docker integration)", () => {
	test("binary runs on ubuntu:22.04 and setup writes valid config.json", async () => {
		const container = await new GenericContainer("ubuntu:22.04")
			.withCommand(KEEP_ALIVE)
			.withCopyFilesToContainer([
				{ source: BINARY_PATH, target: "/usr/local/bin/baba" },
			])
			.start();

		try {
			// Make executable + smoke-test: version flag exits 0
			const version = await container.exec([
				"sh",
				"-c",
				"chmod +x /usr/local/bin/baba && baba --version",
			]);
			expect(version.exitCode).toBe(0);

			// Run interactive setup with piped answers
			const answers = buildAnswers();
			const setupResult = await container.exec([
				"sh",
				"-c",
				// printf safely handles newlines and doesn't need shell escaping
				`printf '%s\\n' ${answers
					.split("\n")
					.map((l) => (l === "" ? "''" : `'${l.replace(/'/g, "'\\''")}'`))
					.join(" ")} | baba setup --config /tmp/config.json`,
			]);
			expect(setupResult.exitCode).toBe(0);

			// Read back config.json
			const cat = await container.exec(["cat", "/tmp/config.json"]);
			expect(cat.exitCode).toBe(0);

			const config = JSON.parse(cat.output) as {
				machineName: string;
				intervalSeconds: number;
				reminderIntervalMinutes: number;
				notifiers: { type: string; webhookUrl: string }[];
				checks: {
					cpu: { enabled: boolean };
					disk: { volumes: string[] };
				};
			};

			expect(config.machineName).toBe(MACHINE_NAME);
			expect(config.intervalSeconds).toBe(60);
			expect(config.reminderIntervalMinutes).toBe(30);
			expect(config.notifiers).toHaveLength(1);
			expect(config.notifiers[0]?.type).toBe("discord");
			expect(config.notifiers[0]?.webhookUrl).toBe(WEBHOOK_URL);
			expect(config.checks.cpu.enabled).toBe(true);
			expect(config.checks.disk.volumes).toContain("/");
		} finally {
			await container.stop();
		}
	}, 120_000);

	test("setup preserves existing config when run a second time with defaults", async () => {
		const container = await new GenericContainer("ubuntu:22.04")
			.withCommand(KEEP_ALIVE)
			.withCopyFilesToContainer([
				{ source: BINARY_PATH, target: "/usr/local/bin/baba" },
			])
			.start();

		try {
			await container.exec(["chmod", "+x", "/usr/local/bin/baba"]);

			// First run — write initial config
			const firstAnswers = buildAnswers();
			await container.exec([
				"sh",
				"-c",
				`printf '%s\\n' ${firstAnswers
					.split("\n")
					.map((l) => (l === "" ? "''" : `'${l.replace(/'/g, "'\\''")}'`))
					.join(" ")} | baba setup --config /tmp/config.json`,
			]);

			// Second run — accept all defaults (all empty = keep existing values)
			const blankAnswers = Array(25).fill("").join("\n");
			await container.exec([
				"sh",
				"-c",
				`printf '%s\\n' ${blankAnswers
					.split("\n")
					.map(() => "''")
					.join(" ")} | baba setup --config /tmp/config.json`,
			]);

			const cat = await container.exec(["cat", "/tmp/config.json"]);
			const config = JSON.parse(cat.output) as {
				machineName: string;
				notifiers: { type: string }[];
			};

			// Machine name from first run preserved via defaults
			expect(config.machineName).toBe(MACHINE_NAME);
			// Discord notifier preserved (existing default was Y)
			expect(config.notifiers.find((n) => n.type === "discord")).toBeDefined();
		} finally {
			await container.stop();
		}
	}, 120_000);
});
