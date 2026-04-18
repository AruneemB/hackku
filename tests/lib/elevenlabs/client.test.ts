import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ElevenLabs voice selection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers short-name matches from the fallback voice list", async () => {
    const { pickPreferredVoice } = await import("../../../src/lib/elevenlabs/client");

    const picked = pickPreferredVoice(
      [
        { voice_id: "1", category: "premade", name: "Roger - Laid-Back, Casual, Resonant" },
        { voice_id: "2", category: "premade", name: "Jessica - Playful, Bright, Warm" },
      ],
      ["Jessica", "Laura"]
    );

    expect(picked?.voice_id).toBe("2");
  });

  it("parses env-configured preferred voice names", async () => {
    vi.stubEnv("ELEVENLABS_PREFERRED_VOICE_NAMES", "Laura, Bella , Jessica");
    const { getPreferredVoiceNames } = await import("../../../src/lib/elevenlabs/client");

    expect(getPreferredVoiceNames()).toEqual(["Laura", "Bella", "Jessica"]);
  });

  it("uses ELEVENLABS_VOICE_ID directly when speaking", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test-api-key");
    vi.stubEnv("ELEVENLABS_VOICE_ID", "voice-123");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        audio_base64: Buffer.from("hello").toString("base64"),
        alignment: {
          characters: ["H", "i"],
          character_start_times_seconds: [0, 0.1],
          character_end_times_seconds: [0.1, 0.2],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { speak } = await import("../../../src/lib/elevenlabs/client");
    const speech = await speak("Hi", "excited");

    expect(speech?.audio).toBeInstanceOf(ArrayBuffer);
    expect(speech?.alignment?.characters.join("")).toBe("Hi");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/text-to-speech/voice-123/with-timestamps");
  });
});
