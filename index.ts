import si from "systeminformation";
import { type Config, loadConfig } from "./config";
import { sendDiscordAlert } from "./discord";

async function notify(config: Config, message: string) {
	for (const notifier of config.notifiers) {
		if (notifier.type === "discord") {
			await sendDiscordAlert(notifier.webhookUrl, message);
		}
	}
}

async function monitorServer(config: Config) {
	const { checks } = config;

	try {
		const tasks = await Promise.all([
			checks.cpu.enabled ? si.currentLoad() : null,
			checks.cpu.enabled ? si.cpuTemperature() : null,
			checks.load.enabled ? si.fullLoad() : null,
			checks.memory.enabled ? si.mem() : null,
			checks.disk.enabled ? si.fsSize() : null,
		]);

		const [cpuLoad, temp, fullLoad, mem, disks] = tasks;
		const parts: string[] = [];

		if (cpuLoad) {
			const cpuUsage = Math.round(cpuLoad.currentLoad);
			parts.push(`CPU: ${cpuUsage}%`);
			if (cpuUsage > checks.cpu.usageThresholdPercent) {
				await notify(config, `⚠️ **CPU LOAD**: Usage is at **${cpuUsage}%**`);
			}
		}

		if (temp) {
			const cpuTemp = Math.round(temp.max || temp.main || 0);
			parts.push(`Temp: ${cpuTemp}°C`);
			if (cpuTemp > checks.cpu.tempThresholdCelsius) {
				await notify(
					config,
					`🔥 **HEAT ALERT**: CPU temperature is at **${cpuTemp}°C**`,
				);
			}
		}

		if (fullLoad !== null) {
			parts.push(`Load: ${fullLoad}`);
			if (fullLoad > checks.load.threshold) {
				await notify(
					config,
					`🚨 **LOAD CRITICAL**: Load average is at **${fullLoad}**`,
				);
			}
		}

		if (mem) {
			const memUsage = Math.round((mem.used / mem.total) * 100);
			parts.push(`RAM: ${memUsage}%`);
			if (memUsage > checks.memory.usageThresholdPercent) {
				await notify(
					config,
					`🧠 **MEMORY ALERT**: RAM usage is at **${memUsage}%**`,
				);
			}
		}

		if (disks) {
			for (const disk of disks) {
				if (!checks.disk.paths.includes(disk.mount)) continue;
				const diskUsage = Math.round(disk.use);
				parts.push(`Disk(${disk.mount}): ${diskUsage}%`);
				if (diskUsage > checks.disk.usageThresholdPercent) {
					await notify(
						config,
						`💾 **DISK ALERT**: \`${disk.mount}\` usage is at **${diskUsage}%**`,
					);
				}
			}
		}

		console.log(`[${new Date().toISOString()}] ${parts.join(" | ")}`);
	} catch (error) {
		console.error("Error grabbing system stats:", error);
	}
}

const config = await loadConfig();
console.log("Homelab alerter started.");
monitorServer(config);
setInterval(() => monitorServer(config), config.intervalSeconds * 1000);
