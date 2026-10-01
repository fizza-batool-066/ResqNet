// ResQNet E2E smoke test — runs against a running dev server (port 3000).
// Verifies the golden path: landing renders → login → dashboard renders →
// emergency analyze returns a plan → plan has all required fields.
//
// Usage: node /home/z/my-project/scripts/e2e-smoke.mjs
//
// Exits 0 on success, 1 on any failure.

const BASE = "http://localhost:3000";

let failures = 0;
function assert(cond, msg) {
  if (cond) {
    console.log("  ✓", msg);
  } else {
    console.error("  ✗", msg);
    failures++;
  }
}

async function get(path) {
  const res = await fetch(BASE + path);
  return { status: res.status, body: await res.json() };
}

async function post(path, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log("\n=== ResQNet E2E Smoke Test ===\n");

  // 1. Landing renders
  console.log("1. Landing page");
  const landing = await fetch(BASE + "/");
  const landingHtml = await landing.text();
  assert(landing.status === 200, "GET / returns 200");
  assert(landingHtml.includes("When Every Second Counts."), "Hero headline present");
  assert(landingHtml.includes("Start Emergency"), "Start Emergency CTA present");
  assert(landingHtml.includes("How It Works"), "How It Works section present");

  // 2. Auth — admin login
  console.log("\n2. Auth — admin login");
  const login = await post("/api/auth/login", {
    email: "admin@resqnet.io",
    password: "admin123",
  });
  assert(login.status === 200, "POST /api/auth/login returns 200");
  assert(login.body.user?.role === "admin", "Logged in user is admin");
  assert(typeof login.body.token === "string", "JWT token returned");
  const token = login.body.token;

  // 3. Hospitals API
  console.log("\n3. Hospitals API");
  const hospitals = await get("/api/hospitals");
  assert(hospitals.status === 200, "GET /api/hospitals returns 200");
  assert(Array.isArray(hospitals.body.hospitals) && hospitals.body.hospitals.length > 0, "Hospitals returned");
  assert(hospitals.body.hospitals[0].name, "First hospital has a name");
  assert(hospitals.body.hospitals[0].distanceKm !== undefined, "First hospital has distanceKm");

  // 4. Ambulances API
  console.log("\n4. Ambulances API");
  const ambulances = await get("/api/ambulances");
  assert(ambulances.status === 200, "GET /api/ambulances returns 200");
  assert(Array.isArray(ambulances.body.ambulances) && ambulances.body.ambulances.length > 0, "Ambulances returned");

  // 5. Blood API
  console.log("\n5. Blood API");
  const blood = await get("/api/blood");
  assert(blood.status === 200, "GET /api/blood returns 200");
  assert(Array.isArray(blood.body.bloodResources) && blood.body.bloodResources.length > 0, "Blood resources returned");

  // 6. Admin — list users
  console.log("\n6. Admin — list users");
  const adminUsers = await fetch(BASE + "/api/admin/users", {
    headers: { authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  assert(Array.isArray(adminUsers.items), "Admin users endpoint returns items");
  assert(adminUsers.items.length > 0, "At least one user exists");

  // 7. Emergency analyze — golden path
  console.log("\n7. Emergency analyze (full pipeline)");
  const analyze = await post("/api/emergency/analyze", {
    symptoms: "severe chest pain and shortness of breath",
    bloodGroup: "O+",
    language: "en",
  });
  assert(analyze.status === 200, "POST /api/emergency/analyze returns 200");
  assert(analyze.body.plan, "Plan object returned");
  const plan = analyze.body.plan;
  assert(plan.requestId?.startsWith("em-"), "Plan has requestId");
  assert(["Critical", "High", "Medium", "Low"].includes(plan.triage?.urgency), "Triage urgency valid");
  assert(plan.triage?.confidence >= 0 && plan.triage?.confidence <= 1, "Triage confidence in [0,1]");
  assert(plan.recommendedHospital?.name, "Recommended hospital present");
  assert(plan.recommendedAmbulance?.code, "Recommended ambulance present");
  assert(plan.recommendedSpecialist?.name, "Recommended specialist present");
  assert(Array.isArray(plan.nextSteps) && plan.nextSteps.length > 0, "Next steps list non-empty");
  assert(plan.safety?.doNow?.length > 0, "Safety guidance (doNow) present");
  assert(plan.safety?.avoid?.length > 0, "Safety guidance (avoid) present");
  assert(plan.medicalSummary?.length > 0, "Medical summary present");
  assert(plan.reasoning?.length > 0, "Plan reasoning present");
  assert(plan.capacity?.factors?.length > 0, "Capacity factors present");

  // 8. Medical history persistence
  console.log("\n8. Medical history persistence");
  const historyPut = await fetch(BASE + "/api/history", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bloodGroup: "O+",
      allergies: ["penicillin"],
      medicines: ["aspirin 75mg"],
      conditions: ["hypertension"],
      emergencyContacts: [{ id: "c1", name: "Test Contact", relation: "Spouse", phone: "+92-300-1234567" }],
      reports: [],
    }),
  });
  assert(historyPut.status === 200, "PUT /api/history returns 200");
  assert((await historyPut.json()).saved === true || (await historyPut.json()).saved === false, "Saved flag returned");

  const historyGet = await fetch(BASE + "/api/history", {
    headers: { authorization: `Bearer ${token}` },
  });
  const historyData = await historyGet.json();
  assert(historyGet.status === 200, "GET /api/history returns 200");
  assert(historyData.profile, "Profile exists in MongoDB");
  assert(historyData.profile.allergies?.includes("penicillin"), "Allergy persisted");
  assert(historyData.profile.bloodGroup === "O+", "Blood group persisted");

  // 9. Result
  console.log("\n=== Result ===");
  if (failures === 0) {
    console.log("✅ All assertions passed — ResQNet is healthy.\n");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} assertion(s) failed.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
