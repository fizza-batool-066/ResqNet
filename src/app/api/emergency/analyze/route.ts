import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { withDb } from "@/lib/mongodb";
import {
  runTriage,
  runHospitalAgentSync,
  runCapacityAgent,
  runSpecialistAgent,
  runAmbulanceAgent,
  runBloodAgent,
  runSafetyAgent,
  runCoordinator,
  runDocumentAgent,
} from "@/lib/agents";
import type { EmergencyPlan, Language } from "@/lib/types";

const schema = z.object({
  symptoms: z.string().min(3).max(2000),
  language: z.enum(["en", "ur", "rur"]).optional(),
  bloodGroup: z.string().optional(),
  documentText: z.string().optional(), // OCR text if uploaded
});

export async function POST(req: Request) {
  const rl = rateLimit("emergency-analyze", 12, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 422 },
    );
  }
  const { symptoms, language = "en", bloodGroup, documentText } = parsed.data;

  try {
    // 1) Triage
    const triage = await runTriage(symptoms, language as Language);

    // 2) Hospitals — ranked with reasons
    const rankedHospitals = runHospitalAgentSync({
      symptoms,
      suspectedCategory: triage.suspectedCategory,
    });
    const recommendedHospital = rankedHospitals[0];
    const alternativeHospitals = rankedHospitals.slice(1, 4);

    // 3) Capacity (Bed) score for recommended hospital
    const capacity = runCapacityAgent(recommendedHospital);

    // 4) Specialist
    const specialist = runSpecialistAgent({
      suspectedCategory: triage.suspectedCategory,
      symptoms,
    });

    // 5) Ambulance — with reasons
    const ambulance = runAmbulanceAgent({ urgency: triage.urgency });

    // 6) Blood — only if bloodGroup provided, with reasons
    const bloodMatch = runBloodAgent({ bloodGroup });

    // 7) Document summary (only if uploaded text exists)
    let documentSummary;
    if (documentText && documentText.trim().length > 10) {
      documentSummary = await runDocumentAgent(documentText, language as Language);
    }

    // 8) Safety guidance
    const safety = await runSafetyAgent(symptoms, triage.urgency, language as Language);

    // 9) Coordinator — with full context including capacity + reasons
    const coord = await runCoordinator({
      symptoms,
      triage,
      hospital: recommendedHospital,
      specialist,
      ambulance,
      blood: bloodMatch,
      capacity,
      documentSummary,
      safety,
      lang: language as Language,
    });

    // Build per-agent reasoning summary (used by the UI to show "Why?"):
    const agentReasoning = {
      triage: [
        `Suspected category: ${triage.suspectedCategory}`,
        `Confidence: ${(triage.confidence * 100).toFixed(0)}%`,
        ...(triage.redFlags.length ? [`Red flags: ${triage.redFlags.join(", ")}`] : []),
        triage.reasoning,
      ],
      hospital: recommendedHospital.reasons || [],
      bed: capacity.reasoning ? [capacity.reasoning] : [`Suitability: ${(capacity.suitability * 100).toFixed(0)}%`],
      blood: bloodMatch?.reasons || (bloodGroup ? [`No ${bloodGroup} match found`] : ["Blood group not specified"]),
      ambulance: ambulance.reasons || [],
      document: documentSummary
        ? [`${documentSummary.reportType}`, documentSummary.importantFindings]
        : ["No document uploaded"],
      specialist: [
        `${specialist.specialty} (${specialist.experience} yrs)`,
        specialist.available ? "Available now" : "Off-duty",
        specialist.hospital,
      ],
      coordinator: coord.reasoning,
    };

    // Confidence scores (rendered as progress bars in UI)
    const confidence = {
      triage: triage.confidence,
      hospitalMatch: recommendedHospital.matchScore ?? (recommendedHospital.suitability || 0) / 25,
      ambulanceMatch: ambulance.matchScore ?? 0.85,
      bloodMatch: bloodMatch?.matchScore ?? 0,
      bedAvailability: capacity.suitability,
      overall: Math.min(
        1,
        (triage.confidence +
          (recommendedHospital.matchScore ?? 0.7) +
          (ambulance.matchScore ?? 0.85) +
          (bloodMatch?.matchScore ?? 0.5) +
          capacity.suitability) /
          5,
      ),
    };

    const plan: EmergencyPlan = {
      requestId: `em-${Date.now()}`,
      createdAt: new Date().toISOString(),
      symptoms,
      triage,
      recommendedHospital,
      alternativeHospitals,
      recommendedSpecialist: specialist,
      recommendedAmbulance: ambulance,
      bloodMatch,
      capacity,
      documentSummary,
      safety,
      medicalSummary: coord.medicalSummary,
      nextSteps: coord.nextSteps,
      reasoning: coord.reasoning,
      agentReasoning,
      confidence,
      // Initial status is "draft" — the plan stays in DRAFT mode until the
      // user explicitly approves it via the Human Approval gate. Only after
      // approval does the plan become "confirmed" and the ambulance is
      // actually dispatched.
      status: "draft",
    };

    // Persist the emergency plan and request to MongoDB (best-effort).
    await withDb(async (db) => {
      await db.collection("emergency_plans").insertOne({
        ...plan,
        _persistedAt: new Date(),
      });
      await db.collection("emergency_requests").insertOne({
        id: plan.requestId,
        userId: null,
        symptoms: plan.symptoms,
        inputMethod: "text",
        createdAt: plan.createdAt,
        status: "plan_ready",
        planId: plan.requestId,
        _persistedAt: new Date(),
      });
      await db.collection("activity_logs").insertOne({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "emergency",
        message: `Emergency request ${plan.requestId.slice(-6)} analyzed — ${plan.triage.urgency} urgency`,
        _persistedAt: new Date(),
      });
    });

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[emergency/analyze] error:", err);
    return NextResponse.json(
      { error: "Could not analyze emergency. Please try again." },
      { status: 500 },
    );
  }
}
