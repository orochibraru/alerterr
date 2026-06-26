import si from "systeminformation";
import type { TemperatureChecks } from "../../../config";
import { logger } from "../../logger";
import type { BreachOpts } from "../types";

type Deps = {
	checks: TemperatureChecks;
	breach: (opts: BreachOpts) => Promise<void>;
};

export async function checkTemperature({
	checks,
	breach,
}: Deps): Promise<string | undefined> {
	const [cpuTemp, graphics] = await Promise.all([
		si.cpuTemperature(),
		si.graphics(),
	]);

	const parts: string[] = [];

	const cpuMax = cpuTemp.max ?? cpuTemp.main;
	if (cpuMax != null) {
		logger.debug(`CPU temp: ${cpuMax}°C`);
		if (checks.enabled) {
			await breach({
				metric: "temp:cpu",
				volume: null,
				value: cpuMax,
				threshold: checks.cpuThresholdCelsius,
				consecutiveRequired: checks.consecutiveBreaches,
				openMsg: `🌡️ **CPU TEMP**: Temperature is at **${cpuMax}°C**`,
				reminderMsg: `⏰ **CPU TEMP REMINDER**: Still at **${cpuMax}°C**`,
				recoveryMsg: `✅ **CPU TEMP**: Back to normal at **${cpuMax}°C**`,
			});
		}
		parts.push(`CPU ${cpuMax}°C`);
	}

	for (const ctrl of graphics.controllers) {
		const gpuTemp = ctrl.temperatureGpu;
		if (gpuTemp != null && gpuTemp > 0) {
			logger.debug(`GPU temp (${ctrl.name}): ${gpuTemp}°C`);
			if (checks.enabled) {
				await breach({
					metric: `temp:gpu:${ctrl.name}`,
					volume: null,
					value: gpuTemp,
					threshold: checks.gpuThresholdCelsius,
					consecutiveRequired: checks.consecutiveBreaches,
					openMsg: `🌡️ **GPU TEMP** (${ctrl.name}): Temperature is at **${gpuTemp}°C**`,
					reminderMsg: `⏰ **GPU TEMP REMINDER** (${ctrl.name}): Still at **${gpuTemp}°C**`,
					recoveryMsg: `✅ **GPU TEMP** (${ctrl.name}): Back to normal at **${gpuTemp}°C**`,
				});
			}
			parts.push(`${ctrl.name} ${gpuTemp}°C`);
		}
	}

	if (parts.length === 0) return "Temp: N/A";
	return `Temp: ${parts.join(" | ")}`;
}
