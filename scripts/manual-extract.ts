#!/usr/bin/env bun

import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// ===== EDIT THESE TIMINGS =====
// Adjust these values until each count sounds correct
const MANUAL_TIMINGS = {
	counts: {
		1: { start: 10.2, duration: 0.49 }, // Adjust start time for "1"
		2: { start: 10.7, duration: 0.43 }, // Adjust start time for "2"
		3: { start: 11.2, duration: 0.49 }, // Adjust start time for "3"
		4: { start: 11.7, duration: 0.44 }, // Adjust start time for "4"
		5: { start: 12.2, duration: 0.49 }, // Adjust start time for "5"
	},
	reps: {
		// Add rep timings here as needed
		6: { start: 20.0, duration: 0.8 },
		10: { start: 33.5, duration: 0.8 },
		20: { start: 57.5, duration: 0.8 },
		50: { start: 230.5, duration: 0.8 },
		100: { start: 476.5, duration: 1.0 },
	},
};

// Choose audio file (change this if needed)
const AUDIO_FILE = "public/6counts_12min_compressed.wav";
// const AUDIO_FILE = "public/6counts_15min.wav";  // Uncomment for higher quality

// ==============================

async function extractAudio(
	inputFile: string,
	outputFile: string,
	startTime: number,
	duration: number,
) {
	const cmd = `ffmpeg -i "${inputFile}" -ss ${startTime.toFixed(3)} -t ${duration.toFixed(3)} -acodec pcm_s16le -ar 44100 -ac 1 "${outputFile}" -y`;

	try {
		await execAsync(cmd);
		return true;
	} catch (error) {
		console.error(`❌ Failed: ${outputFile}`);
		console.error(error);
		return false;
	}
}

async function main() {
	console.log(`🎯 Manual Audio Extraction`);
	console.log(`📂 Source: ${AUDIO_FILE}`);
	console.log(`\n🔧 Edit the MANUAL_TIMINGS in this script to adjust timing\n`);

	// Extract counts
	console.log("📢 Extracting counts:");
	for (const [num, timing] of Object.entries(MANUAL_TIMINGS.counts)) {
		const outputFile = path.join(
			process.cwd(),
			`public/audio/counts/${num}.wav`,
		);
		const success = await extractAudio(
			AUDIO_FILE,
			outputFile,
			timing.start,
			timing.duration,
		);
		if (success) {
			console.log(
				`✅ Count ${num}: ${timing.start}s (${timing.duration}s) -> ${outputFile}`,
			);
		}
	}

	// Extract reps
	if (Object.keys(MANUAL_TIMINGS.reps).length > 0) {
		console.log("\n🔢 Extracting reps:");
		for (const [num, timing] of Object.entries(MANUAL_TIMINGS.reps)) {
			const outputFile = path.join(
				process.cwd(),
				`public/audio/reps/${num}.wav`,
			);
			const success = await extractAudio(
				AUDIO_FILE,
				outputFile,
				timing.start,
				timing.duration,
			);
			if (success) {
				console.log(
					`✅ Rep ${num}: ${timing.start}s (${timing.duration}s) -> ${outputFile}`,
				);
			}
		}
	}

	console.log("\n✨ Done! Test the audio files and adjust timings as needed.");
	console.log("\n💡 Tips:");
	console.log("   - If a count sounds cut off, increase the start time");
	console.log("   - If you hear the previous sound, decrease the start time");
	console.log("   - Adjust duration if the clip is too short or too long");
	console.log("   - Re-run this script after each adjustment");
}

main().catch(console.error);
