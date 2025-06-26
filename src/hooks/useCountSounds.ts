import { useSound } from "react-sounds";
import { useCallback } from "react";

// Custom count sounds mapping
// Since react-sounds doesn't have number sounds, we'll use our own audio files
const COUNT_SOUNDS = {
	1: "/audio/counts/1.mp3",
	2: "/audio/counts/2.mp3",
	3: "/audio/counts/3.mp3",
	4: "/audio/counts/4.mp3",
	5: "/audio/counts/5.mp3",
} as const;

export function useCountSounds() {
	// Initialize all count sounds
	const count1 = useSound(COUNT_SOUNDS[1], { volume: 1.0 });
	const count2 = useSound(COUNT_SOUNDS[2], { volume: 1.0 });
	const count3 = useSound(COUNT_SOUNDS[3], { volume: 1.0 });
	const count4 = useSound(COUNT_SOUNDS[4], { volume: 1.0 });
	const count5 = useSound(COUNT_SOUNDS[5], { volume: 1.0 });

	const sounds = {
		1: count1,
		2: count2,
		3: count3,
		4: count4,
		5: count5,
	};

	const playCount = useCallback((count: number) => {
		if (count >= 1 && count <= 5) {
			const sound = sounds[count as keyof typeof sounds];
			if (sound.isLoaded) {
				sound.play();
				console.log(`Playing count ${count} with react-sounds`);
				return true;
			} else {
				console.warn(`Count ${count} sound not loaded yet`);
				return false;
			}
		}
		return false;
	}, [sounds]);

	// Check if all sounds are loaded
	const isLoaded = Object.values(sounds).every(sound => sound.isLoaded);

	// Initialize audio context by playing a silent sound
	const initializeAudio = useCallback(() => {
		// Play each sound silently to unlock audio context
		Object.values(sounds).forEach(sound => {
			if (sound.isLoaded) {
				// Store original volume
				const originalVolume = sound.volume;
				// Set volume to 0
				sound.setVolume(0);
				// Play silently
				sound.play();
				// Stop immediately and restore volume
				setTimeout(() => {
					sound.stop();
					sound.setVolume(originalVolume);
				}, 50);
			}
		});
		console.log("Audio context initialized");
	}, [sounds]);

	return {
		playCount,
		isLoaded,
		initializeAudio,
		sounds,
	};
}