import { config } from "../config";
import { DiscordNotifier } from "./notifiers/discord";

export async function notify(message: string) {
	console.log(`Sending alert: ${message}`);
	for (const notifier of config.notifiers) {
		if (notifier.type === "discord") {
			const notifierInstance = new DiscordNotifier({
				webhookUrl: notifier.webhookUrl,
			});
			await notifierInstance.sendAlert(message);
		}
	}
}
