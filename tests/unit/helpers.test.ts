import { describe, expect, test } from "bun:test";
import { formatDate, humanReadableBytes } from "../../src/lib/helpers";

describe("humanReadableBytes", () => {
	test("0 bytes", () => {
		expect(humanReadableBytes(0)).toBe("0.00 B");
	});

	test("bytes under 1 KB", () => {
		expect(humanReadableBytes(512)).toBe("512.00 B");
	});

	test("exactly 1 KB", () => {
		expect(humanReadableBytes(1024)).toBe("1.00 KB");
	});

	test("exactly 1 MB", () => {
		expect(humanReadableBytes(1024 ** 2)).toBe("1.00 MB");
	});

	test("exactly 1 GB", () => {
		expect(humanReadableBytes(1024 ** 3)).toBe("1.00 GB");
	});

	test("exactly 1 TB", () => {
		expect(humanReadableBytes(1024 ** 4)).toBe("1.00 TB");
	});

	test("fractional value (1.5 KB)", () => {
		expect(humanReadableBytes(1536)).toBe("1.50 KB");
	});

	test("fractional value (2.25 GB)", () => {
		expect(humanReadableBytes(2.25 * 1024 ** 3)).toBe("2.25 GB");
	});
});

describe("formatDate", () => {
	test("formats a known timestamp to ISO-like string without T or ms", () => {
		expect(formatDate(0)).toBe("1970-01-01 00:00:00");
	});

	test("formats a non-zero timestamp correctly", () => {
		const ms = new Date("2024-06-15T12:34:56.000Z").getTime();
		expect(formatDate(ms)).toBe("2024-06-15 12:34:56");
	});

	test("output is always 19 characters long", () => {
		expect(formatDate(Date.now()).length).toBe(19);
	});
});
