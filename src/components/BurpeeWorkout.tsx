"use client";

import { Button } from "@/components/ui/button";
import { useBurpeeWorkout } from "@/hooks/useBurpeeWorkout";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { type WorkoutConfig, calculatePacing } from "@/lib/burpee-utils";
import { useState } from "react";
import { WorkoutConfiguration } from "./WorkoutConfiguration";
import { WorkoutControls } from "./WorkoutControls";
import { WorkoutDisplay } from "./WorkoutDisplay";

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

    const {
        isRunning,
        isPaused,
        currentRep,
        currentCount,
        timeElapsed,
        currentSet,
        isResting,
        restTimeLeft,
        startWorkout,
        pauseWorkout,
        stopWorkout,
    } = useBurpeeWorkout(config, useVoice);

    const { secondsPerRep } = calculatePacing(config, useVoice);

    return (
        <div className="min-h-screen bg-blue-900 w-full">
            {/* Background pattern overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={
                    {
                        // backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }
                }
            ></div>

            <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
                {/* Header */}
                <div className="flex-shrink-0 px-6 pt-safe pb-4">
                    <div className="mt-8 text-center">
                        <h1 className="font-bold text-3xl text-white">Burpee Workout</h1>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-safe">
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
                                {process.env.NODE_ENV === "development" && (
                                    <Button
                                        onClick={() => {
                                            speak("Testing voice. One, two, three, four, five!", {
                                                rate: 1.2,
                                            });
                                        }}
                                        variant="ghost"
                                        className="h-14 w-full rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                                        size="sm"
                                    >
                                        Test Voice
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
