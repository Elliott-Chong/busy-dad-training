#!/usr/bin/env bun

import path from "path";
import { readFile, writeFile } from "fs/promises";

interface WhisperSegment {
	id: number;
	seek: number;
	start: number;
	end: number;
	text: string;
	tokens: number[];
	temperature: number;
	avg_logprob: number;
	compression_ratio: number;
	no_speech_prob: number;
}

interface WhisperTranscript {
	task: string;
	language: string;
	duration: number;
	text: string;
	segments: WhisperSegment[];
}

interface CalloutTiming {
	type: "count" | "rep";
	value: number;
	startTime: number;
	endTime: number;
	text: string;
}

function parseSegmentForCallouts(segment: WhisperSegment): CalloutTiming[] {
	const callouts: CalloutTiming[] = [];
	const text = segment.text.trim();

	// Split by commas and filter to get only numbers
	const parts = text.split(/[,\s]+/).filter((part) => part);

	// Calculate time per part (assuming even distribution within segment)
	const segmentDuration = segment.end - segment.start;
	const timePerPart = segmentDuration / parts.length;

	let currentTime = segment.start;
	let countIndex = 0;

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		const num = Number.parseInt(part);

		if (!isNaN(num)) {
			// Determine if this is a count (1-5 in sequence) or a rep number
			if (num >= 1 && num <= 5 && countIndex < 5) {
				// This is a count
				if (num === countIndex + 1) {
					callouts.push({
						type: "count",
						value: num,
						startTime: currentTime,
						endTime: currentTime + timePerPart,
						text: part,
					});
					countIndex++;
				} else {
					// Reset if sequence is broken
					countIndex = num === 1 ? 1 : 0;
					if (num === 1) {
						callouts.push({
							type: "count",
							value: num,
							startTime: currentTime,
							endTime: currentTime + timePerPart,
							text: part,
						});
					}
				}
			} else {
				// This is a rep number
				callouts.push({
					type: "rep",
					value: num,
					startTime: currentTime,
					endTime: currentTime + timePerPart,
					text: part,
				});
				countIndex = 0; // Reset count sequence
			}
		}

		currentTime += timePerPart;

		// Reset count index after completing 1-5 sequence
		if (countIndex === 5) {
			countIndex = 0;
		}
	}

	return callouts;
}

async function main() {
	const transcriptPath = path.join(
		process.cwd(),
		"public/audio/transcript.json",
	);
	const transcript: WhisperTranscript = JSON.parse(
		await readFile(transcriptPath, "utf-8"),
	);

	console.log("📊 Processing transcript...");
	console.log(`   Duration: ${transcript.duration}s`);
	console.log(`   Segments: ${transcript.segments.length}`);

	// Process all segments
	const allCallouts: CalloutTiming[] = [];

	for (const segment of transcript.segments) {
		const callouts = parseSegmentForCallouts(segment);
		allCallouts.push(...callouts);
	}

	console.log(`📢 Found ${allCallouts.length} total callouts`);

	// Find unique callouts (first occurrence of each)
	const uniqueCounts = new Map<number, CalloutTiming>();
	const uniqueReps = new Map<number, CalloutTiming>();

	for (const callout of allCallouts) {
		if (callout.type === "count" && !uniqueCounts.has(callout.value)) {
			uniqueCounts.set(callout.value, callout);
		} else if (
			callout.type === "rep" &&
			!uniqueReps.has(callout.value) &&
			callout.value <= 200
		) {
			uniqueReps.set(callout.value, callout);
		}
	}

	console.log(`✅ Unique counts: ${uniqueCounts.size}/5`);
	console.log(`✅ Unique reps: ${uniqueReps.size}/200`);

	// Create detailed manifest
	const detailedManifest = {
		audioFile: "/6counts_12min_compressed.wav",
		originalAudioFile: "/6counts_cut.wav", // The full quality version
		processedAt: new Date().toISOString(),
		duration: transcript.duration,
		counts: {} as Record<
			number,
			{
				start: number;
				end: number;
				duration: number;
				text: string;
				firstOccurrence: boolean;
			}
		>,
		reps: {} as Record<
			number,
			{
				start: number;
				end: number;
				duration: number;
				text: string;
				firstOccurrence: boolean;
			}
		>,
		// Also save all occurrences for debugging
		allCallouts: allCallouts.slice(0, 500), // First 500 for inspection
	};

	// Add unique counts
	for (const [num, callout] of uniqueCounts) {
		detailedManifest.counts[num] = {
			start: callout.startTime,
			end: callout.endTime,
			duration: callout.endTime - callout.startTime,
			text: callout.text,
			firstOccurrence: true,
		};
	}

	// Add unique reps
	for (const [num, callout] of uniqueReps) {
		detailedManifest.reps[num] = {
			start: callout.startTime,
			end: callout.endTime,
			duration: callout.endTime - callout.startTime,
			text: callout.text,
			firstOccurrence: true,
		};
	}

	// Save detailed manifest
	const outputPath = path.join(
		process.cwd(),
		"public/audio/callout-manifest-detailed.json",
	);
	await writeFile(outputPath, JSON.stringify(detailedManifest, null, 2));

	console.log(`\n💾 Saved detailed manifest to: ${outputPath}`);

	// Print summary
	console.log("\n📊 Summary:");
	console.log(
		"   Counts found:",
		Array.from(uniqueCounts.keys()).sort().join(", "),
	);
	console.log(
		"   Missing counts:",
		[1, 2, 3, 4, 5].filter((n) => !uniqueCounts.has(n)).join(", ") || "None",
	);

	// Sample of rep numbers found
	const repKeys = Array.from(uniqueReps.keys()).sort((a, b) => a - b);
	console.log(`   Rep range: ${repKeys[0]} - ${repKeys[repKeys.length - 1]}`);
	console.log(`   Sample reps: ${repKeys.slice(0, 10).join(", ")}...`);

	// Find gaps in rep numbers
	const missingReps: number[] = [];
	for (let i = 1; i <= 100; i++) {
		if (!uniqueReps.has(i)) {
			missingReps.push(i);
		}
	}
	if (missingReps.length > 0) {
		console.log(`   Missing reps (1-100): ${missingReps.join(", ")}`);
	}
}

main().catch(console.error);
