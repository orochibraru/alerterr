import { loadConfig } from "./config";
import { Monitor } from "./lib/monitor";

const config = await loadConfig();
console.log("Alerterr started.");

const monitor = new Monitor();

async function startup() {
	monitor.runAllParallel();
}

try {
	await startup();
} catch (error) {
	console.error("Error during startup:", error);
	process.exit(1);
}

const interval = setInterval(() => {
	try {
		monitor.runAllParallel();
	} catch (error) {
		console.error("Error monitoring server:", error);
	}
}, config.intervalSeconds * 1000);

// Graceful shutdown, clear interval & notify
function gracefulShutdown() {
	clearInterval(interval);
	console.log("Alerter stopped.");
	process.exit(0);
}

// Graceful shutdown on SIGINT and SIGTERM.
process.on("SIGINT", () => {
	gracefulShutdown();
});

process.on("SIGTERM", () => {
	gracefulShutdown();
});

// Catch exceptions to trigger an automatic restart if applicable.
process.on("uncaughtException", (error) => {
	console.error("Uncaught exception:", error);
	process.exit(1);
});
