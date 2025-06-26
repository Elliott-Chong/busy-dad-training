export interface WorkoutConfig {
	duration: number; // in minutes
	targetReps: number;
	mode: "continuous" | "sets";
	setsConfig?: {
		sets: number;
		repsPerSet: number;
		restBetweenSets: number; // in seconds
	};
	countsPerRep: number; // 6 for 6-count burpees
	pace?: "faster" | "default" | "slower"; // Count speed
	customPace?: number; // Custom pace value
}

export const BURPEE_CALLOUTS = {
	1: "One",
	2: "Two",
	3: "Three",
	4: "Four",
	5: "Five",
	6: "Six", // This won't be used - rep number is called instead
} as const;

export function getCountCallout(count: number): string {
	return (
		BURPEE_CALLOUTS[count as keyof typeof BURPEE_CALLOUTS] || count.toString()
	);
}

// Fixed duration per count (in seconds)
export const SECONDS_PER_COUNT = 0.65;

export const PACE_SETTINGS = {
	faster: 0.55,
	default: 0.65,
	slower: 0.75,
} as const;

export function calculatePacing(config: WorkoutConfig, useVoice = false) {
	const totalSeconds = config.duration * 60;

	// Get the seconds per count based on pace setting or custom value
	const secondsPerCount =
		config.customPace || PACE_SETTINGS[config.pace || "default"];

	// Fixed time for each count
	const msPerCount = secondsPerCount * 1000;

	// Time to complete one burpee (all counts)
	const secondsPerBurpee = secondsPerCount * config.countsPerRep;

	if (config.mode === "continuous") {
		const targetSecondsPerRep = totalSeconds / config.targetReps;
		// Calculate rest time between reps
		const restBetweenReps = Math.max(0, targetSecondsPerRep - secondsPerBurpee);

		return {
			msPerCount,
			secondsPerRep: targetSecondsPerRep,
			secondsPerBurpee,
			restBetweenReps,
		};
	}
	if (config.setsConfig) {
		const { sets, repsPerSet, restBetweenSets } = config.setsConfig;
		const totalRestTime = (sets - 1) * restBetweenSets;
		const activeTime = totalSeconds - totalRestTime;
		const totalRepsInSets = sets * repsPerSet;
		const targetSecondsPerRep = activeTime / totalRepsInSets;
		// Calculate rest time between reps within a set
		const restBetweenReps = Math.max(0, targetSecondsPerRep - secondsPerBurpee);

		return {
			msPerCount,
			secondsPerRep: targetSecondsPerRep,
			secondsPerBurpee,
			restBetweenReps,
		};
	}

	return {
		msPerCount,
		secondsPerRep: 6,
		secondsPerBurpee: secondsPerBurpee,
		restBetweenReps: 0,
	};
}

export function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
