#!/usr/bin/env bun

import { exec } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";

const execAsync = promisify(exec);

interface CalloutTiming {
	type: "count" | "rep";
	value: number;
	startTime: number;
	endTime: number;
	text: string;
}

async function extractAudioClip(
	inputFile: string,
	outputFile: string,
	startTime: number,
	duration: number,
) {
	const cmd = `ffmpeg -i "${inputFile}" -ss ${startTime.toFixed(3)} -t ${duration.toFixed(3)} -acodec pcm_s16le -ar 44100 -ac 1 "${outputFile}" -y`;

	try {
		await execAsync(cmd);
		console.log(`✅ ${outputFile}`);
		return true;
	} catch (error) {
		console.error(`❌ Failed: ${outputFile}`);
		return false;
	}
}

async function main() {
	// Read the detailed manifest
	const manifestPath = path.join(
		process.cwd(),
		"public/audio/callout-manifest-detailed.json",
	);
	const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));

	// For better quality, let's use specific timings for counts
	// Based on the pattern, each count takes about 0.7 seconds
	// Let's find a clean sequence from the middle of the recording

	// From looking at the transcript, a clean sequence starts around 232 seconds:
	// "Let's go. 1, 2, 3, 4, 5, 1, 1, 2, 3, 4, 5, 2..."

	const cleanCountTimings = {
		1: { start: 239.5, duration: 0.6 }, // "1" from a clean sequence
		2: { start: 240.2, duration: 0.6 }, // "2"
		3: { start: 240.9, duration: 0.6 }, // "3"
		4: { start: 241.6, duration: 0.6 }, // "4"
		5: { start: 242.3, duration: 0.6 }, // "5"
	};

	// Use the higher quality audio if available
	const audioFile = existsSync(
		path.join(process.cwd(), "public/6counts_15min.wav"),
	)
		? "public/6counts_15min.wav" // Higher quality
		: "public/6counts_12min_compressed.wav";

	console.log(`📂 Using audio: ${audioFile}`);
	console.log("🎯 Extracting clean count callouts...\n");

	// Extract clean count callouts
	for (const [num, timing] of Object.entries(cleanCountTimings)) {
		const outputFile = path.join(
			process.cwd(),
			`public/audio/counts/${num}_clean.wav`,
		);
		await extractAudioClip(
			audioFile,
			outputFile,
			timing.start,
			timing.duration,
		);
	}

	// Also extract some clear rep numbers from better positions
	console.log("\n🔢 Extracting clear rep callouts...\n");

	// These are based on the manifest but with manual adjustments for clarity
	const clearReps = [
		{ num: 10, start: 33.5, duration: 0.8 }, // Clear "10"
		{ num: 20, start: 57.5, duration: 0.8 }, // Clear "20"
		{ num: 30, start: 155.5, duration: 0.8 }, // Clear "30"
		{ num: 50, start: 230.5, duration: 0.8 }, // Clear "50"
		{ num: 100, start: 476.5, duration: 1.0 }, // Clear "100"
	];

	for (const rep of clearReps) {
		const outputFile = path.join(
			process.cwd(),
			`public/audio/reps/${rep.num}_clean.wav`,
		);
		await extractAudioClip(audioFile, outputFile, rep.start, rep.duration);
	}

	console.log(
		"\n✨ Done! Test the *_clean.wav files to see if they're better.",
	);
	console.log(
		"\n📝 If these sound good, rename them to replace the originals:",
	);
	console.log(
		'   cd public/audio/counts && for f in *_clean.wav; do mv "$f" "${f/_clean/}"; done',
	);
}

main().catch(console.error);
