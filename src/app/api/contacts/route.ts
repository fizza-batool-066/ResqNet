import { NextResponse } from "next/server";
import { withDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

// GET /api/contacts?userId=... — returns contacts for the user
export async function GET(req: Request) {
  const user = requireUser(req);
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || user?.sub || "guest";
  const { result, ok } = await withDb(async (db) => {
    const profile = await db.collection("profiles").findOne({ userId });
    return profile?.emergencyContacts || [];
  });
  if (ok && result) {
    return NextResponse.json({ contacts: result });
  }
  // No DB / no profile → empty list (the client-side store provides demo contacts)
  return NextResponse.json({ contacts: [] });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const contact = {
    id: `c-${Date.now()}`,
    name: body.name,
    relation: body.relation,
    phone: body.phone,
  };
  const { ok } = await withDb(async (db) => {
    await db.collection("profiles").updateOne(
      { userId: user.sub },
      { $push: { emergencyContacts: contact } },
      { upsert: true },
    );
  });
  return NextResponse.json({ contact, persisted: ok });
}
