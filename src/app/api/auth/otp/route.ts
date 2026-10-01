import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(["signup", "forgot"]).optional(),
});

// OTP codes are stored in-memory per email (sandbox-friendly).
const otps = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: Request) {
  const rl = rateLimit("otp", 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many OTP requests." }, { status: 429 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otps.set(parsed.data.email, { code, expiresAt });

  // In a real app we'd send email/SMS — in the sandbox we just return it for demo convenience.
  return NextResponse.json({
    sent: true,
    demoCode: code, // remove in production
  });
}

export async function PUT(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { email, code } = body as { email?: string; code?: string };
  if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 422 });
  const entry = otps.get(email);
  if (!entry || entry.expiresAt < Date.now()) {
    return NextResponse.json({ error: "OTP expired" }, { status: 410 });
  }
  if (entry.code !== code.trim()) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }
  otps.delete(email);
  return NextResponse.json({ verified: true });
}
