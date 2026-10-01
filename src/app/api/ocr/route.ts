import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { visionOcr } from "@/lib/ai";

const schema = z.object({
  image: z.string().min(50), // data URL or remote URL
  prompt: z.string().optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit("ocr", 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many OCR requests." }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Image required" }, { status: 422 });
  }
  const { image, prompt } = parsed.data;

  const ocrPrompt =
    prompt ||
    `You are reading a medical document (prescription, lab report, MRI report, blood report, or medical history). 
Extract ALL the text you can read verbatim. Then list medicines, dosages, dates, findings, patient name, and doctor name. 
Return a JSON object: { "rawText": "...", "structured": { ... } }`;

  const text = await visionOcr(image, ocrPrompt);
  if (!text) {
    return NextResponse.json({
      text: "",
      note: "OCR service unavailable — please type the symptoms manually.",
    });
  }
  return NextResponse.json({ text });
}
