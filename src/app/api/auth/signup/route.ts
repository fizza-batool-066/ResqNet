import { NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/mongodb";
import { hashPassword, signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { demoAdminUser, demoUser } from "@/lib/demo-data";
import { normalizeEmail, saveLocalUser, hasLocalUser } from "@/lib/local-auth";
import type { User } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  phone: z.string().max(20).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit("signup", 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
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
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 422 },
    );
  }
  const { name, email, password, phone, role } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  // Demo admin shortcut — judge can login as admin without DB
  if (normalizedEmail === "admin@resqnet.io") {
    return NextResponse.json(
      { error: "Use the dedicated admin login." },
      { status: 409 },
    );
  }

  if (hasLocalUser(normalizedEmail)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const id = `user-${Date.now()}`;
  const passwordHash = hashPassword(password);

  // Try to persist in MongoDB
  const { ok } = await withDb(async (db) => {
    const existing = await db.collection("users").findOne({ email: normalizedEmail });
    if (existing) throw new Error("email-exists");
    await db.collection("users").insertOne({
      id,
      name,
      email: normalizedEmail,
      phone: phone || "",
      role: role || "user",
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    // Seed a blank profile
    await db
      .collection("profiles")
      .updateOne(
        { userId: id },
        { $setOnInsert: { userId: id, allergies: [], medicines: [], conditions: [], emergencyContacts: [], reports: [] } },
        { upsert: true },
      );
  });

  const user: User = {
    id: ok ? id : `local-${id}`,
    name,
    email: normalizedEmail,
    phone,
    role: (role || "user") as "user" | "admin",
    createdAt: new Date().toISOString(),
    avatarColor: "#0ea5e9",
  };

  saveLocalUser(user, passwordHash);

  const token = signToken(user);
  return NextResponse.json({ user, token });
}

// Suppress unused-import warnings (demoAdminUser/demoUser used for future seed)
void demoAdminUser;
void demoUser;
