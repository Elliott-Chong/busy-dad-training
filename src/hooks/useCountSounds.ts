import { useSound } from "react-sounds";
import { useCallback, useRef } from "react";

// Custom count sounds mapping
const COUNT_SOUNDS = {
	1: "/audio/counts/1.mp3",
	2: "/audio/counts/2.mp3",
	3: "/audio/counts/3.mp3",
	4: "/audio/counts/4.mp3",
	5: "/audio/counts/5.mp3",
} as const;

export function useCountSounds() {
	// Initialize all count sounds at full volume
	const count1 = useSound(COUNT_SOUNDS[1]);
	const count2 = useSound(COUNT_SOUNDS[2]);
	const count3 = useSound(COUNT_SOUNDS[3]);
	const count4 = useSound(COUNT_SOUNDS[4]);
	const count5 = useSound(COUNT_SOUNDS[5]);
	
	// Track if we've initialized
	const initialized = useRef(false);

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

	// Initialize audio context by playing a quick sound
	const initializeAudio = useCallback(() => {
		if (initialized.current) {
			console.log("Audio already initialized");
			return;
		}
		
		// Just play and immediately stop the first sound to unlock audio
		if (sounds[1].isLoaded) {
			sounds[1].play();
			// Use a very short timeout to stop
			setTimeout(() => {
				sounds[1].stop();
			}, 1);
		}
		
		initialized.current = true;
		console.log("Audio context initialized");
	}, [sounds]);

	return {
		playCount,
		isLoaded,
		initializeAudio,
		sounds,
	};
}