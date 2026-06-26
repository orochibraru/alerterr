import { sleep } from "bun";
import { program } from "commander";
import packagejson from "../package.json";
import { setup } from "../scripts/setup";
import { validate } from "../scripts/validate";
import { loadConfig } from "./config";
import { getDb, initDb } from "./lib/db";
import { IncidentStore } from "./lib/incident-store";
import { logger } from "./lib/logger";
import { Process } from "./process";

program
	.name("Baba")
	.description("Monitor your homelab server and alert on issues.")
	.version(packagejson.version);

program
	.command("start")
	.description("Start the monitoring process.")
	.action(async () => {
		const process = new Process();
		await sleep(1000);
		process.start();
	});

program
	.command("setup")
	.description("Start the monitoring process.")
	.action(async () => {
		await setup();
	});

program
	.command("validate")
	.description("Validate the webhooks by sending a test alert.")
	.action(async () => {
		await validate();
	});

async function openIncidentDb() {
	const cfg = await loadConfig();
	initDb(cfg.database.path);
	return new IncidentStore(getDb());
}

function formatDate(ms: number): string {
	return new Date(ms).toISOString().replace("T", " ").slice(0, 19);
}

program
	.command("list incidents")
	.description("List recorded incidents.")
	.option("-n, --limit <number>", "Maximum number of incidents to show", "50")
	.action(async (_: string, opts: { limit: string }) => {
		const store = await openIncidentDb();
		const incidents = store.listIncidents(Number(opts.limit));

		if (incidents.length === 0) {
			logger.info("No incidents recorded.");
			return;
		}

		const col = (s: string, w: number) => s.padEnd(w).slice(0, w);
		const header =
			`${"ID".padEnd(6)}${"Metric".padEnd(28)}${"Volume".padEnd(16)}` +
			`${"Started".padEnd(22)}${"Status".padEnd(10)}${"Peak".padEnd(10)}` +
			`${"Threshold".padEnd(10)}${"Notifs".padEnd(6)}`;
		const divider = "─".repeat(header.length);

		console.log(header);
		console.log(divider);

		for (const inc of incidents) {
			const status = inc.resolved_at ? "RESOLVED" : "OPEN";
			console.log(
				`${col(String(inc.id), 6)}` +
					`${col(inc.metric, 28)}` +
					`${col(inc.volume ?? "-", 16)}` +
					`${col(formatDate(inc.started_at), 22)}` +
					`${col(status, 10)}` +
					`${col(String(inc.peak_value), 10)}` +
					`${col(String(inc.threshold), 10)}` +
					`${col(String(inc.notification_count), 6)}`,
			);
		}
	});

program
	.command("get incident <id>")
	.description("Get details of an incident by ID.")
	.action(async (_: string, id: string) => {
		const store = await openIncidentDb();
		const incident = store.getIncident(Number(id));

		if (!incident) {
			console.error(`Incident #${id} not found.`);
			process.exit(1);
		}

		const status = incident.resolved_at ? "RESOLVED" : "OPEN";
		console.log(`\nIncident #${incident.id}`);
		console.log(`  Metric:     ${incident.metric}`);
		if (incident.volume) console.log(`  Volume:     ${incident.volume}`);
		console.log(`  Status:     ${status}`);
		console.log(`  Started:    ${formatDate(incident.started_at)}`);
		if (incident.resolved_at) {
			console.log(`  Resolved:   ${formatDate(incident.resolved_at)}`);
		}
		console.log(`  Peak value: ${incident.peak_value}`);
		console.log(`  Threshold:  ${incident.threshold}`);

		if (incident.notifications.length === 0) {
			console.log("\n  No notifications recorded.");
		} else {
			console.log(`\n  Notifications (${incident.notifications.length}):`);
			for (const n of incident.notifications) {
				const ok = n.succeeded ? "✓" : "✗";
				console.log(`    ${formatDate(n.sent_at)}  ${n.type.padEnd(10)} ${ok}`);
			}
		}
		console.log();
	});

program.parse(process.argv);
