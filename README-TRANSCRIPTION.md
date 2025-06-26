# Audio Transcription Guide

## Prerequisites

1. Make sure you have an OpenAI API key
2. Your audio file should be at `public/6counts_cut.wav`

## Running the Transcription

1. Set your OpenAI API key:
```bash
export OPENAI_API_KEY='your-api-key-here'
```

2. Run the transcription script:
```bash
bun run transcribe
```

## What the Script Does

1. **Transcribes the audio** using OpenAI's Whisper API
2. **Extracts callouts** for:
   - Count callouts (1-6): "One", "Two", "Three", "Four", "Five", "Six"
   - Rep numbers (1-200): "1", "2", "3", etc.
3. **Saves output** to:
   - `public/audio/transcript.json` - Full transcription with timestamps
   - `public/audio/callout-manifest.json` - Extracted callouts with timestamps

## Next Steps

After transcription, you can:

1. **Extract individual audio clips** using the timestamps:
```bash
# Example: Extract "One" callout
ffmpeg -i public/6counts_cut.wav -ss START_TIME -to END_TIME -c copy public/audio/count-1.wav
```

2. **Use in your app** by replacing the speech synthesis with audio playback at specific timestamps

## Using the Manifest in Your App

The manifest file will look like:
```json
{
  "audioFile": "/6counts_cut.wav",
  "counts": {
    "1": { "start": 1.2, "end": 1.8, "text": "One" },
    "2": { "start": 2.0, "end": 2.6, "text": "Two" },
    // ...
  },
  "reps": {
    "1": { "start": 5.2, "end": 5.8, "text": "1" },
    "2": { "start": 11.4, "end": 12.0, "text": "2" },
    // ...
  }
}
```

You can then use the Web Audio API or HTML5 audio to play specific segments of the audio file.