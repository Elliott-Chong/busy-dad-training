import { useCallback, useEffect, useRef, useState } from "react";

interface AudioSprite {
	audio: HTMLAudioElement;
	loaded: boolean;
}

export function useAudioSprites() {
	const [isLoading, setIsLoading] = useState(true);
	const [loadedCount, setLoadedCount] = useState(0);
	const audioSprites = useRef<{
		counts: Map<number, AudioSprite>;
		reps: Map<number, AudioSprite>;
	}>({
		counts: new Map(),
		reps: new Map(),
	});

	useEffect(() => {
		const loadAudioSprites = async () => {
			try {
				// Load the sprite manifest
				const response = await fetch("/audio/audio-sprites.json");
				const manifest = await response.json();

				let totalToLoad = 0;
				let loaded = 0;

				// Load count audio sprites (1-5)
				for (const [num, path] of Object.entries(manifest.counts)) {
					totalToLoad++;
					const audio = new Audio(path as string);
					audio.preload = "auto";

					audio.addEventListener("canplaythrough", () => {
						loaded++;
						setLoadedCount(loaded);
						audioSprites.current.counts.get(Number(num))!.loaded = true;

						if (loaded === totalToLoad) {
							setIsLoading(false);
							console.log(`✅ All ${totalToLoad} audio sprites loaded`);
						}
					});

					audio.addEventListener("error", (e) => {
						console.error(`Failed to load ${path}:`, e);
						loaded++;
						setLoadedCount(loaded);
					});

					audioSprites.current.counts.set(Number(num), {
						audio,
						loaded: false,
					});
				}

				// Load rep audio sprites (only the ones we have)
				for (const [num, path] of Object.entries(manifest.reps)) {
					totalToLoad++;
					const audio = new Audio(path as string);
					audio.preload = "auto";

					audio.addEventListener("canplaythrough", () => {
						loaded++;
						setLoadedCount(loaded);
						audioSprites.current.reps.get(Number(num))!.loaded = true;

						if (loaded === totalToLoad) {
							setIsLoading(false);
						}
					});

					audio.addEventListener("error", (e) => {
						console.error(`Failed to load ${path}:`, e);
						loaded++;
						setLoadedCount(loaded);
					});

					audioSprites.current.reps.set(Number(num), {
						audio,
						loaded: false,
					});
				}

				console.log(`📦 Loading ${totalToLoad} audio sprites...`);
			} catch (error) {
				console.error("Failed to load audio sprites:", error);
				setIsLoading(false);
			}
		};

		loadAudioSprites();

		// Cleanup
		return () => {
			for (const sprite of audioSprites.current.counts.values()) {
				sprite.audio.pause();
			}
			for (const sprite of audioSprites.current.reps.values()) {
				sprite.audio.pause();
			}
		};
	}, []);

	const playCount = useCallback((count: number) => {
		const sprite = audioSprites.current.counts.get(count);
		if (sprite?.loaded) {
			// Reset and play
			sprite.audio.currentTime = 0;
			sprite.audio
				.play()
				.catch((e) => console.error(`Error playing count ${count}:`, e));
			return true;
		}
		return false;
	}, []);

	const playRep = useCallback((rep: number) => {
		const sprite = audioSprites.current.reps.get(rep);
		if (sprite?.loaded) {
			// Reset and play
			sprite.audio.currentTime = 0;
			sprite.audio
				.play()
				.catch((e) => console.error(`Error playing rep ${rep}:`, e));
			return true;
		}
		return false;
	}, []);

	const hasCount = useCallback((count: number) => {
		return audioSprites.current.counts.has(count);
	}, []);

	const hasRep = useCallback((rep: number) => {
		return audioSprites.current.reps.has(rep);
	}, []);

	return {
		isLoading,
		loadedCount,
		playCount,
		playRep,
		hasCount,
		hasRep,
	};
}
