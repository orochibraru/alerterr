import { loadConfig } from "../../config";
import { logger } from "../logger";
import { Notifiers } from "../notifiers";

export async function validate() {
	await loadConfig();
	try {
		const notifiers = new Notifiers();
		await notifiers.alert("This is a test alert.");
		logger.info("Test alert sent successfully.");
	} catch (error) {
		logger.error(`Failed to send test alert: ${JSON.stringify(error)}`);
	}
}
