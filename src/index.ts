import { sleep } from "bun";
import { program } from "commander";
import packagejson from "../package.json";
import { setup } from "../scripts/setup";
import { Process } from "./process";

program
	.name("Alerterr")
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

program.parse(process.argv);
