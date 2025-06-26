import {
	type WorkoutConfig,
	calculatePacing,
	getCountCallout,
} from "@/lib/burpee-utils";
import { useCallback, useRef, useState } from "react";
import { useAudioContext } from "./useAudioContext";
import { useCountSounds } from "./useCountSounds";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

export function useBurpeeWorkout(config: WorkoutConfig, useVoice: boolean) {
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [currentRep, setCurrentRep] = useState(0);
	const [currentCount, setCurrentCount] = useState(0);
	const [timeElapsed, setTimeElapsed] = useState(0);
	const [currentSet, setCurrentSet] = useState(1);
	const [isResting, setIsResting] = useState(false);
	const [restTimeLeft, setRestTimeLeft] = useState(0);
	const [countdownTime, setCountdownTime] = useState(0);
	const [isCountingDown, setIsCountingDown] = useState(false);

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const countIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number>(0);
	const pausedTimeRef = useRef<number>(0);
	const isRunningRef = useRef(false);
	const isPausedRef = useRef(false);
	const isRestingRef = useRef(false);
	const currentRepRef = useRef(0);

	const { playBeep } = useAudioContext();
	const { speak, cancel: cancelSpeech } = useSpeechSynthesis();
	const { playCount, isLoaded: audioLoaded } = useCountSounds();

	const stopWorkout = useCallback(() => {
		setIsRunning(false);
		setIsPaused(false);
		isRunningRef.current = false;
		isPausedRef.current = false;
		pausedTimeRef.current = 0;
		setCurrentCount(0);

		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		if (countIntervalRef.current) {
			clearInterval(countIntervalRef.current);
			countIntervalRef.current = null;
		}

		// Cancel any pending speech
		cancelSpeech();

		// Play completion sound or speak
		if (useVoice) {
			speak("Workout complete!", { rate: 1, pitch: 1.1 });
		} else {
			playBeep(1320, 300);
			setTimeout(() => playBeep(1760, 300), 200);
		}
	}, [playBeep, speak, cancelSpeech, useVoice]);

	const startActualWorkout = useCallback(() => {
		startTimeRef.current = Date.now() - pausedTimeRef.current;

		const { msPerCount, restBetweenReps, secondsPerBurpee } = calculatePacing(
			config,
			useVoice,
		);
		console.log(
			"Starting workout - msPerCount:",
			msPerCount,
			"restBetweenReps:",
			restBetweenReps,
			"secondsPerBurpee:",
			secondsPerBurpee,
		);

		// Timer for elapsed time
		intervalRef.current = setInterval(() => {
			if (!isPausedRef.current) {
				const elapsed = Date.now() - startTimeRef.current;
				setTimeElapsed(elapsed);

				// Check if workout is complete
				if (elapsed >= config.duration * 60 * 1000) {
					stopWorkout();
				}
			}
		}, 100);

		// Count beeper
		const runCountBeeper = () => {
			if (isPausedRef.current || !isRunningRef.current || isRestingRef.current)
				return;

			console.log("runCountBeeper called at", Date.now());
			setCurrentCount((prev) => {
				const nextCount = (prev % config.countsPerRep) + 1;
				console.log("setCurrentCount - prev:", prev, "nextCount:", nextCount);

				// Voice callout or beep for each count
				if (useVoice) {
					// On the 6th count, say the current rep number + 1
					if (nextCount === 6) {
						// Use ref to get current value
						speak((currentRepRef.current + 1).toString(), {
							rate: 1.3,
							pitch: 1.2,
						});
					} else {
						// Use real audio for counts 1-5 if available
						if (audioLoaded && !playCount(nextCount)) {
							// Fallback to speech synthesis if audio fails
							speak(getCountCallout(nextCount), { rate: 1.3 });
						}
					}
				} else {
					// Play beep
					if (nextCount === 1) {
						playBeep(880, 150); // Higher pitch for new rep
					} else {
						playBeep(440, 100); // Normal pitch for counts
					}
				}

				// Update rep count after completing all 6 counts
				if (nextCount === 6) {
					const newRep = currentRepRef.current + 1;
					currentRepRef.current = newRep;
					setCurrentRep(newRep);

					// Add rest between reps if needed
					const { restBetweenReps } = calculatePacing(config, useVoice);
					if (restBetweenReps > 0 && newRep < config.targetReps) {
						// Pause the count beeper during rest
						if (countIntervalRef.current) {
							clearInterval(countIntervalRef.current);
							countIntervalRef.current = null;
						}

						// Set resting state
						setIsResting(true);
						isRestingRef.current = true;
						setRestTimeLeft(Math.ceil(restBetweenReps));

						// Rest countdown with more granular timing
						let restRemaining = restBetweenReps;
						const restInterval = setInterval(() => {
							restRemaining -= 0.1; // Count down in 100ms increments
							setRestTimeLeft(Math.ceil(restRemaining));

							if (restRemaining <= 0) {
								clearInterval(restInterval);
								setIsResting(false);
								isRestingRef.current = false;

								// Resume counting immediately
								countIntervalRef.current = setInterval(
									runCountBeeper,
									msPerCount,
								);
							}
						}, 100); // Check every 100ms for more precise timing
					}

					// Check if we need additional rest for sets mode
					if (config.mode === "sets" && config.setsConfig) {
						const { repsPerSet, restBetweenSets } = config.setsConfig;
						if (newRep % repsPerSet === 0 && newRep < config.targetReps) {
							// This is end of set rest, which is longer than between-rep rest
							if (countIntervalRef.current) {
								clearInterval(countIntervalRef.current);
								countIntervalRef.current = null;
							}

							setIsResting(true);
							isRestingRef.current = true;
							setRestTimeLeft(restBetweenSets);
							setCurrentSet(Math.floor(newRep / repsPerSet) + 1);

							// Rest countdown for set break with more granular timing
							let restRemaining = restBetweenSets;
							const restInterval = setInterval(() => {
								restRemaining -= 0.1; // Count down in 100ms increments
								setRestTimeLeft(Math.ceil(restRemaining));

								if (restRemaining <= 0) {
									clearInterval(restInterval);
									setIsResting(false);
									isRestingRef.current = false;

									// Resume counting immediately
									countIntervalRef.current = setInterval(
										runCountBeeper,
										msPerCount,
									);
								}
							}, 100); // Check every 100ms for more precise timing
						}
					}
				}

				return nextCount;
			});
		};

		// Start with a small delay to ensure state is set
		const startDelay = setTimeout(() => {
			if (!countIntervalRef.current) {
				runCountBeeper();
				// Then continue at intervals
				countIntervalRef.current = setInterval(runCountBeeper, msPerCount);
			}
		}, 100);

		// Clean up timeout if component unmounts
		return () => clearTimeout(startDelay);
	}, [config, playBeep, speak, useVoice, stopWorkout, audioLoaded, playCount]);
	
	const startWorkout = useCallback(() => {
		// Clean up any existing intervals first
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		if (countIntervalRef.current) {
			clearInterval(countIntervalRef.current);
			countIntervalRef.current = null;
		}

		setIsRunning(true);
		setIsPaused(false);
		isRunningRef.current = true;
		isPausedRef.current = false;
		setCurrentRep(0);
		currentRepRef.current = 0;
		setCurrentCount(0);
		setCurrentSet(1);
		setIsResting(false);
		isRestingRef.current = false;
		setRestTimeLeft(0);
		setIsCountingDown(true);
		setCountdownTime(5);
		
		// Announce get ready
		if (useVoice) {
			speak("Get ready! Starting in 5", { rate: 1.2 });
		} else {
			playBeep(880, 200);
		}
		
		// Start countdown
		let countdown = 5;
		const countdownInterval = setInterval(() => {
			countdown--;
			setCountdownTime(countdown);
			
			if (countdown > 0) {
				if (useVoice) {
					speak(countdown.toString(), { rate: 1.3 });
				} else {
					playBeep(440, 100);
				}
			} else {
				// Countdown finished, start the actual workout
				clearInterval(countdownInterval);
				setIsCountingDown(false);
				setCountdownTime(0);
				
				if (useVoice) {
					speak("Go!", { rate: 1.3, pitch: 1.2 });
				} else {
					playBeep(1320, 300);
				}
				
				// Start the actual workout
				startActualWorkout();
			}
		}, 1000);
	}, [useVoice, playBeep, speak, startActualWorkout]);

	const pauseWorkout = useCallback(() => {
		const newPausedState = !isPaused;
		setIsPaused(newPausedState);
		isPausedRef.current = newPausedState;

		if (newPausedState) {
			pausedTimeRef.current = Date.now() - startTimeRef.current;
		} else {
			startTimeRef.current = Date.now() - pausedTimeRef.current;
		}
	}, [isPaused]);

	return {
		isRunning,
		isPaused,
		currentRep,
		currentCount,
		timeElapsed,
		currentSet,
		isResting,
		restTimeLeft,
		countdownTime,
		isCountingDown,
		startWorkout,
		pauseWorkout,
		stopWorkout,
	};
}
