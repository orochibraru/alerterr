import si from "systeminformation";
import type { LoadChecks } from "../../../config";
import { logger } from "../../logger";
import type { BreachOpts } from "../types";

type Deps = {
	checks: LoadChecks;
	breach: (opts: BreachOpts) => Promise<void>;
};

export async function checkLoad({
	checks,
	breach,
}: Deps): Promise<string | undefined> {
	if (!checks.enabled) return;
	const data = await si.currentLoad();
	const avg = data.avgLoad;
	logger.debug(`Load average: ${avg.toFixed(2)}`);
	await breach({
		metric: "load",
		volume: null,
		value: avg,
		threshold: checks.threshold,
		consecutiveRequired: checks.consecutiveBreaches,
		openMsg: `🚨 **LOAD CRITICAL**: Load average is at **${avg.toFixed(2)}**`,
		reminderMsg: `⏰ **LOAD REMINDER**: Still at **${avg.toFixed(2)}**`,
		recoveryMsg: `✅ **LOAD**: Back to normal at **${avg.toFixed(2)}**`,
	});
	return `Load: ${avg.toFixed(2)}`;
}
