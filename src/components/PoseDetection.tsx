"use client";

import {
	DrawingUtils,
	FilesetResolver,
	PoseLandmarker,
	type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

export default function PoseDetection() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isWebcamRunning, setIsWebcamRunning] = useState(false);
	const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
		null,
	);
	const animationFrameRef = useRef<number | undefined>(undefined);

	// Pushup tracking states
	const [pushupCount, setPushupCount] = useState(0);
	const [isInDownPosition, setIsInDownPosition] = useState(false);
	const [currentAngle, setCurrentAngle] = useState(0);
	const [formFeedback, setFormFeedback] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

	useEffect(() => {
		const initializePoseLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
			);

			const landmarker = await PoseLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath:
						"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
					delegate: "GPU",
				},
				runningMode: "VIDEO",
				numPoses: 2,
			});

			setPoseLandmarker(landmarker);
		};

		initializePoseLandmarker();

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isWebcamRunning) return;

		const startWebcam = async () => {
			if (!videoRef.current || !canvasRef.current || !poseLandmarker) return;

			try {
				// Safari iOS requires specific constraints
				const constraints = {
					video: {
						facingMode: facingMode,
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
					audio: false,
				};

				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				videoRef.current.srcObject = stream;

				// Ensure video plays inline on iOS
				videoRef.current.setAttribute("playsinline", "true");
				videoRef.current.setAttribute("webkit-playsinline", "true");

				videoRef.current.addEventListener("loadeddata", () => {
					if (canvasRef.current && videoRef.current) {
						canvasRef.current.width = videoRef.current.videoWidth;
						canvasRef.current.height = videoRef.current.videoHeight;
						detectPose();
					}
				});
			} catch (error) {
				console.error("Error accessing webcam:", error);
				setIsWebcamRunning(false);

				// Provide helpful error messages
				const err = error as DOMException;
				if (err.name === "NotAllowedError") {
					setErrorMessage(
						"Camera permission denied. Please allow camera access and try again.",
					);
				} else if (err.name === "NotFoundError") {
					setErrorMessage(
						"No camera found. Please connect a camera and try again.",
					);
				} else if (err.name === "NotReadableError") {
					setErrorMessage("Camera is already in use by another application.");
				} else if (err.name === "OverconstrainedError") {
					setErrorMessage("Camera doesn't support the requested settings.");
				} else if (
					location.protocol !== "https:" &&
					location.hostname !== "localhost"
				) {
					setErrorMessage(
						"Camera access requires HTTPS. Please use a secure connection.",
					);
				} else {
					setErrorMessage(`Camera error: ${err.message || "Unknown error"}`);
				}
			}
		};

		const detectPose = () => {
			if (
				!videoRef.current ||
				!canvasRef.current ||
				!poseLandmarker ||
				!isWebcamRunning
			)
				return;

			const video = videoRef.current;
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const drawingUtils = new DrawingUtils(ctx);

			const processFrame = () => {
				if (!isWebcamRunning) return;

				const startTimeMs = performance.now();

				poseLandmarker.detectForVideo(
					video,
					startTimeMs,
					(result: PoseLandmarkerResult) => {
						ctx.clearRect(0, 0, canvas.width, canvas.height);
						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

						for (const landmarks of result.landmarks) {
							drawingUtils.drawLandmarks(landmarks, {
								radius: (data) =>
									DrawingUtils.lerp(data.from?.z ?? 0, -0.15, 0.1, 5, 1),
							});
							drawingUtils.drawConnectors(
								landmarks,
								PoseLandmarker.POSE_CONNECTIONS,
							);

							// Detect pushups if we have enough landmarks
							if (landmarks.length >= 25) {
								detectPushup(landmarks);
							}
						}
					},
				);

				animationFrameRef.current = requestAnimationFrame(processFrame);
			};

			processFrame();
		};

		startWebcam();

		return () => {
			if (videoRef.current?.srcObject) {
				const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
				for (const track of tracks) {
					track.stop();
				}
			}
		};
	}, [isWebcamRunning, poseLandmarker, facingMode]);

	const toggleWebcam = () => {
		setIsWebcamRunning(!isWebcamRunning);
		setErrorMessage(""); // Clear any error messages
		if (isWebcamRunning) {
			// Reset counter when stopping
			setPushupCount(0);
			setFormFeedback("");
		}
	};

	// Calculate angle between three points
	const calculateAngle = (
		a: { x: number; y: number },
		b: { x: number; y: number },
		c: { x: number; y: number },
	) => {
		const radians =
			Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
		let angle = Math.abs((radians * 180.0) / Math.PI);
		if (angle > 180.0) {
			angle = 360 - angle;
		}
		return angle;
	};

	// Detect pushup based on arm angles
	const detectPushup = (
		landmarks: Array<{ x: number; y: number; z: number }>,
	) => {
		console.log("Landmarks received:", landmarks.length);

		// Key landmarks for pushup detection
		const leftShoulder = landmarks[11];
		const leftElbow = landmarks[13];
		const leftWrist = landmarks[15];
		const rightShoulder = landmarks[12];
		const rightElbow = landmarks[14];
		const rightWrist = landmarks[16];
		const leftHip = landmarks[23];
		const rightHip = landmarks[24];

		// Check if all required landmarks are present
		if (
			!leftShoulder ||
			!leftElbow ||
			!leftWrist ||
			!rightShoulder ||
			!rightElbow ||
			!rightWrist ||
			!leftHip ||
			!rightHip
		) {
			console.log("Missing landmarks!");
			setFormFeedback("Cannot detect all body points - adjust camera");
			return;
		}

		console.log("Left elbow:", leftElbow);
		console.log("Left shoulder:", leftShoulder);
		console.log("Left wrist:", leftWrist);

		// Calculate elbow angles
		const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
		const rightElbowAngle = calculateAngle(
			rightShoulder,
			rightElbow,
			rightWrist,
		);
		const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

		console.log(
			"Left angle:",
			leftElbowAngle,
			"Right angle:",
			rightElbowAngle,
			"Avg:",
			avgElbowAngle,
		);
		setCurrentAngle(Math.round(avgElbowAngle));

		// Check body alignment (shoulders should be above wrists in Y-axis)
		// Note: In MediaPipe, Y increases downward, so shoulders should have smaller Y than wrists
		const shouldersAboveWrists =
			leftShoulder.y < leftWrist.y && rightShoulder.y < rightWrist.y;

		// Check if hips are not too high (plank position)
		const hipHeight = (leftHip.y + rightHip.y) / 2;
		const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
		const goodForm = Math.abs(hipHeight - shoulderHeight) < 0.2; // Increased threshold for better detection

		// Debug info in feedback
		const debugInfo = `Angle: ${Math.round(avgElbowAngle)}° | Shoulders above: ${shouldersAboveWrists} | Form: ${goodForm}`;

		// Alternative simple detection using nose position
		const nose = landmarks[0];
		if (nose) {
			// Simple pushup detection based on nose Y position
			// You can adjust these thresholds based on your camera setup
			if (nose.y > 0.6 && !isInDownPosition) {
				setFormFeedback(`Down! Nose Y: ${nose.y.toFixed(2)} | ${debugInfo}`);
				setIsInDownPosition(true);
			} else if (nose.y < 0.4 && isInDownPosition) {
				setFormFeedback(
					`Up! Rep counted! Nose Y: ${nose.y.toFixed(2)} | ${debugInfo}`,
				);
				setPushupCount((prev) => prev + 1);
				setIsInDownPosition(false);
			} else {
				setFormFeedback(`Nose Y: ${nose.y.toFixed(2)} | ${debugInfo}`);
			}
		}

		// Original angle-based detection (commented out for testing)
		/*
    if (avgElbowAngle < 80) {
      setFormFeedback(`Down position reached! ${debugInfo}`);
      if (!isInDownPosition) {
        setIsInDownPosition(true);
      }
    } else if (avgElbowAngle > 150 && isInDownPosition) {
      setFormFeedback(`Rep completed! ${debugInfo}`);
      setPushupCount((prev) => prev + 1);
      setIsInDownPosition(false);
    } else if (avgElbowAngle > 150) {
      setFormFeedback(`Ready to start - lower down | ${debugInfo}`);
    } else {
      setFormFeedback(`Keep going! ${debugInfo}`);
    }
    */
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="text-center">
				<h1 className="mb-2 font-bold text-3xl">Pushup Counter</h1>
				<p className="text-gray-600">
					Position yourself in view and start doing pushups!
				</p>
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={toggleWebcam}
					className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
					disabled={!poseLandmarker}
				>
					{!poseLandmarker
						? "Loading..."
						: isWebcamRunning
							? "Stop Webcam"
							: "Start Webcam"}
				</button>
				<button
					type="button"
					onClick={() =>
						setFacingMode(facingMode === "user" ? "environment" : "user")
					}
					className="rounded bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600"
				>
					{facingMode === "user" ? "📱 Front" : "📷 Back"}
				</button>
			</div>

			{errorMessage && (
				<div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					{errorMessage}
				</div>
			)}

			{isWebcamRunning && (
				<div className="flex items-center gap-8">
					<div className="text-center">
						<div className="font-bold text-5xl text-blue-600">
							{pushupCount}
						</div>
						<div className="text-gray-600 text-sm">Pushups</div>
					</div>
					<div className="text-center">
						<div className="font-semibold text-2xl">{currentAngle}°</div>
						<div className="text-gray-600 text-sm">Elbow Angle</div>
					</div>
				</div>
			)}

			<div className="relative">
				<video ref={videoRef} className="hidden" autoPlay playsInline muted />
				<canvas
					ref={canvasRef}
					className="rounded border border-gray-300"
					width={640}
					height={480}
				/>
				{isWebcamRunning && formFeedback && (
					<div className="-translate-x-1/2 absolute bottom-4 left-1/2 transform rounded-lg bg-black bg-opacity-70 px-4 py-2 text-white">
						{formFeedback}
					</div>
				)}
			</div>
		</div>
	);
}
