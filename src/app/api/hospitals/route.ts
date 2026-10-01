import { NextResponse } from "next/server";
import { withDb, seedDemoCollections } from "@/lib/mongodb";
import { demoHospitals } from "@/lib/demo-data";

// GET /api/hospitals — list all hospitals.
// Tries MongoDB first; if unavailable or empty, falls back to demo data.
export async function GET() {
  // Best-effort seed (no-op if already seeded or DB unreachable)
  await seedDemoCollections();

  const { result, ok } = await withDb(async (db) => {
    return await db.collection("hospitals").find({}).toArray();
  });
  if (ok && result && result.length) {
    return NextResponse.json({ hospitals: result });
  }
  return NextResponse.json({ hospitals: demoHospitals });
}
