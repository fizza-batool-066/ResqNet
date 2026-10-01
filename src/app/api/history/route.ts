import { NextResponse } from "next/server";
import { withDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/history?userId=... — returns the user profile (blood group, allergies, medicines, conditions, contacts, reports)
export async function GET(req: Request) {
  const user = requireUser(req);
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || user?.sub || "guest";
  const { result, ok } = await withDb(async (db) => {
    return await db.collection("profiles").findOne({ userId });
  });
  if (ok && result) {
    return NextResponse.json({ profile: result });
  }
  return NextResponse.json({ profile: null });
}

const profileSchema = z.object({
  bloodGroup: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicines: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  emergencyContacts: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        relation: z.string(),
        phone: z.string(),
      }),
    )
    .optional(),
  reports: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        uploadedAt: z.string(),
        summary: z.string().optional(),
        fileName: z.string().optional(),
      }),
    )
    .optional(),
});

// PUT /api/history — upsert the entire profile for the authenticated user
export async function PUT(req: Request) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 422 },
    );
  }
  const { ok } = await withDb(async (db) => {
    await db.collection("profiles").updateOne(
      { userId: user.sub },
      {
        $set: {
          userId: user.sub,
          bloodGroup: parsed.data.bloodGroup,
          age: parsed.data.age,
          gender: parsed.data.gender,
          allergies: parsed.data.allergies || [],
          medicines: parsed.data.medicines || [],
          conditions: parsed.data.conditions || [],
          emergencyContacts: parsed.data.emergencyContacts || [],
          reports: parsed.data.reports || [],
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );
    // Also log activity
    await db.collection("activity_logs").insertOne({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.sub,
      type: "report",
      message: `Medical history updated by ${user.email}`,
      _persistedAt: new Date(),
    });
  });
  return NextResponse.json({ saved: ok });
}

// PATCH /api/history/contacts — add an emergency contact
export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // Body shape: { contacts: [{id, name, relation, phone}, ...] } or { reports: [...] }
  const { ok } = await withDb(async (db) => {
    if (Array.isArray(body?.contacts)) {
      await db.collection("profiles").updateOne(
        { userId: user.sub },
        {
          $set: { emergencyContacts: body.contacts, updatedAt: new Date().toISOString() },
          $setOnInsert: { createdAt: new Date().toISOString() },
        },
        { upsert: true },
      );
    }
    if (Array.isArray(body?.reports)) {
      await db.collection("profiles").updateOne(
        { userId: user.sub },
        {
          $set: { reports: body.reports, updatedAt: new Date().toISOString() },
          $setOnInsert: { createdAt: new Date().toISOString() },
        },
        { upsert: true },
      );
    }
  });
  return NextResponse.json({ saved: ok });
}
