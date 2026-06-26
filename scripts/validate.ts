import { loadConfig } from "../src/config";
import { Notifiers } from "../src/lib/notifiers";

export async function validate() {
	await loadConfig();
	try {
		const notifiers = new Notifiers();
		await notifiers.alert("This is a test alert.");
		console.log("Test alert sent successfully.");
	} catch (error) {
		console.error("Failed to send test alert:", error);
	}
}
