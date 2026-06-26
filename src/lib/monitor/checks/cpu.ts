import si from "systeminformation";
import type { CpuChecks } from "../../../config";
import { logger } from "../../logger";
import type { BreachOpts } from "../types";

type Deps = {
	checks: CpuChecks;
	breach: (opts: BreachOpts) => Promise<void>;
};

export async function checkCpu({
	checks,
	breach,
}: Deps): Promise<string | undefined> {
	if (!checks.enabled) return;
	const data = await si.currentLoad();
	const usage = Math.round(data.currentLoad);
	logger.debug(`CPU usage: ${usage}%`);
	await breach({
		metric: "cpu",
		volume: null,
		value: usage,
		threshold: checks.usageThresholdPercent,
		consecutiveRequired: checks.consecutiveBreaches,
		openMsg: `⚠️ **CPU LOAD**: Usage is at **${usage}%**`,
		reminderMsg: `⏰ **CPU REMINDER**: Still at **${usage}%**`,
		recoveryMsg: `✅ **CPU**: Back to normal at **${usage}%**`,
	});
	return `CPU: ${usage}%`;
}
