import { MongoClient, type Db } from "mongodb";

// Singleton MongoDB client with graceful fallback.
// If the cluster is unreachable (sandbox, firewall, DNS), every helper below
// transparently returns null and the caller falls back to demo data.

const uri = process.env.MONGODB_URI || "";
const dbName = "ResQNet";

let clientPromise: Promise<MongoClient | null> | null = null;
let connectionState: "idle" | "ok" | "failed" = "idle";

export function isDbAvailable(): boolean {
  return connectionState === "ok";
}

export function getDbStatus(): "idle" | "ok" | "failed" {
  return connectionState;
}

async function getClient(): Promise<MongoClient | null> {
  if (!uri) {
    connectionState = "failed";
    return null;
  }
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });
      await client.connect();
      await client.db(dbName).command({ ping: 1 });
      connectionState = "ok";
      console.log("[mongodb] Connected to MongoDB Atlas — ResQNet");
      return client;
    } catch (err) {
      connectionState = "failed";
      console.warn(
        "[mongodb] Could not connect to MongoDB — falling back to in-memory demo data.",
        (err as Error).message,
      );
      return null;
    }
  })();
  return clientPromise;
}

export async function withDb<T>(
  fn: (db: Db) => Promise<T>,
): Promise<{ result: T | null; ok: boolean }> {
  try {
    const client = await getClient();
    if (!client) return { result: null, ok: false };
    const db = client.db(dbName);
    const result = await fn(db);
    return { result, ok: true };
  } catch (err) {
    console.warn(
      "[mongodb] DB operation failed — using fallback.",
      (err as Error).message,
    );
    return { result: null, ok: false };
  }
}

export async function seedDemoCollections(): Promise<void> {
  // Best-effort seed; ignore failures — demo data is always available in-memory.
  const { demoHospitals, demoSpecialists, demoAmbulances, demoBloodResources } =
    await import("./demo-data");
  const client = await getClient();
  if (!client) return;
  try {
    const db = client.db(dbName);
    const collections = [
      ["hospitals", demoHospitals],
      ["specialists", demoSpecialists],
      ["ambulances", demoAmbulances],
      ["blood_resources", demoBloodResources],
    ] as const;
    for (const [name, data] of collections) {
      const count = await db.collection(name).countDocuments();
      if (count === 0) {
        await db.collection(name).insertMany(data as any);
        console.log(`[mongodb] Seeded ${name} (${(data as any[]).length} docs)`);
      }
    }
  } catch (err) {
    console.warn("[mongodb] Seed failed:", (err as Error).message);
  }
}
