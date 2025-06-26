"use client";

import { Button } from "@/components/ui/button";
import { useBurpeeWorkout } from "@/hooks/useBurpeeWorkout";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useCountSounds } from "@/hooks/useCountSounds";
import { type WorkoutConfig, calculatePacing } from "@/lib/burpee-utils";
import { useState } from "react";
import { WorkoutConfiguration } from "./WorkoutConfiguration";
import { WorkoutControls } from "./WorkoutControls";
import { WorkoutDisplay } from "./WorkoutDisplay";
import { Disclaimer } from "./Disclaimer";

export default function BurpeeWorkout() {
    const [config, setConfig] = useState<WorkoutConfig>({
        duration: 20,
        targetReps: 200,
        mode: "continuous",
        countsPerRep: 6,
        pace: "default",
    });
    const [useVoice, setUseVoice] = useState(true);
    const { speak } = useSpeechSynthesis();
    const { playCount, isLoaded: audioLoaded } = useCountSounds();

    const {
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
    } = useBurpeeWorkout(config, useVoice);

    const { secondsPerRep } = calculatePacing(config, useVoice);

    return (
        <div className="min-h-screen bg-blue-900 w-full">
            <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-safe mt-10">
                    {!isRunning ? (
                        <div className="space-y-4">
                            <WorkoutConfiguration
                                config={config}
                                onConfigChange={setConfig}
                                useVoice={useVoice}
                                onVoiceToggle={setUseVoice}
                                secondsPerRep={secondsPerRep}
                            />

                            <div className="space-y-3">
                                <Button
                                    onClick={startWorkout}
                                    className="h-16 w-full rounded-full bg-blue-600 font-semibold text-lg text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98]"
                                    size="lg"
                                >
                                    Start Workout
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Test audio counts
                                        if (audioLoaded) {
                                            let count = 1;
                                            const interval = setInterval(() => {
                                                playCount(count);
                                                count++;
                                                if (count > 5) {
                                                    clearInterval(interval);
                                                    speak("6", { rate: 1.3, pitch: 1.2 });
                                                }
                                            }, 600);
                                        } else {
                                            speak("Audio not loaded yet. Testing voice. One, two, three, four, five!", {
                                                rate: 1.2,
                                            });
                                        }
                                    }}
                                    variant="ghost"
                                    className="h-14 w-full rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                                    size="sm"
                                >
                                    Test Audio ({audioLoaded ? "Ready" : "Loading..."})
                                </Button>
                            </div>
                            
                            <Disclaimer />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isCountingDown ? (
                                <div className="flex items-center justify-center min-h-[400px]">
                                    <div className="text-center">
                                        <div className="text-9xl font-bold text-white mb-4">
                                            {countdownTime || "Go!"}
                                        </div>
                                        <div className="text-2xl text-white/70">
                                            Get Ready!
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <WorkoutDisplay
                                        currentRep={currentRep}
                                        currentCount={currentCount}
                                        timeElapsed={timeElapsed}
                                        duration={config.duration}
                                        isResting={isResting}
                                        restTimeLeft={restTimeLeft}
                                        currentSet={currentSet}
                                        totalSets={config.setsConfig?.sets}
                                        mode={config.mode}
                                        targetReps={config.targetReps}
                                        config={config}
                                        useVoice={useVoice}
                                    />
                                    <WorkoutControls isPaused={isPaused} onPause={pauseWorkout} onStop={stopWorkout} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
