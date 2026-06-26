import si from "systeminformation";
import { type Checks, config } from "../config";
import { humanReadableBytes } from "./helpers";
import { notify } from "./notify";

export class Monitor {
	readonly checks: Checks;

	public constructor() {
		this.checks = config.checks;
	}

	public async runAllParallel() {
		await Promise.all([
			this.checkCpu(),
			this.checkLoad(),
			this.checkMemory(),
			this.checkDisk(),
		]);
	}

	public async checkCpu() {
		if (!this.checks.cpu.enabled) {
			return;
		}
		const cpuLoad = await si.currentLoad();
		const cpuUsage = Math.round(cpuLoad.currentLoad);
		if (cpuUsage > this.checks.cpu.usageThresholdPercent) {
			await notify(`⚠️ **CPU LOAD**: Usage is at **${cpuUsage}%**`);
		}
	}

	public async checkLoad() {
		if (!this.checks.load.enabled) {
			return;
		}
		const cpuLoad = await si.currentLoad();
		const avgLoad = cpuLoad.avgLoad;
		if (avgLoad > this.checks.load.threshold) {
			await notify(
				`🚨 **LOAD CRITICAL**: Load average is at **${avgLoad.toFixed(2)}**`,
			);
		}
	}

	public async checkDisk() {
		if (!this.checks.disk.enabled) {
			return;
		}
		const rawFsSize = await si.fsSize();
		for (const rawFs of rawFsSize) {
			console.log(rawFs);
			const diskUsage = Math.round((rawFs.used / rawFs.size) * 100);
			if (diskUsage > this.checks.disk.usageThresholdPercent) {
				await notify(
					`⚠️ **DISK USAGE**: Usage is at **${diskUsage}% (${humanReadableBytes(rawFs.used)}/${humanReadableBytes(rawFs.size)})**`,
				);
			}
		}
	}

	public async checkMemory() {
		if (!this.checks.memory.enabled) {
			return;
		}
		const rawMem = await si.mem();
		const memUsage = Math.round((rawMem.used / rawMem.total) * 100);
		if (memUsage > this.checks.memory.usageThresholdPercent) {
			await notify(
				`⚠️ **MEMORY USAGE**: Usage is at **${memUsage}% (${humanReadableBytes(rawMem.used)}/${humanReadableBytes(rawMem.total)})**`,
			);
		}
	}
}
