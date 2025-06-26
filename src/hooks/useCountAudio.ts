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
			// Mobile-specific settings
			audio.crossOrigin = "anonymous";
			audio.volume = 1.0;

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

			// Try to load the audio
			audio.load();
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
				clone.volume = 1.0; // Ensure volume is max
				const playPromise = clone.play();
				
				if (playPromise !== undefined) {
					playPromise
						.then(() => {
							console.log(`Playing count ${count} audio`);
						})
						.catch((e) => {
							console.error(`Error playing count ${count}:`, e);
							// Try to play original audio if clone fails
							audio.currentTime = 0;
							audio.volume = 1.0;
							audio.play().catch((e2) => {
								console.error(`Error playing original count ${count}:`, e2);
							});
						});
				}
				return true;
			}
			console.warn(`Cannot play count ${count}: audio not loaded or not available`);
			return false;
		},
		[isLoaded],
	);

	// Initialize audio context on user interaction (for mobile)
	const initializeAudio = useCallback(() => {
		// Play a silent sound from each audio to unlock mobile audio
		audioRefs.current.forEach((audio) => {
			const originalVolume = audio.volume;
			audio.volume = 0;
			audio.play()
				.then(() => {
					audio.pause();
					audio.currentTime = 0;
					audio.volume = originalVolume;
					console.log("Audio initialized for mobile");
				})
				.catch((e) => {
					console.warn("Could not initialize audio:", e);
				});
		});
	}, []);

	return {
		isLoaded,
		playCount,
		initializeAudio,
	};
}
