import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PACE_SETTINGS, type WorkoutConfig } from "@/lib/burpee-utils";

interface WorkoutConfigurationProps {
	config: WorkoutConfig;
	onConfigChange: (config: WorkoutConfig) => void;
	useVoice: boolean;
	onVoiceToggle: (value: boolean) => void;
	secondsPerRep: number;
}

export function WorkoutConfiguration({
	config,
	onConfigChange,
	useVoice,
	onVoiceToggle,
	secondsPerRep,
}: WorkoutConfigurationProps) {
	// Convert pace to slider value (0.5s to 1.0s range)
	const paceToSlider = (pace: number) => ((pace - 0.5) / 0.5) * 100;
	const sliderToPace = (value: number) => 0.5 + (value / 100) * 0.5;

	const currentPace =
		config.customPace || PACE_SETTINGS[config.pace || "default"];
	const sliderValue = paceToSlider(currentPace);

	return (
		<div className="space-y-4">
			{/* Main Stats Display */}
			<div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
				<div className="grid grid-cols-2 gap-6">
					{/* Duration */}
					<div className="text-center">
						<div className="font-bold text-6xl text-white">
							{config.duration}
						</div>
						<div className="mt-1 text-lg text-white/70">minutes</div>
					</div>

					{/* Target Reps */}
					<div className="text-center">
						<div className="font-bold text-6xl text-white">
							{config.targetReps}
						</div>
						<div className="mt-1 text-lg text-white/70">reps</div>
					</div>
				</div>

				{/* Workout pace info */}
				<div className="mt-6 border-white/20 border-t pt-6">
					<div className="space-y-1 text-center">
						<div className="font-semibold text-2xl text-white">
							{secondsPerRep.toFixed(1)}s per rep
						</div>
						<div className="text-sm text-white/70">
							{(60 / secondsPerRep).toFixed(1)} reps/min •{" "}
							{(currentPace * 6).toFixed(1)}s burpee •{" "}
							{Math.max(0, secondsPerRep - currentPace * 6).toFixed(1)}s rest
						</div>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="space-y-3">
				{/* Duration Control */}
				<div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
					<div className="flex items-center justify-between">
						<Label className="font-medium text-base text-white">Duration</Label>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() =>
									onConfigChange({
										...config,
										duration: Math.max(1, config.duration - 1),
									})
								}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-medium text-white transition-all hover:bg-white/30 active:scale-95"
							>
								−
							</button>
							<div className="w-16 text-center font-semibold text-white text-xl">
								{config.duration}
							</div>
							<button
								type="button"
								onClick={() =>
									onConfigChange({
										...config,
										duration: Math.min(60, config.duration + 1),
									})
								}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-medium text-white transition-all hover:bg-white/30 active:scale-95"
							>
								+
							</button>
						</div>
					</div>
				</div>

				{/* Target Reps Control */}
				<div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
					<div className="flex items-center justify-between">
						<Label className="font-medium text-base text-white">
							Target Reps
						</Label>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() =>
									onConfigChange({
										...config,
										targetReps: Math.max(1, config.targetReps - 10),
									})
								}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-medium text-white transition-all hover:bg-white/30 active:scale-95"
							>
								−
							</button>
							<div className="w-16 text-center font-semibold text-white text-xl">
								{config.targetReps}
							</div>
							<button
								type="button"
								onClick={() =>
									onConfigChange({
										...config,
										targetReps: Math.min(1000, config.targetReps + 10),
									})
								}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-medium text-white transition-all hover:bg-white/30 active:scale-95"
							>
								+
							</button>
						</div>
					</div>
				</div>

				{/* Count Speed Slider */}
				<div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
					<div className="mb-3 flex items-center justify-between">
						<Label className="font-medium text-base text-white">
							Count Speed
						</Label>
						<span className="font-semibold text-sm text-white">
							{currentPace.toFixed(2)}s
						</span>
					</div>
					<Slider
						value={[sliderValue]}
						onValueChange={(values) => {
							const value = values[0];
							if (value === undefined) return;
							const newPace = sliderToPace(value);
							onConfigChange({ ...config, customPace: newPace });
						}}
						min={0}
						max={100}
						step={5}
						className="py-2 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-track]]:bg-white/20 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white"
					/>
					<div className="mt-2 flex justify-between text-white/60 text-xs">
						<span>0.5s</span>
						<span>0.7s</span>
						<span>1.0s</span>
					</div>
				</div>

				{/* Voice Toggle */}
				<div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
					<div className="flex items-center justify-between">
						<div>
							<Label
								htmlFor="voice-mode"
								className="font-medium text-base text-white"
							>
								Voice Callouts
							</Label>
							<p className="mt-0.5 text-sm text-white/70">
								Hear count callouts instead of beeps
							</p>
						</div>
						<Switch
							id="voice-mode"
							checked={useVoice}
							onCheckedChange={onVoiceToggle}
							className="data-[state=checked]:bg-blue-500"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
