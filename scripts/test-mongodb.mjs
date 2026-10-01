// Quick MongoDB Atlas connectivity test
// Usage: node /home/z/my-project/scripts/test-mongodb.mjs

import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
});

try {
  console.log("Connecting to MongoDB Atlas…");
  console.log("URI (masked):", uri.replace(/:[^:@]+@/, ":***@"));
  await client.connect();
  console.log("Connected to MongoDB Atlas");
  const admin = client.db().admin();
  const dbs = await admin.listDatabases();
  console.log("Available databases:", dbs.databases.map((d) => d.name).join(", "));
  const db = client.db("ResQNet");
  const collections = await db.listCollections().toArray();
  console.log("Collections in ResQNet:", collections.map((c) => c.name).join(", ") || "(none yet)");

  const ping = db.collection("pings");
  const insert = await ping.insertOne({ ts: new Date(), msg: "ResQNet connectivity test" });
  console.log("Inserted test doc:", insert.insertedId.toString());
  const count = await ping.countDocuments({});
  console.log("Pings count:", count);
  await ping.deleteMany({});
  console.log("Cleanup done");
} catch (err) {
  console.error("MongoDB Atlas connection failed:", err?.message || err);
  process.exit(1);
} finally {
  await client.close().catch(() => {});
}
