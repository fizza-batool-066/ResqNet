// Verify ResQNet collections in MongoDB Atlas
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });

try {
  await client.connect();
  const db = client.db("ResQNet");
  const collections = await db.listCollections().toArray();
  console.log("Collections in ResQNet:");
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  - ${c.name}: ${count} docs`);
  }
  console.log("\nSample users:");
  const users = await db.collection("users").find({}).limit(3).toArray();
  for (const u of users) console.log("  -", u.email, "(", u.role, ")", "id:", u.id);
  console.log("\nSample hospitals:");
  const hospitals = await db.collection("hospitals").find({}).limit(3).toArray();
  for (const h of hospitals) console.log("  -", h.name, "(", h.area, ",", h.city, ")");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await client.close().catch(() => {});
}
