#!/bin/bash

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Please install it first:"
    echo "   On macOS: brew install ffmpeg"
    echo "   On Ubuntu: sudo apt-get install ffmpeg"
    exit 1
fi

INPUT_FILE="public/6counts_cut.wav"
CUT_FILE="public/6counts_15min.wav"
COMPRESSED_FILE="public/6counts_15min_compressed.wav"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file not found: $INPUT_FILE"
    exit 1
fi

echo "📊 Original file info:"
ffmpeg -i "$INPUT_FILE" 2>&1 | grep -E "Duration|Stream"

# Step 1: Cut the audio from 220 seconds (3:40) for 15 minutes (900 seconds)
echo ""
echo "✂️  Cutting audio: starting at 3:40, duration 15 minutes..."
ffmpeg -i "$INPUT_FILE" \
    -ss 220 \
    -t 900 \
    -c copy \
    "$CUT_FILE" \
    -y

if [ $? -ne 0 ]; then
    echo "❌ Cutting failed!"
    exit 1
fi

CUT_SIZE=$(ls -lh "$CUT_FILE" | awk '{print $5}')
echo "✅ Cut complete! Size: $CUT_SIZE"

# Step 2: Compress the cut audio
echo ""
echo "🔄 Compressing the cut audio..."
ffmpeg -i "$CUT_FILE" \
    -acodec pcm_s16le \
    -ar 16000 \
    -ac 1 \
    "$COMPRESSED_FILE" \
    -y

if [ $? -eq 0 ]; then
    # Get file sizes
    ORIGINAL_SIZE=$(ls -lh "$INPUT_FILE" | awk '{print $5}')
    CUT_SIZE=$(ls -lh "$CUT_FILE" | awk '{print $5}')
    COMPRESSED_SIZE=$(ls -lh "$COMPRESSED_FILE" | awk '{print $5}')
    
    echo ""
    echo "✅ Processing complete!"
    echo "   Original file: $INPUT_FILE ($ORIGINAL_SIZE)"
    echo "   Cut file: $CUT_FILE ($CUT_SIZE)"
    echo "   Compressed file: $COMPRESSED_FILE ($COMPRESSED_SIZE)"
    echo ""
    echo "📊 Final file info:"
    ffmpeg -i "$COMPRESSED_FILE" 2>&1 | grep -E "Duration|Stream"
else
    echo "❌ Compression failed!"
    exit 1
fi

# Optional: Create a 5-minute sample from the compressed file
SAMPLE_FILE="public/6counts_15min_sample.wav"
echo ""
echo "🔄 Creating 5-minute sample for testing..."
ffmpeg -i "$COMPRESSED_FILE" \
    -t 300 \
    -c copy \
    "$SAMPLE_FILE" \
    -y

if [ $? -eq 0 ]; then
    SAMPLE_SIZE=$(ls -lh "$SAMPLE_FILE" | awk '{print $5}')
    echo "✅ Sample created: $SAMPLE_FILE (size: $SAMPLE_SIZE)"
fi

echo ""
echo "📝 Summary of created files:"
echo "   1. $CUT_FILE - 15-minute cut starting at 3:40"
echo "   2. $COMPRESSED_FILE - Compressed version (mono, 16kHz)"
echo "   3. $SAMPLE_FILE - 5-minute sample for testing"
echo ""
echo "🎯 Next step: Run the transcription script with:"
echo "   bun run transcribe 6counts_15min_compressed.wav"
echo "   or for testing:"
echo "   bun run transcribe 6counts_15min_sample.wav"