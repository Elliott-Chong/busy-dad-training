import { useCallback, useRef } from "react";

interface SpeakOptions {
	rate?: number;
	pitch?: number;
	volume?: number;
}

export function useSpeechSynthesis() {
	const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

	const speak = useCallback((text: string, options?: SpeakOptions) => {
		if (!window.speechSynthesis) {
			console.warn("Speech synthesis not supported");
			return;
		}

		console.log("Speaking:", text, options);

		// Don't cancel if we're speaking the same text
		if (
			speechSynthRef.current &&
			speechSynthRef.current.text === text &&
			window.speechSynthesis.speaking
		) {
			console.log("Already speaking this text, skipping");
			return;
		}

		// Cancel any pending speech
		window.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.rate = options?.rate || 1.2;
		utterance.pitch = options?.pitch || 1;
		utterance.volume = options?.volume || 1;

		utterance.onstart = () => console.log("Speech started:", text);
		utterance.onend = () => console.log("Speech ended:", text);
		utterance.onerror = (e) => console.error("Speech error:", e);

		speechSynthRef.current = utterance;
		window.speechSynthesis.speak(utterance);
	}, []);

	const cancel = useCallback(() => {
		if (window.speechSynthesis) {
			window.speechSynthesis.cancel();
		}
	}, []);

	return { speak, cancel };
}
