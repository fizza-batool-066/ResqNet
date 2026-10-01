import { NextResponse } from "next/server";
import { withDb, seedDemoCollections } from "@/lib/mongodb";
import { demoAmbulances } from "@/lib/demo-data";

export async function GET() {
  await seedDemoCollections();
  const { result, ok } = await withDb(async (db) => {
    return await db.collection("ambulances").find({}).toArray();
  });
  if (ok && result && result.length) {
    return NextResponse.json({ ambulances: result });
  }
  return NextResponse.json({ ambulances: demoAmbulances });
}
