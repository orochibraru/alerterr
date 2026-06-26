import { z } from "zod";

const DiscordNotifierSchema = z.object({
	type: z.literal("discord"),
	webhookUrl: z
		.string()
		.url(
			'Must be a valid Discord webhook URL (e.g. "https://discord.com/api/webhooks/<id>/<token>")',
		),
});

const NotifierSchema = z.discriminatedUnion("type", [DiscordNotifierSchema]);

const CpuCheckSchema = z.object({
	enabled: z.boolean({ error: "Must be true or false" }).default(true),
	usageThresholdPercent: z
		.number({ error: "Must be a number" })
		.min(0, "Must be at least 0")
		.max(100, "Must be at most 100")
		.default(90),
	tempThresholdCelsius: z
		.number({ error: "Must be a number (temperature in °C)" })
		.positive("Must be a positive temperature in °C (e.g. 85)")
		.default(85),
});

const LoadCheckSchema = z.object({
	enabled: z.boolean({ error: "Must be true or false" }).default(true),
	threshold: z
		.number({ error: "Must be a number" })
		.positive(
			'Must be a positive number representing Linux load average (e.g. 8.0 means "8 processes active on average")',
		)
		.default(8.0),
});

const MemoryCheckSchema = z.object({
	enabled: z.boolean({ error: "Must be true or false" }).default(true),
	usageThresholdPercent: z
		.number({ error: "Must be a number" })
		.min(0, "Must be at least 0")
		.max(100, "Must be at most 100")
		.default(90),
});

const DiskCheckSchema = z.object({
	enabled: z.boolean({ error: "Must be true or false" }).default(true),
	usageThresholdPercent: z
		.number({ error: "Must be a number" })
		.min(0, "Must be at least 0")
		.max(100, "Must be at most 100")
		.default(90),
	paths: z
		.array(z.string({ error: 'Must be a filesystem path string (e.g. "/")' }), {
			error: "Must be an array of filesystem paths",
		})
		.min(1, 'Must include at least one path to monitor (e.g. ["/"])')
		.default(["/"]),
});

const ChecksSchema = z.object({
	cpu: CpuCheckSchema.default(CpuCheckSchema.parse({})),
	load: LoadCheckSchema.default(LoadCheckSchema.parse({})),
	memory: MemoryCheckSchema.default(MemoryCheckSchema.parse({})),
	disk: DiskCheckSchema.default(DiskCheckSchema.parse({})),
});

export const ConfigSchema = z.object({
	$schema: z.string().optional(),
	intervalSeconds: z
		.number({ error: "Must be a number" })
		.positive("Must be a positive number of seconds between checks (e.g. 60)")
		.default(60),
	checks: ChecksSchema.default(ChecksSchema.parse({})),
	notifiers: z
		.array(NotifierSchema, { error: "Must be an array of notifier objects" })
		.min(1, "At least one notifier must be configured"),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(path = "./config.json"): Promise<Config> {
	const file = Bun.file(path);
	if (!(await file.exists())) {
		throw new Error(
			`Config file not found at "${path}". Copy config.example.json to config.json and fill it in.`,
		);
	}
	const raw = JSON.parse(await file.text()) as unknown;
	const result = ConfigSchema.safeParse(raw);
	if (!result.success) {
		const issues = result.error.issues
			.map((i) => `  • ${i.path.join(".")}: ${i.message}`)
			.join("\n");
		throw new Error(`Invalid config:\n${issues}`);
	}
	return result.data;
}
