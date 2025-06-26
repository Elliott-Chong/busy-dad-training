#!/bin/bash

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Please install it first:"
    echo "   On macOS: brew install ffmpeg"
    echo "   On Ubuntu: sudo apt-get install ffmpeg"
    exit 1
fi

INPUT_FILE="public/6counts_cut.wav"
OUTPUT_FILE="public/6counts_compressed.wav"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file not found: $INPUT_FILE"
    exit 1
fi

# Get file info
echo "📊 Original file info:"
ffmpeg -i "$INPUT_FILE" 2>&1 | grep -E "Duration|Stream"

# Compress the audio file
# - Convert to mono (-ac 1)
# - Reduce sample rate to 16kHz (good for speech)
# - Use 16-bit PCM encoding
# - This should reduce file size significantly while maintaining speech quality
echo ""
echo "🔄 Compressing audio file..."
ffmpeg -i "$INPUT_FILE" \
    -acodec pcm_s16le \
    -ar 16000 \
    -ac 1 \
    "$OUTPUT_FILE" \
    -y

# Check if compression was successful
if [ $? -eq 0 ]; then
    # Get file sizes
    ORIGINAL_SIZE=$(ls -lh "$INPUT_FILE" | awk '{print $5}')
    COMPRESSED_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    
    echo ""
    echo "✅ Compression complete!"
    echo "   Original size: $ORIGINAL_SIZE"
    echo "   Compressed size: $COMPRESSED_SIZE"
    echo "   Output file: $OUTPUT_FILE"
    echo ""
    echo "📊 Compressed file info:"
    ffmpeg -i "$OUTPUT_FILE" 2>&1 | grep -E "Duration|Stream"
else
    echo "❌ Compression failed!"
    exit 1
fi

# Optional: Create a shorter sample for testing (first 5 minutes)
SAMPLE_FILE="public/6counts_sample.wav"
echo ""
echo "🔄 Creating 5-minute sample for testing..."
ffmpeg -i "$OUTPUT_FILE" \
    -t 300 \
    -c copy \
    "$SAMPLE_FILE" \
    -y

if [ $? -eq 0 ]; then
    SAMPLE_SIZE=$(ls -lh "$SAMPLE_FILE" | awk '{print $5}')
    echo "✅ Sample created: $SAMPLE_FILE (size: $SAMPLE_SIZE)"
fi