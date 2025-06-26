#!/usr/bin/env bun

import { existsSync } from "fs";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";

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

interface WhisperResponse {
	task: string;
	language: string;
	duration: number;
	segments: WhisperSegment[];
	text: string;
}

async function transcribeAudio(
	audioFilePath: string,
	apiKey: string,
): Promise<WhisperResponse> {
	console.log(`Reading audio file: ${audioFilePath}`);

	// Read the audio file
	const audioFile = await readFile(audioFilePath);

	// Create form data
	const formData = new FormData();
	formData.append(
		"file",
		new Blob([audioFile], { type: "audio/wav" }),
		"audio.wav",
	);
	formData.append("model", "whisper-1");
	formData.append("response_format", "verbose_json");
	formData.append("language", "en");
	formData.append(
		"prompt",
		"This is a workout video with burpee count callouts: one, two, three, four, five, six, and rep numbers from 1 to 200.",
	);

	console.log("Calling OpenAI Whisper API...");

	try {
		const response = await fetch(
			"https://api.openai.com/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				body: formData,
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Whisper API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		return data as WhisperResponse;
	} catch (error) {
		console.error("Error transcribing audio:", error);
		throw error;
	}
}

function extractCallouts(transcript: WhisperResponse) {
	const callouts = {
		counts: new Map<number, WhisperSegment>(),
		reps: new Map<number, WhisperSegment>(),
	};

	const countWords = ["one", "two", "three", "four", "five", "six"];

	for (const segment of transcript.segments) {
		const text = segment.text.trim().toLowerCase();

		// Check for count callouts (exact matches preferred)
		for (let i = 0; i < countWords.length; i++) {
			const countWord = countWords[i];
			if (countWord && (text === countWord || text.includes(countWord))) {
				const countNum = i + 1;
				if (!callouts.counts.has(countNum)) {
					callouts.counts.set(countNum, segment);
					console.log(
						`Found count ${countNum}: "${segment.text}" at ${segment.start}s`,
					);
				}
			}
		}

		// Check for rep numbers
		const numbers = text.match(/\b(\d+)\b/g);
		if (numbers) {
			for (const num of numbers) {
				const repNum = Number.parseInt(num);
				if (repNum >= 1 && repNum <= 200) {
					if (!callouts.reps.has(repNum)) {
						callouts.reps.set(repNum, segment);
						console.log(
							`Found rep ${repNum}: "${segment.text}" at ${segment.start}s`,
						);
					}
				}
			}
		}
	}

	return callouts;
}

async function main() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("❌ Please set OPENAI_API_KEY environment variable");
		console.error("   Run: export OPENAI_API_KEY='your-api-key-here'");
		process.exit(1);
	}

	// Check for command line argument or use default
	const audioFileName = process.argv[2] || "6counts_12min_compressed.wav";
	const audioPath = path.join(process.cwd(), "public", audioFileName);
	const outputDir = path.join(process.cwd(), "public/audio");

	console.log(`📁 Using audio file: ${audioFileName}`);

	// Check if audio file exists
	if (!existsSync(audioPath)) {
		console.error(`❌ Audio file not found: ${audioPath}`);
		process.exit(1);
	}

	// Create output directory
	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true });
	}

	console.log("🎯 Starting transcription process...");

	try {
		// Transcribe the audio
		const transcript = await transcribeAudio(audioPath, apiKey);

		console.log(`✅ Transcription complete! Duration: ${transcript.duration}s`);
		console.log(`📝 Found ${transcript.segments.length} segments`);

		// Save full transcript
		const transcriptPath = path.join(outputDir, "transcript.json");
		await writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
		console.log(`💾 Full transcript saved to: ${transcriptPath}`);

		// Extract callouts
		const callouts = extractCallouts(transcript);

		console.log(`\n📊 Summary:`);
		console.log(`   - Count callouts found: ${callouts.counts.size}/6`);
		console.log(`   - Rep callouts found: ${callouts.reps.size}/200`);

		// Create manifest for easy lookup
		const manifest = {
			audioFile: `/${audioFileName}`,
			counts: {} as Record<
				number,
				{ start: number; end: number; text: string }
			>,
			reps: {} as Record<number, { start: number; end: number; text: string }>,
		};

		// Add counts to manifest
		for (const [num, segment] of callouts.counts) {
			manifest.counts[num] = {
				start: segment.start,
				end: segment.end,
				text: segment.text.trim(),
			};
		}

		// Add reps to manifest
		for (const [num, segment] of callouts.reps) {
			manifest.reps[num] = {
				start: segment.start,
				end: segment.end,
				text: segment.text.trim(),
			};
		}

		// Save manifest
		const manifestPath = path.join(outputDir, "callout-manifest.json");
		await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
		console.log(`💾 Callout manifest saved to: ${manifestPath}`);

		// Print missing callouts for debugging
		console.log("\n🔍 Missing callouts:");
		for (let i = 1; i <= 6; i++) {
			if (!callouts.counts.has(i)) {
				console.log(`   - Count ${i} not found`);
			}
		}

		console.log("\n✨ Done! Next steps:");
		console.log("1. Review the manifest file to check timestamps");
		console.log("2. Use ffmpeg to extract individual audio clips if needed");
		console.log("3. Update the app to use audio timestamps instead of TTS");
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

// Run the script
main();
