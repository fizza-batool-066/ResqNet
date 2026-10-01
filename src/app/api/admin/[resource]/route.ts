import { NextResponse } from "next/server";
import { withDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  demoHospitals,
  demoSpecialists,
  demoAmbulances,
  demoBloodResources,
  demoUser,
  demoAdminUser,
} from "@/lib/demo-data";

const COLLECTIONS: Record<string, string> = {
  hospitals: "hospitals",
  doctors: "specialists",
  bloodBanks: "blood_resources",
  ambulances: "ambulances",
  users: "users",
  requests: "emergency_requests",
  reports: "medical_reports",
};

const DEMO_FALLBACKS: Record<string, any[]> = {
  hospitals: demoHospitals,
  doctors: demoSpecialists,
  bloodBanks: demoBloodResources,
  ambulances: demoAmbulances,
  users: [demoUser, demoAdminUser],
  requests: [],
  reports: [],
};

export async function GET(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const coll = COLLECTIONS[resource];
  if (!coll) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const { result, ok } = await withDb(async (db) => {
    return await db.collection(coll).find({}).toArray();
  });
  if (ok && result) {
    return NextResponse.json({ resource, items: result });
  }
  return NextResponse.json({ resource, items: DEMO_FALLBACKS[resource] || [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { resource } = await params;
  const rl = rateLimit(`admin-${resource}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const coll = COLLECTIONS[resource];
  if (!coll) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const doc = { ...body, id: body.id || `${resource}-${Date.now()}`, createdAt: new Date().toISOString() };
  const { ok } = await withDb(async (db) => {
    await db.collection(coll).insertOne(doc);
  });
  return NextResponse.json({ item: doc, persisted: ok });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { resource } = await params;
  const coll = COLLECTIONS[resource];
  if (!coll) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });
  const { ok } = await withDb(async (db) => {
    await db.collection(coll).deleteOne({ id });
  });
  return NextResponse.json({ deleted: true, persisted: ok });
}
