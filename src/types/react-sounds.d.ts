declare module "react-sounds" {
	export interface SoundOptions {
		volume?: number;
		loop?: boolean;
		rate?: number;
		onload?: () => void;
		onend?: () => void;
		onplay?: () => void;
		onpause?: () => void;
		onstop?: () => void;
		onerror?: (id: number, error: any) => void;
	}

	export interface SoundHook {
		play: () => void;
		pause: () => void;
		stop: () => void;
		isPlaying: boolean;
		isLoaded: boolean;
		duration: number | null;
		volume: number;
		setVolume: (volume: number) => void;
		rate: number;
		setRate: (rate: number) => void;
	}

	export function useSound(
		src: string,
		options?: SoundOptions
	): SoundHook;

	export interface SoundProviderProps {
		children: React.ReactNode;
		customSounds?: Record<string, string>;
		preload?: string[];
		baseUrl?: string;
		enabled?: boolean;
	}

	export function SoundProvider(props: SoundProviderProps): JSX.Element;
}