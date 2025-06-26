#!/usr/bin/env bun

import { exec } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { promisify } from "util";
import { mkdir, readFile } from "fs/promises";

const execAsync = promisify(exec);

interface CalloutInfo {
	start: number;
	end: number;
	duration: number;
	text: string;
}

interface DetailedManifest {
	audioFile: string;
	originalAudioFile?: string;
	counts: Record<number, CalloutInfo>;
	reps: Record<number, CalloutInfo>;
}

async function extractAudioClip(
	inputFile: string,
	outputFile: string,
	startTime: number,
	endTime: number,
	padStart = 0.1, // Add small padding before
	padEnd = 0.1, // Add small padding after
) {
	// Adjust times with padding
	const adjustedStart = Math.max(0, startTime - padStart);
	const duration = endTime - startTime + padStart + padEnd;

	// Use the compressed audio for faster processing, but we could use the original for better quality
	const cmd = `ffmpeg -i "${inputFile}" -ss ${adjustedStart.toFixed(3)} -t ${duration.toFixed(3)} -acodec pcm_s16le -ar 44100 -ac 1 "${outputFile}" -y`;

	try {
		console.log(`Extracting: ${outputFile}`);
		await execAsync(cmd);
		return true;
	} catch (error) {
		console.error(`Failed to extract ${outputFile}:`, error);
		return false;
	}
}

async function main() {
	// Read the detailed manifest
	const manifestPath = path.join(
		process.cwd(),
		"public/audio/callout-manifest-detailed.json",
	);
	const manifest: DetailedManifest = JSON.parse(
		await readFile(manifestPath, "utf-8"),
	);

	// Create output directories
	const audioDir = path.join(process.cwd(), "public/audio");
	const countsDir = path.join(audioDir, "counts");
	const repsDir = path.join(audioDir, "reps");

	if (!existsSync(countsDir)) {
		await mkdir(countsDir, { recursive: true });
	}
	if (!existsSync(repsDir)) {
		await mkdir(repsDir, { recursive: true });
	}

	// Determine which audio file to use
	const sourceAudio = path.join(
		process.cwd(),
		"public",
		manifest.audioFile.substring(1),
	);

	console.log(`📂 Using source audio: ${sourceAudio}`);
	console.log(`🎯 Extracting audio clips...`);

	// Extract count callouts (1-5)
	console.log("\n📢 Extracting count callouts:");
	let countSuccess = 0;
	for (const [num, callout] of Object.entries(manifest.counts)) {
		const outputFile = path.join(countsDir, `${num}.wav`);
		const success = await extractAudioClip(
			sourceAudio,
			outputFile,
			callout.start,
			callout.end,
			0.05, // Less padding for counts since they're short
			0.05,
		);
		if (success) countSuccess++;
	}
	console.log(
		`✅ Extracted ${countSuccess}/${Object.keys(manifest.counts).length} count callouts`,
	);

	// Extract rep callouts (limit to first 50 for testing)
	console.log("\n🔢 Extracting rep callouts:");
	let repSuccess = 0;
	const repEntries = Object.entries(manifest.reps);
	const repsToExtract = repEntries.slice(0, 50); // Extract first 50 reps

	for (const [num, callout] of repsToExtract) {
		const outputFile = path.join(repsDir, `${num}.wav`);
		const success = await extractAudioClip(
			sourceAudio,
			outputFile,
			callout.start,
			callout.end,
			0.1, // Slightly more padding for rep numbers
			0.1,
		);
		if (success) repSuccess++;
	}
	console.log(
		`✅ Extracted ${repSuccess}/${repsToExtract.length} rep callouts (first 50)`,
	);

	// Create a sprite manifest for easy loading
	const spriteManifest = {
		baseUrl: "/audio",
		counts: {} as Record<number, string>,
		reps: {} as Record<number, string>,
	};

	// Add count files
	for (const num of Object.keys(manifest.counts)) {
		spriteManifest.counts[Number(num)] = `/audio/counts/${num}.wav`;
	}

	// Add rep files (only the ones we extracted)
	for (const [num] of repsToExtract) {
		spriteManifest.reps[Number(num)] = `/audio/reps/${num}.wav`;
	}

	// Save sprite manifest
	const spriteManifestPath = path.join(audioDir, "audio-sprites.json");
	await Bun.write(spriteManifestPath, JSON.stringify(spriteManifest, null, 2));

	console.log(`\n💾 Saved sprite manifest to: ${spriteManifestPath}`);
	console.log("\n🎉 Audio extraction complete!");
	console.log("\n📝 Next steps:");
	console.log("1. Test the extracted audio files");
	console.log("2. Extract more rep numbers if needed");
	console.log("3. Update the app to use these audio sprites");

	// Optional: Extract more reps
	if (repEntries.length > 50) {
		console.log(`\n💡 To extract ALL ${repEntries.length} rep callouts, run:`);
		console.log("   bun run scripts/extract-all-reps.ts");
	}
}

main().catch(console.error);
