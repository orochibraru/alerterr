import { config } from "../config";
import { sendDiscordAlert } from "./notifiers/discord";

export async function notify(message: string) {
	console.log(`Sending alert: ${message}`);
	for (const notifier of config.notifiers) {
		if (notifier.type === "discord") {
			await sendDiscordAlert(notifier.webhookUrl, message);
		}
	}
}
