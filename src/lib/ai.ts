// Server-side AI helper. Routes every chat completion through Groq first
// (llama-3.3-70b-versatile by default — switchable to gemma-3-27b-it via
// GROQ_MODEL env var), then falls back to z-ai-web-dev-sdk, then to local
// heuristics. This way the existing 9 agents automatically use Groq without
// each module needing to import the Groq SDK directly.

import ZAI from "z-ai-web-dev-sdk";
import { groqChat } from "./services/groqService";

let zaiPromise: Promise<any> | null = null;

async function getZai(): Promise<any | null> {
  if (zaiPromise) return zaiPromise;
  zaiPromise = (async () => {
    try {
      const zai = await ZAI.create();
      console.log("[ai] ZAI SDK initialized (fallback).");
      return zai;
    } catch (err) {
      console.warn(
        "[ai] ZAI SDK could not initialize — falling back to local heuristics.",
        (err as Error).message,
      );
      return null;
    }
  })();
  return zaiPromise;
}

export interface ChatOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Try Groq first, fall back to ZAI, return "" if both fail. The agent modules
 * then fall back to their heuristic implementations when "" is returned.
 */
export async function chat(opts: ChatOptions): Promise<string> {
  // 1) Groq (primary)
  const groqText = await groqChat(opts.system, opts.user, {
    temperature: opts.temperature ?? 0.4,
    maxTokens: opts.maxTokens ?? 900,
  });
  if (groqText) return groqText;

  // 2) ZAI (fallback when Groq is unreachable, e.g. from a sandboxed network)
  const zai = await getZai();
  if (!zai) return "";
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      thinking: { type: "disabled" },
      temperature: opts.temperature ?? 0.4,
    } as any);
    const content = completion?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch (err) {
    console.warn("[ai] ZAI chat fallback failed:", (err as Error).message);
    return "";
  }
}

// Try to coerce an LLM reply into a JSON object. Returns null if it can't.
export function extractJson<T = any>(text: string): T | null {
  if (!text) return null;
  // Strip markdown code fences
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to find the first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Vision / OCR — accepts base64 (data URL) or remote URL.
export async function visionOcr(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  const zai = await getZai();
  if (!zai) return "";
  try {
    const response = await zai.chat.completions.createVision({
      model: "glm-4v-plus",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      thinking: { type: "disabled" },
    } as any);
    const content = response?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch (err) {
    console.warn("[ai] vision OCR failed:", (err as Error).message);
    return "";
  }
}

// Text-to-speech — returns base64 audio bytes (data URL) or empty string.
export async function tts(text: string, voice?: string): Promise<string> {
  const zai = await getZai();
  if (!zai) return "";
  try {
    const response = await zai.audio.tts.create({
      input: text,
      voice: voice || "tongtong",
      response_format: "wav",
      stream: false,
    } as any);
    if (!response || !response.arrayBuffer) return "";
    const buf = await response.arrayBuffer();
    const b64 = Buffer.from(new Uint8Array(buf)).toString("base64");
    return `data:audio/wav;base64,${b64}`;
  } catch (err) {
    console.warn("[ai] TTS failed:", (err as Error).message);
    return "";
  }
}

// Speech-to-text — accepts base64 audio (data URL) or remote URL.
export async function asr(fileBase64: string): Promise<string> {
  const zai = await getZai();
  if (!zai) return "";
  try {
    const response = await zai.audio.asr.create({
      file_base64: fileBase64,
    } as any);
    if (typeof response === "string") return response;
    if (response?.text) return response.text;
    if (response?.result) return response.result;
    return JSON.stringify(response);
  } catch (err) {
    console.warn("[ai] ASR failed:", (err as Error).message);
    return "";
  }
}
