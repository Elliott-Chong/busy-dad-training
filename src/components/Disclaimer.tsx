export function Disclaimer() {
	return (
		<div className="mt-8 rounded-2xl border border-white/20 bg-white/5 p-4 text-center backdrop-blur-sm">
			<p className="text-sm text-white/70">
				This is an unofficial hobby project inspired by{" "}
				<a
					href="https://busydadtraining.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-400 underline hover:text-blue-300"
				>
					Busy Dad Training
				</a>
				.
			</p>
			<p className="mt-2 text-sm text-white/70">
				I am not affiliated with the official Busy Dad Training program.
			</p>
			<p className="mt-2 text-sm text-white/70">
				<a
					href="https://github.com/elliott-chong/busy-dad-training"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-400 underline hover:text-blue-300"
				>
					View source on GitHub
				</a>
			</p>
		</div>
	);
}