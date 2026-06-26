import { type Config, loadConfig } from "./config";
import { Monitor } from "./lib/monitor";

export class Process {
	private config: Config | undefined;
	private monitor: Monitor | undefined;
	private runCount: number = 0;
	private interval: NodeJS.Timeout | undefined;

	constructor() {
		void this.lazyInit();
	}

	private async lazyInit() {
		this.config = await loadConfig();
		this.monitor = new Monitor();
	}

	private isOneOfTenRuns() {
		return this.runCount % 10 === 0;
	}

	public async start() {
		if (!this.monitor || !this.config) {
			throw new Error("Something went wrong when intializing the process");
		}

		try {
			console.log("Starting up...");
			await this.monitor.runAllParallel();
			console.log("Alerter started.");
		} catch (error) {
			console.error("Error during startup:", error);
			process.exit(1);
		}

		this.interval = setInterval(async () => {
			if (!this.monitor) {
				throw new Error("Something went wrong when intializing the process");
			}
			try {
				await this.monitor.runAllParallel();
				this.runCount++;
				if (this.isOneOfTenRuns()) {
					await this.monitor.refreshDisks();
				}
			} catch (error) {
				console.error("Error monitoring server:", error);
			}
		}, this.config.intervalSeconds * 1000);

		process.on("SIGINT", () => {
			this.shutdown();
		});

		process.on("SIGTERM", () => {
			this.shutdown();
		});

		process.on("uncaughtException", (error) => {
			this.shutdown();
			console.error("Uncaught exception:", error);
			process.exit(1);
		});
	}

	public shutdown() {
		console.log("Alerter shutting down...");
		if (this.interval) {
			clearInterval(this.interval);
		}
		process.exit(0);
	}
}
