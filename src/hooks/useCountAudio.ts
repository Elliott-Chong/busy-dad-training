import { useCallback, useEffect, useRef, useState } from "react";

export function useCountAudio() {
	const [isLoaded, setIsLoaded] = useState(false);
	const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
	const loadedCount = useRef(0);

	useEffect(() => {
		// Preload all 5 count audio files
		const counts = [1, 2, 3, 4, 5];
		let totalLoaded = 0;

		counts.forEach((count) => {
			const audio = new Audio(`/audio/counts/${count}.wav`);
			audio.preload = "auto";

			audio.addEventListener("canplaythrough", () => {
				totalLoaded++;
				loadedCount.current = totalLoaded;
				if (totalLoaded === counts.length) {
					setIsLoaded(true);
					console.log("✅ All count audio files loaded");
				}
			});

			audio.addEventListener("error", (e) => {
				console.error(`Failed to load count ${count} audio:`, e);
				totalLoaded++;
				if (totalLoaded === counts.length) {
					setIsLoaded(true);
				}
			});

			audioRefs.current.set(count, audio);
		});

		// Cleanup
		return () => {
			audioRefs.current.forEach((audio) => {
				audio.pause();
				audio.src = "";
			});
			audioRefs.current.clear();
		};
	}, []);

	const playCount = useCallback(
		(count: number) => {
			const audio = audioRefs.current.get(count);
			if (audio && isLoaded) {
				// Clone and play to allow overlapping sounds
				const clone = audio.cloneNode() as HTMLAudioElement;
				clone.play().catch((e) => {
					console.error(`Error playing count ${count}:`, e);
				});
				return true;
			}
			return false;
		},
		[isLoaded],
	);

	return {
		isLoaded,
		playCount,
	};
}
