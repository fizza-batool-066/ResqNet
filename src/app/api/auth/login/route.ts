import { NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/mongodb";
import { verifyPassword, signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { demoAdminUser } from "@/lib/demo-data";
import { hashPassword } from "@/lib/auth";
import { findLocalUser, normalizeEmail } from "@/lib/local-auth";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  const rl = rateLimit("login", 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute." },
      { status: 429 },
    );
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const { email, password } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  // Demo admin login (always works)
  if (normalizedEmail === "admin@resqnet.io" && password === "admin123") {
    const user: User = demoAdminUser;
    const token = signToken(user);
    return NextResponse.json({ user, token });
  }

  // Try MongoDB
  const { result, ok } = await withDb(async (db) => {
    const doc = await db.collection("users").findOne({ email: normalizedEmail });
    if (!doc) throw new Error("not-found");
    if (!verifyPassword(password, doc.passwordHash)) throw new Error("bad-password");
    return doc;
  });

  if (ok && result) {
    const user: User = {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone || "",
      role: result.role || "user",
      createdAt: result.createdAt,
      avatarColor: "#0ea5e9",
    };
    return NextResponse.json({ user, token: signToken(user) });
  }

  const localUser = findLocalUser(normalizedEmail);
  if (localUser && verifyPassword(password, localUser.passwordHash)) {
    const user: User = {
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      phone: localUser.phone || "",
      role: localUser.role,
      createdAt: localUser.createdAt,
      avatarColor: localUser.avatarColor || "#0ea5e9",
    };
    return NextResponse.json({ user, token: signToken(user) });
  }

  return NextResponse.json(
    {
      error:
        "Account not found in this sandbox. Try signing up first, or use admin@resqnet.io / admin123.",
    },
    { status: 404 },
  );
}

void hashPassword;
