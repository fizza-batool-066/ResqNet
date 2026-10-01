import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { asr } from "@/lib/ai";

const schema = z.object({
  audio: z.string().min(50), // base64 data URL
});

export async function POST(req: Request) {
  const rl = rateLimit("asr", 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many ASR requests." }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Audio required" }, { status: 422 });
  }
  const text = await asr(parsed.data.audio);
  if (!text) {
    return NextResponse.json({
      text: "",
      note: "ASR service unavailable — please type your symptoms or use the browser live mic.",
    });
  }
  return NextResponse.json({ text });
}
