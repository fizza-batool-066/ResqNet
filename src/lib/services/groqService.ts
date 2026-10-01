/**
 * src/lib/services/groqService.ts
 * -----------------------------------------------------------------------------
 * Reusable Groq LLM client for ResQNet.
 *
 * - Primary model: llama-3.3-70b-versatile (default)
 * - Switchable to gemma-3-27b-it (or any other Groq-supported model) via the
 *   GROQ_MODEL environment variable — no code changes required.
 * - Falls back to the existing z-ai-web-dev-sdk (ZAI) chat completion API when
 *   Groq is unreachable (e.g. sandboxed environments with IP restrictions),
 *   so the app never breaks during demos or in regions where Groq is blocked.
 * - Returns parsed JSON when the caller requests JSON mode, with a robust
 *   extraction fallback that strips ```json fences and trailing prose.
 *
 * Usage:
 *   import { llmComplete, llmJson } from "@/lib/services/groqService";
 *   const plan = await llmJson<EmergencyPlan>(systemPrompt, userPrompt);
 *
 * All agent modules call this service — never the raw SDK — so swapping the
 * provider or model is a one-file change.
 * -----------------------------------------------------------------------------
 */
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
// Default to llama-3.3-70b-versatile. Override at deploy time by setting
// GROQ_MODEL=gemma-3-27b-it (or any other Groq-supported model).
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

let groqClient: Groq | null = null;
let groqDisabledUntil = 0;

function getClient(): Groq | null {
  if (!GROQ_API_KEY) return null;
  if (Date.now() < groqDisabledUntil) return null;
  if (groqClient) return groqClient;
  try {
    groqClient = new Groq({ apiKey: GROQ_API_KEY, maxRetries: 1, timeout: 30_000 });
    return groqClient;
  } catch (err) {
    console.warn("[groq] Failed to construct client:", (err as Error).message);
    return null;
  }
}

/** Disable Groq for a few seconds after a failure so we don't keep retrying. */
function markGroqFailed(): void {
  groqDisabledUntil = Date.now() + 15_000;
}

/** Lazy-load the ZAI fallback only when Groq is unavailable. */
async function zaiChat(system: string, user: string): Promise<string> {
  try {
    const ZAI = await import("z-ai-web-dev-sdk").then((m: any) => m.default ?? m);
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return completion?.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.warn("[groq] ZAI fallback also failed:", (err as Error).message);
    return "";
  }
}

/**
 * Low-level chat completion. Returns the assistant's text content.
 * Tries Groq first, then ZAI, then returns an empty string.
 */
export async function llmComplete(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const client = getClient();
  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 900,
      });
      const text = completion?.choices?.[0]?.message?.content ?? "";
      if (text) return text;
    } catch (err: any) {
      console.warn(
        `[groq] Completion failed (${err?.status ?? "?"}): ${err?.message ?? err}. Falling back to ZAI.`,
      );
      markGroqFailed();
    }
  }
  return zaiChat(systemPrompt, userPrompt);
}

/** Alias used by `src/lib/ai.ts` so the existing chat() wrapper can route
 *  through Groq without each agent module needing to change. */
export async function groqChat(
  system: string,
  user: string,
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  // Only call Groq if the key is set AND we haven't recently failed.
  // If Groq fails, return "" so the caller falls back to ZAI.
  if (!GROQ_API_KEY || Date.now() < groqDisabledUntil) return "";
  const client = getClient();
  if (!client) return "";
  try {
    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 900,
    });
    const text = completion?.choices?.[0]?.message?.content ?? "";
    if (text) {
      if (process.env.DEBUG_GROQ === "1") console.log("[groq] OK", GROQ_MODEL);
      return text;
    }
    return "";
  } catch (err: any) {
    console.warn(
      `[groq] Chat failed (${err?.status ?? "?"}): ${err?.message ?? err}. Falling back to ZAI.`,
    );
    markGroqFailed();
    return "";
  }
}

/**
 * Chat completion that returns parsed JSON. Asks the model for JSON,
 * then extracts and parses it. Returns null if parsing fails.
 */
export async function llmJson<T = any>(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<T | null> {
  // Append a strict JSON instruction to the system prompt.
  const jsonSystem = `${systemPrompt}\n\nCRITICAL: Respond with a single valid JSON object only. No markdown, no code fences, no prose before or after. Use double quotes for all keys and string values.`;
  const raw = await llmComplete(jsonSystem, userPrompt, opts);
  if (!raw) return null;
  return extractJson<T>(raw);
}

/**
 * Robust JSON extractor — handles ```json fences, leading/trailing prose,
 * and partial responses. Returns null if no JSON object can be found.
 */
export function extractJson<T = any>(text: string): T | null {
  if (!text) return null;
  // Strip markdown code fences if present.
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  // Find the first { ... } block.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    // Try a lenient cleanup: remove trailing commas.
    try {
      return JSON.parse(slice.replace(/,(\s*[}\]])/g, "$1")) as T;
    } catch {
      return null;
    }
  }
}

/** Health check — returns true if Groq responded successfully. */
export async function groqHealthCheck(): Promise<{
  ok: boolean;
  model: string;
  error?: string;
}> {
  const client = getClient();
  if (!client) return { ok: false, model: GROQ_MODEL, error: "no-key-or-disabled" };
  try {
    const c = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 4,
    });
    return { ok: !!c?.choices?.length, model: GROQ_MODEL };
  } catch (err: any) {
    return { ok: false, model: GROQ_MODEL, error: err?.message ?? "unknown" };
  }
}

export const groqModel = GROQ_MODEL;
export const groqEnabled = !!GROQ_API_KEY;
