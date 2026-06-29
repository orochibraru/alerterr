import { PinoTransport } from "@loglayer/transport-pino";
import { LogLayer } from "loglayer";
import pino from "pino";
import pretty from "pino-pretty";

/* c8 ignore next */
// biome-ignore format: single-line ternary required for c8 to suppress the unreachable TTY branch
// Using pretty() as a direct stream avoids pino's worker-thread transport, which fails in Bun compiled binaries.
const pinoLogger = pino({ level: "info" }, process.stdout.isTTY ? pretty({ colorize: true, translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l", ignore: "pid,hostname" }) : process.stdout);

export const logger = new LogLayer({
	transport: new PinoTransport({
		logger: pinoLogger,
	}),
});

export function setLogLevel(level: string): void {
	pinoLogger.level = level;
}
