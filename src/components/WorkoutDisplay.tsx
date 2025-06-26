import {
	type WorkoutConfig,
	calculatePacing,
	formatTime,
} from "@/lib/burpee-utils";
import { useEffect, useRef } from "react";

interface WorkoutDisplayProps {
	currentRep: number;
	currentCount: number;
	timeElapsed: number;
	duration: number; // in minutes
	isResting: boolean;
	restTimeLeft: number;
	currentSet?: number;
	totalSets?: number;
	mode: "continuous" | "sets";
	targetReps: number;
	config: WorkoutConfig;
	useVoice: boolean;
}

export function WorkoutDisplay({
	currentRep,
	currentCount,
	timeElapsed,
	duration,
	isResting,
	restTimeLeft,
	currentSet,
	totalSets,
	mode,
	targetReps,
	config,
	useVoice,
}: WorkoutDisplayProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Calculate rep timing
	const { secondsPerRep } = calculatePacing(config, useVoice);

	// Draw circular progress for current rep
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const size = 100;
		const centerX = size / 2;
		const centerY = size / 2;
		const radius = 40;

		// Clear canvas
		ctx.clearRect(0, 0, size, size);

		// Background circle
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 6;
		ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
		ctx.stroke();

		// Calculate progress based on count within the rep
		const progress = currentCount / config.countsPerRep;
		const startAngle = -Math.PI / 2;
		const endAngle = startAngle + 2 * Math.PI * progress;

		// Progress arc
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
		ctx.lineWidth = 6;
		ctx.strokeStyle = isResting ? "#fbbf24" : "#60a5fa";
		ctx.lineCap = "round";
		ctx.stroke();

		// Rep duration text
		ctx.font = "bold 24px system-ui";
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		if (isResting) {
			ctx.fillText(restTimeLeft.toString(), centerX, centerY);
			ctx.font = "10px system-ui";
			ctx.fillText("REST", centerX, centerY + 20);
		} else {
			// Show the target seconds per rep
			ctx.fillText(secondsPerRep.toFixed(1), centerX, centerY);
			ctx.font = "10px system-ui";
			ctx.fillText("s/rep", centerX, centerY + 20);
		}
	}, [
		currentCount,
		config.countsPerRep,
		isResting,
		restTimeLeft,
		secondsPerRep,
	]);

	return (
		<div className="">
			{/* Circular progress timer at the top */}
			<div className="mb-6 flex justify-center">
				<canvas ref={canvasRef} width={100} height={100} />
			</div>

			{/* Main display card */}
			<div className="space-y-4">
				{/* Reps Section */}
				<div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
					<div className="text-center">
						<div className="font-bold text-8xl text-white">{currentRep}</div>
						<div className="mt-2 font-medium text-xl text-white/70">REPS</div>
						{/* Progress bar */}
						<div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
							<div
								className="h-full rounded-full bg-blue-400 transition-all duration-300"
								style={{ width: `${(currentRep / targetReps) * 100}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Time Section */}
				<div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
					<div className="text-center">
						<div className="font-bold font-mono text-6xl text-white">
							{formatTime(timeElapsed)}
						</div>
						<div className="mt-2 font-medium text-xl text-white/70">TIME</div>
						{/* Progress bar */}
						<div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
							<div
								className="h-full rounded-full bg-green-400 transition-all duration-300"
								style={{
									width: `${(timeElapsed / (duration * 60 * 1000)) * 100}%`,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
