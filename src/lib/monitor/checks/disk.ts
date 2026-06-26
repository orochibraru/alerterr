import type { Systeminformation } from "systeminformation";
import type { DiskChecks } from "../../../config";
import { humanReadableBytes } from "../../helpers";
import { logger } from "../../logger";
import type { BreachOpts } from "../types";

type Deps = {
	checks: DiskChecks;
	volumes: Systeminformation.FsSizeData[];
	breach: (opts: BreachOpts) => Promise<void>;
};

export async function checkDisk({
	checks,
	volumes,
	breach,
}: Deps): Promise<string | undefined> {
	if (!checks.enabled) return;
	const selected = volumes.filter((v) => checks.volumes.includes(v.fs));
	if (selected.length === 0) return "No volumes found";

	let total = 0;
	for (const vol of selected) {
		const usage = Math.round((vol.used / vol.size) * 100);
		logger.debug(
			`Disk ${vol.fs}: ${usage}% (${humanReadableBytes(vol.used)} / ${humanReadableBytes(vol.size)})`,
		);
		total += usage;
		await breach({
			metric: "disk",
			volume: vol.fs,
			value: usage,
			threshold: checks.usageThresholdPercent,
			consecutiveRequired: 1,
			openMsg: `⚠️ **DISK USAGE** (${vol.fs}): Usage is at **${usage}% (${humanReadableBytes(vol.used)}/${humanReadableBytes(vol.size)})**`,
			reminderMsg: `⏰ **DISK REMINDER** (${vol.fs}): Still at **${usage}%**`,
			recoveryMsg: `✅ **DISK** (${vol.fs}): Back to normal at **${usage}%**`,
		});
	}
	return `Disk: ${total}%`;
}
