import si from "systeminformation";
import type { MemoryChecks } from "../../../config";
import { humanReadableBytes } from "../../helpers";
import { logger } from "../../logger";
import type { BreachOpts } from "../types";

type Deps = {
	checks: MemoryChecks;
	breach: (opts: BreachOpts) => Promise<void>;
};

export async function checkMemory({
	checks,
	breach,
}: Deps): Promise<string | undefined> {
	if (!checks.enabled) return;
	const mem = await si.mem();
	const usage = Math.round((mem.used / mem.total) * 100);
	logger.debug(
		`Memory: ${usage}% (${humanReadableBytes(mem.used)} / ${humanReadableBytes(mem.total)})`,
	);
	await breach({
		metric: "memory",
		volume: null,
		value: usage,
		threshold: checks.usageThresholdPercent,
		consecutiveRequired: checks.consecutiveBreaches,
		openMsg: `⚠️ **MEMORY USAGE**: Usage is at **${usage}% (${humanReadableBytes(mem.used)}/${humanReadableBytes(mem.total)})**`,
		reminderMsg: `⏰ **MEMORY REMINDER**: Still at **${usage}%**`,
		recoveryMsg: `✅ **MEMORY**: Back to normal at **${usage}%**`,
	});
	return `Memory: ${usage}%`;
}
