#!/usr/bin/env bun

import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { readFile } from "fs/promises";

const execAsync = promisify(exec);

interface WhisperSegment {
	start: number;
	end: number;
	text: string;
}

async function extractTestClip(
	audioFile: string,
	start: number,
	duration: number,
	outputFile: string,
) {
	const cmd = `ffmpeg -i "${audioFile}" -ss ${start.toFixed(3)} -t ${duration.toFixed(3)} -acodec pcm_s16le -ar 44100 -ac 1 "${outputFile}" -y`;
	await execAsync(cmd);
}

async function main() {
	// Read the original transcript
	const transcriptPath = path.join(
		process.cwd(),
		"public/audio/transcript.json",
	);
	const transcript = JSON.parse(await readFile(transcriptPath, "utf-8"));

	// Look at the first segment
	const firstSegment: WhisperSegment = transcript.segments[0];
	console.log("🔍 First segment analysis:");
	console.log(`   Text: "${firstSegment.text}"`);
	console.log(`   Start: ${firstSegment.start}s`);
	console.log(`   End: ${firstSegment.end}s`);
	console.log(`   Duration: ${firstSegment.end - firstSegment.start}s`);

	// The text has 30 numbers in it
	const numbers = firstSegment.text
		.trim()
		.split(/[,\s]+/)
		.filter((n) => n.match(/^\d+$/));
	console.log(`   Numbers count: ${numbers.length}`);
	console.log(`   Numbers: ${numbers.join(", ")}`);

	// Let's extract small clips at different points to hear what's actually there
	const audioFile = "public/6counts_12min_compressed.wav";
	const testDir = "public/audio/debug";

	// Create debug directory
	await Bun.write(path.join(testDir, ".gitkeep"), "");

	console.log("\n📼 Extracting test clips to verify timing...\n");

	// Test different timestamps
	const tests = [
		{ time: 0.0, label: "start" },
		{ time: 0.5, label: "half-second" },
		{ time: 1.0, label: "one-second" },
		{ time: 1.5, label: "one-half-second" },
		{ time: 2.0, label: "two-seconds" },
		{ time: 2.5, label: "two-half-seconds" },
		{ time: 3.0, label: "three-seconds" },
	];

	for (const test of tests) {
		const outputFile = path.join(testDir, `test_${test.label}.wav`);
		await extractTestClip(audioFile, test.time, 1.0, outputFile);
		console.log(`✅ ${test.label}: ${test.time}s -> ${outputFile}`);
	}

	// Let's also check what Whisper thinks is at specific word positions
	console.log("\n📊 Estimated timing for each number in first segment:");
	console.log("   (Assuming even distribution across segment)\n");

	const segmentDuration = firstSegment.end - firstSegment.start;
	const timePerNumber = segmentDuration / numbers.length;

	for (let i = 0; i < Math.min(10, numbers.length); i++) {
		const estimatedTime = firstSegment.start + i * timePerNumber;
		console.log(`   ${numbers[i]}: ~${estimatedTime.toFixed(2)}s`);
	}

	// Extract what we think should be "1", "2", "3", "4", "5"
	console.log("\n🎯 Extracting what we think are counts 1-5...\n");

	for (let i = 0; i < 5; i++) {
		const estimatedTime = firstSegment.start + i * timePerNumber;
		const outputFile = path.join(testDir, `estimated_${i + 1}.wav`);
		await extractTestClip(audioFile, estimatedTime, 0.8, outputFile);
		console.log(
			`Count ${i + 1}: ${estimatedTime.toFixed(2)}s -> ${outputFile}`,
		);
	}

	console.log("\n💡 Listen to these files to understand the timing offset!");
	console.log(
		"   If 'estimated_2.wav' plays '3', then we're off by ~0.7 seconds",
	);
}

main().catch(console.error);
