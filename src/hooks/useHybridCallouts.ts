import { getCountCallout } from "@/lib/burpee-utils";
import { useCallback } from "react";
import { useAudioCallouts } from "./useAudioCallouts";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

interface HybridCalloutOptions {
	preferAudio: boolean;
	speechRate?: number;
	speechPitch?: number;
}

export function useHybridCallouts(options: HybridCalloutOptions) {
	const { preferAudio = true, speechRate = 1.3, speechPitch = 1 } = options;
	const { isLoaded, playCount, playRep, hasCount, hasRep } = useAudioCallouts();
	const { speak } = useSpeechSynthesis();

	// Play a count callout (1-5)
	const speakCount = useCallback(
		(count: number) => {
			// Try audio first if preferred and available
			if (preferAudio && isLoaded && hasCount(count)) {
				console.log(`Playing audio for count ${count}`);
				playCount(count);
			} else {
				// Fallback to speech synthesis
				console.log(`Speaking count ${count}`);
				speak(getCountCallout(count), { rate: speechRate, pitch: speechPitch });
			}
		},
		[
			preferAudio,
			isLoaded,
			hasCount,
			playCount,
			speak,
			speechRate,
			speechPitch,
		],
	);

	// Play a rep number callout
	const speakRep = useCallback(
		(rep: number) => {
			// Try audio first if preferred and available
			if (preferAudio && isLoaded && hasRep(rep)) {
				console.log(`Playing audio for rep ${rep}`);
				playRep(rep);
			} else {
				// Fallback to speech synthesis
				console.log(`Speaking rep ${rep}`);
				speak(rep.toString(), {
					rate: speechRate,
					pitch: speechPitch * 1.2, // Slightly higher pitch for rep numbers
				});
			}
		},
		[preferAudio, isLoaded, hasRep, playRep, speak, speechRate, speechPitch],
	);

	// Generic callout function
	const callout = useCallback(
		(type: "count" | "rep", value: number) => {
			if (type === "count") {
				speakCount(value);
			} else {
				speakRep(value);
			}
		},
		[speakCount, speakRep],
	);

	return {
		speakCount,
		speakRep,
		callout,
		isAudioLoaded: isLoaded,
	};
}
