import { formatTime } from "@/lib/burpee-utils";

interface WorkoutProgressProps {
	currentRep: number;
	targetReps: number;
	timeElapsed: number;
	duration: number; // in minutes
	pace: number;
	projectedReps: number;
}

export function WorkoutProgress({
	currentRep,
	targetReps,
	timeElapsed,
	duration,
	pace,
	projectedReps,
}: WorkoutProgressProps) {
	const progress = (currentRep / targetReps) * 100;
	const timeProgress = (timeElapsed / (duration * 60 * 1000)) * 100;

	return (
		<>
			<div className="space-y-2">
				<div className="flex justify-between text-sm">
					<span>Rep Progress</span>
					<span>
						{currentRep} / {targetReps}
					</span>
				</div>
				<div className="h-2 overflow-hidden rounded-full bg-gray-200">
					<div
						className="h-full bg-blue-500 transition-all"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<div className="flex justify-between text-sm">
					<span>Time Progress</span>
					<span>
						{formatTime(timeElapsed)} / {duration}:00
					</span>
				</div>
				<div className="h-2 overflow-hidden rounded-full bg-gray-200">
					<div
						className="h-full bg-green-500 transition-all"
						style={{ width: `${timeProgress}%` }}
					/>
				</div>
			</div>
		</>
	);
}
