import si from "systeminformation";
import type { GpuChecks } from "../../../config";
import { logger } from "../../logger";
import type { BreachOpts } from "../types";

type Deps = {
	checks: GpuChecks;
	breach: (opts: BreachOpts) => Promise<void>;
};

export async function checkGpu({
	checks,
	breach,
}: Deps): Promise<string | undefined> {
	if (!checks.enabled) return;
	const graphics = await si.graphics();
	const parts: string[] = [];

	for (const ctrl of graphics.controllers) {
		const util = ctrl.utilizationGpu;
		if (util == null) continue;
		logger.debug(`GPU utilization (${ctrl.name}): ${util}%`);
		await breach({
			metric: `gpu:${ctrl.name}`,
			volume: null,
			value: util,
			threshold: checks.vramThresholdPercent,
			consecutiveRequired: checks.consecutiveBreaches,
			openMsg: `⚠️ **GPU USAGE** (${ctrl.name}): Usage is at **${util}%**`,
			reminderMsg: `⏰ **GPU REMINDER** (${ctrl.name}): Still at **${util}%**`,
			recoveryMsg: `✅ **GPU** (${ctrl.name}): Back to normal at **${util}%**`,
		});
		parts.push(`${ctrl.name}: ${util}%`);
	}

	if (parts.length === 0) return "GPU: N/A";
	return `GPU: ${parts.join(" | ")}`;
}
