import fs from "fs";
import FormData from "form-data";

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

interface TranscriptionOptions {
	apiKey: string;
	model?: "whisper-1";
	language?: string;
	prompt?: string;
	temperature?: number;
	timestamp_granularities?: ("word" | "segment")[];
}

export async function transcribeAudio(
	audioFilePath: string,
	options: TranscriptionOptions,
): Promise<WhisperResponse> {
	const { apiKey, model = "whisper-1", ...otherOptions } = options;

	// Create form data
	const formData = new FormData();
	formData.append("file", fs.createReadStream(audioFilePath));
	formData.append("model", model);
	formData.append("response_format", "verbose_json");

	// Add optional parameters
	if (otherOptions.language) {
		formData.append("language", otherOptions.language);
	}
	if (otherOptions.prompt) {
		formData.append("prompt", otherOptions.prompt);
	}
	if (otherOptions.temperature !== undefined) {
		formData.append("temperature", otherOptions.temperature.toString());
	}
	if (otherOptions.timestamp_granularities) {
		formData.append(
			"timestamp_granularities[]",
			otherOptions.timestamp_granularities.join(","),
		);
	}

	try {
		const response = await fetch(
			"https://api.openai.com/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					...formData.getHeaders(),
				},
				body: formData as any,
			},
		);

		if (!response.ok) {
			throw new Error(`Whisper API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data as WhisperResponse;
	} catch (error) {
		console.error("Error transcribing audio:", error);
		throw error;
	}
}

// Helper function to find callouts in transcript
export function extractCallouts(transcript: WhisperResponse) {
	const callouts = {
		counts: new Map<number, WhisperSegment>(),
		reps: new Map<number, WhisperSegment>(),
	};

	const countWords = ["one", "two", "three", "four", "five", "six"];

	for (const segment of transcript.segments) {
		const text = segment.text.trim().toLowerCase();

		// Check for count callouts
		const countIndex = countWords.findIndex((word) => text.includes(word));
		if (countIndex !== -1) {
			const countNum = countIndex + 1;
			if (!callouts.counts.has(countNum)) {
				callouts.counts.set(countNum, segment);
			}
		}

		// Check for rep numbers
		const numbers = text.match(/\b(\d+)\b/g);
		if (numbers) {
			for (const num of numbers) {
				const repNum = Number.parseInt(num);
				if (repNum >= 1 && repNum <= 200 && !callouts.reps.has(repNum)) {
					callouts.reps.set(repNum, segment);
				}
			}
		}
	}

	return callouts;
}

// Script to process the audio file
export async function processWorkoutAudio(apiKey: string) {
	const audioPath = "./public/6counts_cut.wav";
	const outputPath = "./public/audio/transcript.json";

	console.log("Transcribing audio file...");

	try {
		const transcript = await transcribeAudio(audioPath, {
			apiKey,
			language: "en",
			prompt:
				"This is a workout video with burpee count callouts from 1 to 6 and rep numbers from 1 to 200.",
		});

		// Save full transcript
		await fs.promises.writeFile(
			outputPath,
			JSON.stringify(transcript, null, 2),
		);

		console.log(`Transcript saved to ${outputPath}`);

		// Extract callouts
		const callouts = extractCallouts(transcript);

		console.log(`Found ${callouts.counts.size} count callouts`);
		console.log(`Found ${callouts.reps.size} rep number callouts`);

		// Save callout manifest
		const manifest = {
			counts: Object.fromEntries(
				Array.from(callouts.counts.entries()).map(([num, segment]) => [
					num,
					{
						start: segment.start,
						end: segment.end,
						text: segment.text,
					},
				]),
			),
			reps: Object.fromEntries(
				Array.from(callouts.reps.entries()).map(([num, segment]) => [
					num,
					{
						start: segment.start,
						end: segment.end,
						text: segment.text,
					},
				]),
			),
		};

		await fs.promises.writeFile(
			"./public/audio/callout-manifest.json",
			JSON.stringify(manifest, null, 2),
		);

		console.log("Callout manifest saved!");
		return { transcript, callouts };
	} catch (error) {
		console.error("Error processing audio:", error);
		throw error;
	}
}

// CLI usage
if (require.main === module) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("Please set OPENAI_API_KEY environment variable");
		process.exit(1);
	}

	processWorkoutAudio(apiKey).catch(console.error);
}
