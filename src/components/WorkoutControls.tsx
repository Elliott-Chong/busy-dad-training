import { Button } from "@/components/ui/button";

interface WorkoutControlsProps {
	isPaused: boolean;
	onPause: () => void;
	onStop: () => void;
}

export function WorkoutControls({
	isPaused,
	onPause,
	onStop,
}: WorkoutControlsProps) {
	return (
		<div className="flex gap-3">
			<Button
				onClick={onPause}
				variant="outline"
				className="h-14 flex-1 rounded-full border-white/20 bg-white/10 font-semibold text-lg text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-[0.98]"
			>
				{isPaused ? "Resume" : "Pause"}
			</Button>
			<Button
				onClick={onStop}
				className="h-14 flex-1 rounded-full bg-red-600/80 font-semibold text-lg text-white backdrop-blur-sm transition-all hover:bg-red-700/80 active:scale-[0.98]"
			>
				Stop
			</Button>
		</div>
	);
}
