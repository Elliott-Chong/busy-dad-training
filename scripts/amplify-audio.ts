#!/usr/bin/env bun

import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function amplifyAudio(inputFile: string, outputFile: string, gainDb: number) {
    // Use ffmpeg to amplify audio
    // gainDb: positive number increases volume (e.g., 10 = +10dB)
    const cmd = `ffmpeg -i "${inputFile}" -af "volume=${gainDb}dB" -acodec pcm_s16le -ar 44100 -ac 1 "${outputFile}" -y`;

    try {
        await execAsync(cmd);
        return true;
    } catch (error) {
        console.error(`❌ Failed to amplify ${inputFile}`);
        console.error(error);
        return false;
    }
}

async function main() {
    const countsDir = path.join(process.cwd(), "public/audio/counts");
    const backupDir = path.join(process.cwd(), "public/audio/counts-backup");
    const gainDb = 15; // Increase volume by 20dB

    console.log(`🔊 Amplifying count audio files by +${gainDb}dB`);

    // Create backup directory
    if (!existsSync(backupDir)) {
        await execAsync(`mkdir -p "${backupDir}"`);
    }

    // Process counts 1-5
    for (let count = 1; count <= 5; count++) {
        const inputFile = path.join(countsDir, `${count}.wav`);
        const backupFile = path.join(backupDir, `${count}.wav`);
        const tempFile = path.join(countsDir, `${count}_temp.wav`);

        if (!existsSync(inputFile)) {
            console.log(`⚠️  Count ${count} audio not found, skipping`);
            continue;
        }

        // Backup original
        console.log(`📦 Backing up ${count}.wav`);
        await execAsync(`cp "${inputFile}" "${backupFile}"`);

        // Amplify to temp file
        console.log(`🔊 Amplifying ${count}.wav...`);
        const success = await amplifyAudio(inputFile, tempFile, gainDb);

        if (success) {
            // Replace original with amplified version
            await execAsync(`mv "${tempFile}" "${inputFile}"`);
            console.log(`✅ Count ${count} amplified successfully`);
        }
    }

    console.log("\n✨ Done! Audio files have been amplified.");
    console.log(`📁 Original files backed up to: ${backupDir}`);
    console.log("\nTo restore originals: cp public/audio/counts-backup/*.wav public/audio/counts/");
}

main().catch(console.error);
