#!/usr/bin/env node

import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Configuration
const VIDEO_PATH = "./busy-dad-workout.mp4";
const OUTPUT_DIR = "./public/audio/callouts";
const TEMP_DIR = "./temp";

// Whisper transcript format (you'll get this from running Whisper)
// This is an example structure - you'll need to run Whisper first
const SAMPLE_TRANSCRIPT = {
	segments: [
		{ start: 1.2, end: 1.8, text: "One" },
		{ start: 2.0, end: 2.6, text: "Two" },
		{ start: 2.8, end: 3.4, text: "Three" },
		{ start: 3.6, end: 4.2, text: "Four" },
		{ start: 4.4, end: 5.0, text: "Five" },
		{ start: 5.2, end: 5.8, text: "Six" },
		// ... more segments
	],
};

async function extractAudioSegment(inputPath, outputPath, startTime, endTime) {
	const duration = endTime - startTime;
	const cmd = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -acodec pcm_s16le -ar 44100 -ac 1 "${outputPath}" -y`;

	try {
		await execAsync(cmd);
		console.log(`Extracted: ${outputPath}`);
	} catch (error) {
		console.error(`Failed to extract ${outputPath}:`, error);
	}
}

async function processTranscript(transcriptPath, audioPath) {
	// Create directories
	await fs.mkdir(OUTPUT_DIR, { recursive: true });
	await fs.mkdir(TEMP_DIR, { recursive: true });

	// Read the actual transcript from Whisper
	const transcript = JSON.parse(await fs.readFile(transcriptPath, "utf8"));

	// Extract all count callouts (1-6) and rep numbers (1-200)
	const callouts = new Map();

	for (const segment of transcript.segments) {
		const text = segment.text.trim().toLowerCase();

		// Check for count callouts
		const countWords = ["one", "two", "three", "four", "five", "six"];
		const countIndex = countWords.indexOf(text);
		if (countIndex !== -1) {
			const countNum = countIndex + 1;
			if (!callouts.has(`count-${countNum}`)) {
				callouts.set(`count-${countNum}`, {
					start: segment.start,
					end: segment.end,
					text: segment.text,
				});
			}
		}

		// Check for rep numbers (1-200)
		const numMatch = text.match(/^(\d+)$/);
		if (numMatch) {
			const repNum = Number.parseInt(numMatch[1]);
			if (repNum >= 1 && repNum <= 200) {
				if (!callouts.has(`rep-${repNum}`)) {
					callouts.set(`rep-${repNum}`, {
						start: segment.start,
						end: segment.end,
						text: segment.text,
					});
				}
			}
		}
	}

	// Extract audio segments
	console.log(`Found ${callouts.size} unique callouts`);

	for (const [key, segment] of callouts) {
		const outputPath = path.join(OUTPUT_DIR, `${key}.wav`);
		await extractAudioSegment(
			audioPath,
			outputPath,
			segment.start - 0.1, // Add small buffer
			segment.end + 0.1,
		);
	}

	// Create manifest file
	const manifest = {
		counts: {},
		reps: {},
	};

	for (const [key, segment] of callouts) {
		if (key.startsWith("count-")) {
			manifest.counts[key.replace("count-", "")] = `/audio/callouts/${key}.wav`;
		} else if (key.startsWith("rep-")) {
			manifest.reps[key.replace("rep-", "")] = `/audio/callouts/${key}.wav`;
		}
	}

	await fs.writeFile(
		path.join(OUTPUT_DIR, "manifest.json"),
		JSON.stringify(manifest, null, 2),
	);

	console.log("Audio extraction complete!");
}

// Usage instructions
console.log(`
Audio Callout Extractor
======================

1. First, extract audio and generate transcript:
   ffmpeg -i "${VIDEO_PATH}" -vn -acodec pcm_s16le -ar 44100 -ac 2 workout-audio.wav
   whisper workout-audio.wav --model medium --output_format json

2. Then run this script:
   node extract-callouts.js transcript.json workout-audio.wav

This will create individual audio files for each callout in ${OUTPUT_DIR}
`);

// Check if called with arguments
if (process.argv.length === 4) {
	const [, , transcriptPath, audioPath] = process.argv;
	processTranscript(transcriptPath, audioPath).catch(console.error);
}
