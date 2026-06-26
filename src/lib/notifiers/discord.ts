export async function sendDiscordAlert(webhookUrl: string, message: string) {
	try {
		const res = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: message }),
		});
		if (!res.ok) {
			console.error(
				`Discord webhook returned ${res.status}: ${await res.text()}`,
			);
		}
	} catch (error) {
		console.error("Failed to send alert to Discord:", error);
	}
}
