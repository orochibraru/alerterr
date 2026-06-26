import si, { type Systeminformation } from "systeminformation";
import { type Checks, config } from "../../config";
import type { IncidentStore } from "../incident-store";
import { logger } from "../logger";
import { Notifiers } from "../notifiers";
import { checkCpu } from "./checks/cpu";
import { checkDisk } from "./checks/disk";
import { checkGpu } from "./checks/gpu";
import { checkLoad } from "./checks/load";
import { checkMemory } from "./checks/memory";
import { checkTemperature } from "./checks/temperature";
import type { BreachOpts } from "./types";

export class Monitor {
	readonly checks: Checks;
	private readonly reminderIntervalMs: number;
	public volumes: Systeminformation.FsSizeData[] = [];
	private notifiers: Notifiers;
	private incidentStore: IncidentStore;
	private breachCounter = new Map<string, number>();

	public constructor(incidentStore: IncidentStore) {
		this.checks = structuredClone(config.checks);
		this.reminderIntervalMs = config.reminderIntervalMinutes * 60_000;
		this.notifiers = new Notifiers();
		this.incidentStore = incidentStore;
		void this.lazyInit();
	}

	private async lazyInit() {
		await this.refreshDisks();
	}

	public async refreshDisks() {
		logger.debug("Refreshing disk list...");
		this.volumes = await si.fsSize();
		logger.debug(
			`Found ${this.volumes.length} volume(s): ${this.volumes.map((v) => v.fs).join(", ")}`,
		);
	}

	private incrementBreach(key: string): number {
		const count = (this.breachCounter.get(key) ?? 0) + 1;
		this.breachCounter.set(key, count);
		return count;
	}

	private resetBreach(key: string): void {
		this.breachCounter.delete(key);
	}

	private async handleBreach(opts: BreachOpts): Promise<void> {
		const {
			metric,
			volume,
			value,
			threshold,
			consecutiveRequired,
			openMsg,
			reminderMsg,
			recoveryMsg,
		} = opts;
		const key = volume != null ? `${metric}:${volume}` : metric;
		const activeIncident = this.incidentStore.getActiveIncident(
			metric,
			volume ?? undefined,
		);

		if (value > threshold) {
			if (activeIncident) {
				const lastNotif = this.incidentStore.getLastNotification(
					activeIncident.id,
				);
				const elapsed =
					Date.now() - (lastNotif?.sent_at ?? activeIncident.started_at);
				logger.debug(
					`[${key}] breach ongoing (incident #${activeIncident.id}), elapsed ${Math.round(elapsed / 1000)}s`,
				);
				if (elapsed > this.reminderIntervalMs) {
					logger.debug(`[${key}] reminder interval exceeded, re-alerting`);
					await this.notifiers.alert(reminderMsg);
					this.incidentStore.recordNotification({
						incidentId: activeIncident.id,
						type: "reminder",
						succeeded: true,
					});
				}
			} else {
				const count = this.incrementBreach(key);
				logger.debug(
					`[${key}] breach ${count}/${consecutiveRequired} (value: ${value}, threshold: ${threshold})`,
				);
				if (count >= consecutiveRequired) {
					logger.debug(`[${key}] opening incident`);
					const incident = this.incidentStore.openIncident({
						metric,
						volume,
						value,
						threshold,
					});
					await this.notifiers.alert(openMsg);
					this.incidentStore.recordNotification({
						incidentId: incident.id,
						type: "alert",
						succeeded: true,
					});
					this.resetBreach(key);
				}
			}
		} else {
			this.resetBreach(key);
			if (activeIncident) {
				logger.debug(
					`[${key}] value normalised, resolving incident #${activeIncident.id}`,
				);
				this.incidentStore.resolveIncident(activeIncident.id);
				await this.notifiers.alert(recoveryMsg);
				this.incidentStore.recordNotification({
					incidentId: activeIncident.id,
					type: "recovery",
					succeeded: true,
				});
			} else {
				logger.debug(`[${key}] value normal (${value} ≤ ${threshold})`);
			}
		}
	}

	public async runAllParallel() {
		const parts = (
			await Promise.all([
				this.checkCpu(),
				this.checkLoad(),
				this.checkMemory(),
				this.checkDisk(),
				this.checkTemperature(),
				this.checkGpu(),
			])
		).filter((p): p is string => p !== undefined);

		logger.info(parts.join(" | "));
	}

	public checkCpu() {
		return checkCpu({
			checks: this.checks.cpu,
			breach: (o) => this.handleBreach(o),
		});
	}

	public checkLoad() {
		return checkLoad({
			checks: this.checks.load,
			breach: (o) => this.handleBreach(o),
		});
	}

	public checkMemory() {
		return checkMemory({
			checks: this.checks.memory,
			breach: (o) => this.handleBreach(o),
		});
	}

	public checkDisk() {
		return checkDisk({
			checks: this.checks.disk,
			volumes: this.volumes,
			breach: (o) => this.handleBreach(o),
		});
	}

	public checkTemperature() {
		return checkTemperature({
			checks: this.checks.temperature,
			breach: (o) => this.handleBreach(o),
		});
	}

	public checkGpu() {
		return checkGpu({
			checks: this.checks.gpu,
			breach: (o) => this.handleBreach(o),
		});
	}
}
