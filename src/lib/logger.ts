import { PinoTransport } from "@loglayer/transport-pino";
import { LogLayer } from "loglayer";
import pino from "pino";

const pinoLogger = pino({
	level: "trace", // On laisse tout passer, LogLayer filtrera si besoin
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l", // Format lisible de humain
			ignore: "pid,hostname", // On vire le bruit inutile en local
		},
	},
});

export const logger = new LogLayer({
	transport: new PinoTransport({
		logger: pinoLogger,
	}),
});
