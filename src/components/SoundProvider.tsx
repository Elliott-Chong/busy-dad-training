"use client";

import { SoundProvider as ReactSoundProvider } from "react-sounds";

interface SoundProviderProps {
	children: React.ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
	return (
		<ReactSoundProvider
			// Allow custom URLs for our count sounds
			customSounds={{
				"/audio/counts/1.mp3": "/audio/counts/1.mp3",
				"/audio/counts/2.mp3": "/audio/counts/2.mp3",
				"/audio/counts/3.mp3": "/audio/counts/3.mp3",
				"/audio/counts/4.mp3": "/audio/counts/4.mp3",
				"/audio/counts/5.mp3": "/audio/counts/5.mp3",
			}}
			// Preload our count sounds
			preload={[
				"/audio/counts/1.mp3",
				"/audio/counts/2.mp3",
				"/audio/counts/3.mp3",
				"/audio/counts/4.mp3",
				"/audio/counts/5.mp3",
			]}
		>
			{children}
		</ReactSoundProvider>
	);
}