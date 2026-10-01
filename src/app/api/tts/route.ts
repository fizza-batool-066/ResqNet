import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { tts } from "@/lib/ai";

const schema = z.object({
  text: z.string().min(1).max(2000),
  voice: z.string().optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit("tts", 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many TTS requests." }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Text required" }, { status: 422 });
  }
  const audio = await tts(parsed.data.text, parsed.data.voice);
  if (!audio) {
    return NextResponse.json({
      audio: "",
      note: "TTS service unavailable — your browser may also narrate via the Web Speech API.",
    });
  }
  return NextResponse.json({ audio });
}
