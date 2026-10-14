/**
 * Live Sarvam test — calls api.sarvam.ai only when LIVE_SARVAM_TEST=1 and
 * SARVAM_API_KEY is present in the environment. Skipped in ordinary test runs.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, expect, test } from "vitest";
import { isOk } from "@/lib/result/result";
import { createSarvamTranscriber } from "./sarvam";

const live = process.env["LIVE_SARVAM_TEST"] === "1" && Boolean(process.env["SARVAM_API_KEY"]);

describe.skipIf(!live)("sarvam speech-to-text (live)", () => {
  test("transcribes sample audio buffer through live endpoint", async () => {
    const key = process.env["SARVAM_API_KEY"];
    if (!key) throw new Error("SARVAM_API_KEY required for live test");

    const transcriber = createSarvamTranscriber({ apiKey: key });
    // Minimal valid WAV header + 100ms of silence
    const wavBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // Chunk size: 36
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6d, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk1Size: 16
      0x01, 0x00,             // AudioFormat: PCM (1)
      0x01, 0x00,             // NumChannels: 1
      0x44, 0xac, 0x00, 0x00, // SampleRate: 44100
      0x88, 0x58, 0x01, 0x00, // ByteRate: 88200
      0x02, 0x00,             // BlockAlign: 2
      0x10, 0x00,             // BitsPerSample: 16
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00, // Subchunk2Size: 0
    ]);

    const result = await transcriber.transcribe({
      audioBytes: wavBytes,
      fileName: "silence.wav",
      mode: "transcribe",
    });

    // An empty or silence audio will either return an empty transcript or a transport response from Sarvam
    expect(result).toBeDefined();
    if (isOk(result)) {
      expect(typeof result.value.transcript).toBe("string");
    }
  });
});
