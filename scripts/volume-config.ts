import si from "systeminformation";
import { humanReadableBytes } from "../src/lib/helpers";

const readableVolumes: {
	name: string;
	usedBytes: string;
	availableBytes: string;
	usePercentage: number;
	mountPoint: string;
	totalSize: string;
	rawSize: number;
}[] = [];

console.log("Fetching volume information...");
const rawFsSize = await si.fsSize();
for (const rawFs of rawFsSize) {
	readableVolumes.push({
		name: rawFs.fs,
		usedBytes: humanReadableBytes(rawFs.used),
		availableBytes: humanReadableBytes(rawFs.available),
		totalSize: humanReadableBytes(rawFs.size),
		rawSize: rawFs.size,
		usePercentage: rawFs.use,
		mountPoint: rawFs.mount,
	});
}

if (readableVolumes.length === 0) {
	console.log("No volumes found.");
	process.exit(0);
}

console.log(`Found ${readableVolumes.length} volume(s)`);

// Sort by size
const sortedVolumes = readableVolumes.sort((a, b) => b.rawSize - a.rawSize);

const likelyRootVolume = sortedVolumes[0];
if (!likelyRootVolume) {
	console.log("No volumes found.");
	process.exit(0);
}

console.log("Likely your root volume:");
console.log(
	`${likelyRootVolume.name}: ${likelyRootVolume.totalSize} (${likelyRootVolume.usePercentage}%) mounted at ${likelyRootVolume.mountPoint}`,
);
console.log("---");
console.log("Other volumes:");
for (const volume of sortedVolumes.slice(1)) {
	console.log(
		`${volume.name}: ${volume.totalSize} (${volume.usePercentage}%) mounted at ${volume.mountPoint}`,
	);
}
