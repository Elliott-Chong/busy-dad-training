import { useCallback, useEffect, useRef, useState } from "react";

interface CalloutManifest {
	audioFile: string;
	counts: Record<
		number,
		{
			start: number;
			end: number;
			duration: number;
			text: string;
		}
	>;
	reps: Record<
		number,
		{
			start: number;
			end: number;
			duration: number;
			text: string;
		}
	>;
}

export function useAudioCallouts() {
	const [isLoaded, setIsLoaded] = useState(false);
	const [manifest, setManifest] = useState<CalloutManifest | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const isPlayingRef = useRef(false);

	// Load the manifest and audio file
	useEffect(() => {
		const loadManifest = async () => {
			try {
				const response = await fetch("/audio/callout-manifest-detailed.json");
				const data = await response.json();
				setManifest(data);

				// Create audio element
				const audio = new Audio(data.audioFile);
				audio.preload = "auto";

				audio.addEventListener("loadeddata", () => {
					setIsLoaded(true);
					console.log("Audio loaded successfully");
				});

				audio.addEventListener("error", (e) => {
					console.error("Audio loading error:", e);
				});

				audioRef.current = audio;
			} catch (error) {
				console.error("Failed to load manifest:", error);
			}
		};

		loadManifest();

		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	// Play a specific segment of audio
	const playSegment = useCallback(
		async (startTime: number, endTime: number) => {
			if (!audioRef.current || !isLoaded || isPlayingRef.current) {
				return;
			}

			const audio = audioRef.current;
			isPlayingRef.current = true;

			try {
				// Set the start time
				audio.currentTime = startTime;

				// Play the audio
				await audio.play();

				// Stop after the segment duration
				const duration = (endTime - startTime) * 1000; // Convert to milliseconds
				setTimeout(() => {
					audio.pause();
					isPlayingRef.current = false;
				}, duration);
			} catch (error) {
				console.error("Error playing audio segment:", error);
				isPlayingRef.current = false;
			}
		},
		[isLoaded],
	);

	// Play a count callout (1-5)
	const playCount = useCallback(
		(count: number) => {
			if (!manifest || !manifest.counts[count]) {
				console.warn(`Count ${count} not found in manifest`);
				return;
			}

			const callout = manifest.counts[count];
			playSegment(callout.start, callout.end);
		},
		[manifest, playSegment],
	);

	// Play a rep number callout
	const playRep = useCallback(
		(rep: number) => {
			if (!manifest || !manifest.reps[rep]) {
				console.warn(`Rep ${rep} not found in manifest`);
				return;
			}

			const callout = manifest.reps[rep];
			playSegment(callout.start, callout.end);
		},
		[manifest, playSegment],
	);

	// Play a callout (either count or rep)
	const playCallout = useCallback(
		(type: "count" | "rep", value: number) => {
			if (type === "count") {
				playCount(value);
			} else {
				playRep(value);
			}
		},
		[playCount, playRep],
	);

	return {
		isLoaded,
		playCount,
		playRep,
		playCallout,
		hasCount: (count: number) => !!manifest?.counts[count],
		hasRep: (rep: number) => !!manifest?.reps[rep],
	};
}
