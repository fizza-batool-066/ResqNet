import { NextResponse } from "next/server";
import { withDb, seedDemoCollections } from "@/lib/mongodb";
import { demoBloodResources } from "@/lib/demo-data";

export async function GET() {
  await seedDemoCollections();
  const { result, ok } = await withDb(async (db) => {
    return await db.collection("blood_resources").find({}).toArray();
  });
  if (ok && result && result.length) {
    return NextResponse.json({ bloodResources: result });
  }
  return NextResponse.json({ bloodResources: demoBloodResources });
}
