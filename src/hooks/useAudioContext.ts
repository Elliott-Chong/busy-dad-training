import { useCallback, useEffect, useRef } from "react";

export function useAudioContext() {
	const audioContext = useRef<AudioContext | null>(null);

	useEffect(() => {
		audioContext.current = new AudioContext();
		return () => {
			if (audioContext.current) {
				audioContext.current.close();
			}
		};
	}, []);

	const playBeep = useCallback((frequency = 440, duration = 100) => {
		if (!audioContext.current) return;

		const oscillator = audioContext.current.createOscillator();
		const gainNode = audioContext.current.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.current.destination);

		oscillator.frequency.value = frequency;
		gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.current.currentTime + duration / 1000,
		);

		oscillator.start(audioContext.current.currentTime);
		oscillator.stop(audioContext.current.currentTime + duration / 1000);
	}, []);

	return { playBeep };
}
