#!/usr/bin/env bun

import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";

const execAsync = promisify(exec);

interface Segment {
	start: number;
	end: number;
	text: string;
}

interface ExtractedCallout {
	type: "count" | "rep";
	value: number;
	startTime: number;
	endTime: number;
	audioFile?: string;
}

// Analyze the transcript to find precise timing for each callout
function analyzeTranscript(segments: Segment[]): ExtractedCallout[] {
	const callouts: ExtractedCallout[] = [];

	// Based on the pattern, we know:
	// - Each count takes about 0.7 seconds (from SECONDS_PER_COUNT)
	// - Pattern is: "1, 2, 3, 4, 5, [rep]" repeated

	for (const segment of segments) {
		const text = segment.text.trim();
		const numbers = text.split(/[,\s]+/).filter((n) => n.match(/^\d+$/));

		if (numbers.length === 0) continue;

		// Calculate approximate duration per number in this segment
		const segmentDuration = segment.end - segment.start;
		const timePerNumber = segmentDuration / numbers.length;

		let currentTime = segment.start;
		let countInSequence = 0;

		for (const numStr of numbers) {
			const num = Number.parseInt(numStr);

			// Determine if this is a count (1-5) or a rep number
			if (num >= 1 && num <= 5 && countInSequence < 5) {
				callouts.push({
					type: "count",
					value: num,
					startTime: currentTime,
					endTime: currentTime + timePerNumber,
				});
				countInSequence++;
			} else {
				// This is a rep number
				callouts.push({
					type: "rep",
					value: num,
					startTime: currentTime,
					endTime: currentTime + timePerNumber,
				});
				countInSequence = 0; // Reset count sequence
			}

			currentTime += timePerNumber;

			// Reset count if we see "1" after a complete sequence
			if (num === 1 && countInSequence === 5) {
				countInSequence = 1;
			}
		}
	}

	return callouts;
}

// Extract a single audio clip using ffmpeg
async function extractAudioClip(
	inputFile: string,
	outputFile: string,
	startTime: number,
	duration: number,
) {
	const cmd = `ffmpeg -i "${inputFile}" -ss ${startTime.toFixed(3)} -t ${duration.toFixed(3)} -c copy "${outputFile}" -y`;

	try {
		await execAsync(cmd);
		console.log(`✅ Extracted: ${outputFile}`);
		return true;
	} catch (error) {
		console.error(`❌ Failed to extract ${outputFile}:`, error);
		return false;
	}
}

async function main() {
	// Read the manifest
	const manifestPath = path.join(
		process.cwd(),
		"public/audio/callout-manifest.json",
	);
	const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));

	// Read the full transcript
	const transcriptPath = path.join(
		process.cwd(),
		"public/audio/transcript.json",
	);
	const transcript = JSON.parse(await readFile(transcriptPath, "utf-8"));

	console.log("🔍 Analyzing transcript for precise callout timing...");

	// Extract precise callouts
	const callouts = analyzeTranscript(transcript.segments);

	// Group by type and value
	const uniqueCounts = new Map<number, ExtractedCallout>();
	const uniqueReps = new Map<number, ExtractedCallout>();

	for (const callout of callouts) {
		if (callout.type === "count" && !uniqueCounts.has(callout.value)) {
			uniqueCounts.set(callout.value, callout);
		} else if (callout.type === "rep" && !uniqueReps.has(callout.value)) {
			uniqueReps.set(callout.value, callout);
		}
	}

	console.log(`📊 Found ${uniqueCounts.size} unique count callouts`);
	console.log(`📊 Found ${uniqueReps.size} unique rep callouts`);

	// Create improved manifest
	const improvedManifest = {
		audioFile: manifest.audioFile,
		counts: {} as Record<
			number,
			{ start: number; end: number; duration: number }
		>,
		reps: {} as Record<
			number,
			{ start: number; end: number; duration: number }
		>,
		extractedAudio: {
			counts: {} as Record<number, string>,
			reps: {} as Record<number, string>,
		},
	};

	// Add counts to manifest
	for (const [num, callout] of uniqueCounts) {
		improvedManifest.counts[num] = {
			start: callout.startTime,
			end: callout.endTime,
			duration: callout.endTime - callout.startTime,
		};
	}

	// Add reps to manifest
	for (const [num, callout] of uniqueReps) {
		improvedManifest.reps[num] = {
			start: callout.startTime,
			end: callout.endTime,
			duration: callout.endTime - callout.startTime,
		};
	}

	// Save improved manifest
	const improvedManifestPath = path.join(
		process.cwd(),
		"public/audio/callout-manifest-improved.json",
	);
	await writeFile(
		improvedManifestPath,
		JSON.stringify(improvedManifest, null, 2),
	);
	console.log(`💾 Improved manifest saved to: ${improvedManifestPath}`);

	// Ask if user wants to extract audio clips
	console.log("\n🎯 To extract individual audio clips, run:");
	console.log("   bun run scripts/extract-audio-clips.ts");
}

main().catch(console.error);
