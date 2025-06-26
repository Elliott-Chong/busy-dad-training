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
            // Use MP3 for better mobile compatibility
            const audio = new Audio(`/audio/counts/${count}.mp3`);
            audio.preload = "auto";
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
                try {
                    // Reset the audio to start
                    audio.currentTime = 0;
                    audio.volume = 1.0;
                    
                    // Play the audio
                    const playPromise = audio.play();
                    
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log(`Playing count ${count} audio`);
                            })
                            .catch((e) => {
                                console.error(`Error playing count ${count}:`, e);
                            });
                    }
                    return true;
                } catch (e) {
                    console.error(`Error setting up audio for count ${count}:`, e);
                    return false;
                }
            }
            console.warn(`Cannot play count ${count}: audio not loaded or not available`);
            return false;
        },
        [isLoaded]
    );

    // Initialize audio context on user interaction (for mobile)
    const initializeAudio = useCallback(async () => {
        // Create a user gesture to unlock audio on iOS/mobile browsers
        const promises: Promise<void>[] = [];

        audioRefs.current.forEach((audio, count) => {
            const promise = audio
                .play()
                .then(() => {
                    // Immediately pause after starting
                    audio.pause();
                    audio.currentTime = 0;
                    console.log(`Audio ${count} unlocked for mobile`);
                })
                .catch((e) => {
                    console.warn(`Could not unlock audio ${count}:`, e);
                });
            promises.push(promise);
        });

        // Wait for all audio elements to be unlocked
        await Promise.all(promises);
        console.log("All audio initialization attempted");
    }, []);

    return {
        isLoaded,
        playCount,
        initializeAudio,
    };
}
