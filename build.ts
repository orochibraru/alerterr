import { mkdirSync, renameSync, rmSync } from "node:fs";
import { logger } from "./src/lib/logger";

enum Architecture {
	X64 = "x64",
	ARM64 = "arm64",
}

enum Target {
	WIN = "windows",
	LINUX = "linux",
	MAC = "darwin",
}

// Compile targets:
// namespace Build {
//   type Architecture = "x64" | "arm64" | "aarch64";
//   type Libc = "glibc" | "musl";
//   type SIMD = "baseline" | "modern";
//   type CompileTarget =
//     | `bun-darwin-${Architecture}`
//     | `bun-darwin-${Architecture}-${SIMD}`
//     | `bun-linux-${Architecture}`
//     | `bun-linux-${Architecture}-${Libc}`
//     | `bun-linux-${Architecture}-${SIMD}`
//     | `bun-linux-${Architecture}-${SIMD}-${Libc}`
//     | `bun-windows-${Architecture}`
//     | `bun-windows-x64-${SIMD}`;
// }

function buildTargets(): Bun.Build.CompileTarget[] {
	return [
		// Linux
		`bun-${Target.LINUX}-${Architecture.X64}`,
		`bun-${Target.LINUX}-${Architecture.ARM64}`,
		// macOS
		`bun-${Target.MAC}-${Architecture.X64}`,
		`bun-${Target.MAC}-${Architecture.ARM64}`,
		// Windows
		`bun-${Target.WIN}-${Architecture.X64}`,
		`bun-${Target.WIN}-${Architecture.ARM64}`,
	];
}

async function main() {
	mkdirSync("dist", { recursive: true });

	const errors: string[] = [];
	const targets = buildTargets();

	for (const target of targets) {
		logger.info(`Building ${target}...`);
		const tmpDir = `dist/.tmp-${target}`;
		try {
			mkdirSync(tmpDir, { recursive: true });
			const res = await Bun.build({
				entrypoints: ["./src/index.ts"],
				compile: { target },
				outdir: tmpDir,
			});
			if (!res.success) {
				errors.push(`Failed to build ${target}`);
				continue;
			}
			const out = res.outputs[0];
			if (!out) {
				errors.push(`No output produced for ${target}`);
				continue;
			}
			const isWindows = target.includes("windows");
			const ext = isWindows ? ".exe" : "";
			renameSync(out.path, `dist/${target}${ext}`);
		} catch (e) {
			errors.push(`Failed to build ${target}: ${e}`);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	}

	if (errors.length > 0) {
		for (const err of errors) logger.error(err);
		process.exit(1);
	}

	logger.info("Build complete.");
}

void main();
