import type {
  TriageResult,
  Hospital,
  Specialist,
  Ambulance,
  BloodResource,
  CapacityScore,
  DocumentSummary,
  SafetyGuidance,
  Urgency,
} from "../types";
import { chat, extractJson } from "../ai";
import {
  TRIAGE_PROMPT,
  HOSPITAL_PROMPT,
  BED_PROMPT,
  BLOOD_PROMPT,
  AMBULANCE_PROMPT,
  DOCUMENT_PROMPT,
  SAFETY_PROMPT,
  COORDINATOR_PROMPT,
  SPECIALIST_PROMPT,
  languageNote,
} from "../prompts";
import {
  demoHospitals,
  demoSpecialists,
  demoAmbulances,
  demoBloodResources,
} from "../demo-data";
import type { Language } from "../types";

// ===== Triage Agent =====
export async function runTriage(
  symptoms: string,
  lang: Language = "en",
): Promise<TriageResult> {
  const langNote = languageNote(lang);
  const text = await chat({
    system: TRIAGE_PROMPT,
    user: `Symptoms: "${symptoms}". ${langNote} Return JSON only.`,
  });
  const parsed = extractJson<TriageResult>(text);
  if (parsed && parsed.urgency) return normalizeTriage(parsed, symptoms);
  return heuristicTriage(symptoms);
}

function normalizeTriage(p: Partial<TriageResult>, symptoms: string): TriageResult {
  return {
    urgency: (["Critical", "High", "Medium", "Low"].includes(p.urgency as string)
      ? p.urgency
      : "Medium") as Urgency,
    confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
    suspectedCategory: p.suspectedCategory || "General",
    redFlags: Array.isArray(p.redFlags) ? p.redFlags : [],
    reasoning: p.reasoning || "Triage assessment based on symptom analysis.",
    recommendEmergencyServices: !!p.recommendEmergencyServices,
  };
}

function heuristicTriage(symptoms: string): TriageResult {
  const s = symptoms.toLowerCase();
  const criticalKw = ["chest pain", "unconscious", "not breathing", "severe bleeding", "stroke", "heart attack", "cardiac arrest", "choking", "drowning", "anaphylaxis"];
  const highKw = ["severe", "vomiting blood", "broken bone", "high fever", "difficulty breathing", "fainting", "severe pain"];
  const mediumKw = ["fever", "pain", "nausea", "dizzy", "injury", "burn"];
  const isCritical = criticalKw.some((k) => s.includes(k));
  const isHigh = highKw.some((k) => s.includes(k));
  const isMedium = mediumKw.some((k) => s.includes(k));
  let urgency: Urgency = "Low";
  let category = "General";
  let redFlags: string[] = [];
  if (isCritical) {
    urgency = "Critical";
    category = "Cardiac/Respiratory";
    redFlags = ["Life-threatening symptoms detected", "Recommend immediate emergency services"];
  } else if (isHigh) {
    urgency = "High";
    category = "Acute";
    redFlags = ["Severe symptoms", "Recommend urgent medical attention"];
  } else if (isMedium) {
    urgency = "Medium";
    category = "Sub-acute";
  } else {
    urgency = "Low";
  }
  return {
    urgency,
    confidence: 0.6,
    suspectedCategory: category,
    redFlags,
    reasoning:
      "Triage heuristic applied (LLM unavailable). Recommended to seek professional evaluation.",
    recommendEmergencyServices: urgency === "Critical" || urgency === "High",
  };
}

// ===== Hospital Agent =====
// LLM-backed hospital selection with reasoning WHY this hospital was chosen.
// Falls back to a heuristic ranker when the LLM is unavailable.
export async function runHospitalAgent(opts: {
  symptoms: string;
  suspectedCategory?: string;
  hospitals?: Hospital[];
}): Promise<{ ranked: Hospital[]; reasons: string[]; matchScore: number }> {
  const list = opts.hospitals && opts.hospitals.length ? opts.hospitals : demoHospitals;
  const s = opts.symptoms.toLowerCase();
  const category = (opts.suspectedCategory || "").toLowerCase();

  const desiredSpecialty = (() => {
    if (category.includes("cardiac") || s.includes("chest")) return "Cardiology";
    if (category.includes("neuro") || s.includes("stroke")) return "Neurology";
    if (category.includes("trauma") || s.includes("broken") || s.includes("injury")) return "Trauma";
    if (category.includes("respiratory") || s.includes("breath")) return "Emergency";
    return "Emergency";
  })();

  // Try LLM first
  const hospitalJson = list.map((h) => ({
    id: h.id,
    name: h.name,
    area: h.area,
    distanceKm: h.distanceKm,
    rating: h.rating,
    emergencyCapability: h.emergencyCapability,
    icuAvailable: h.icuAvailable,
    openNow: h.openNow,
    specialties: h.specialties,
  }));
  const text = await chat({
    system: HOSPITAL_PROMPT,
    user: `Patient symptoms: "${opts.symptoms}"\nSuspected category: ${opts.suspectedCategory || "General"}\nDesired specialty: ${desiredSpecialty}\nCandidate hospitals (JSON):\n${JSON.stringify(hospitalJson, null, 2)}\nReturn JSON only.`,
  });
  const parsed = extractJson<{ hospitalId: string; matchScore: number; reasons: string[]; alternatives: { hospitalId: string; reason: string }[] }>(text);
  if (parsed?.hospitalId) {
    const top = list.find((h) => h.id === parsed.hospitalId);
    if (top) {
      const ranked = [top, ...list.filter((h) => h.id !== top.id)];
      // Heuristic score for suitability display
      const scored = ranked.map((h) => {
        let score = 0;
        score += Math.max(0, 10 - h.distanceKm);
        score += h.rating;
        score += h.emergencyCapability === "Level 3" ? 6 : h.emergencyCapability === "Level 2" ? 3 : 1;
        if (h.icuAvailable) score += 4;
        if (h.openNow) score += 2;
        if (h.specialties.some((sp) => sp.toLowerCase().includes(desiredSpecialty.toLowerCase())))
          score += 5;
        return { ...h, suitability: Math.round(score * 10) / 10, reasons: h.id === top.id ? parsed.reasons : [], matchScore: h.id === top.id ? parsed.matchScore : undefined };
      });
      return {
        ranked: scored,
        reasons: parsed.reasons,
        matchScore: parsed.matchScore,
      };
    }
  }
  // Heuristic fallback
  const ranked = list
    .map((h) => {
      let score = 0;
      score += Math.max(0, 10 - h.distanceKm);
      score += h.rating;
      score += h.emergencyCapability === "Level 3" ? 6 : h.emergencyCapability === "Level 2" ? 3 : 1;
      if (h.icuAvailable) score += 4;
      if (h.openNow) score += 2;
      if (h.specialties.some((sp) => sp.toLowerCase().includes(desiredSpecialty.toLowerCase())))
        score += 5;
      return { ...h, suitability: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => (b.suitability || 0) - (a.suitability || 0));
  const top = ranked[0];
  const reasons = [
    top.specialties.some((sp) => sp.toLowerCase().includes(desiredSpecialty.toLowerCase()))
      ? `${desiredSpecialty} specialist available`
      : "Emergency department available",
    top.icuAvailable ? "ICU available" : "ICU not available",
    `Only ${top.distanceKm} km away`,
    `${top.emergencyCapability} emergency capability`,
    `Rated ${top.rating} by patients`,
  ];
  top.reasons = reasons;
  top.matchScore = Math.min(1, (top.suitability || 0) / 25);
  return { ranked, reasons, matchScore: top.matchScore };
}

// Back-compat: synchronous wrapper used by the emergency/analyze route.
// Returns just the ranked list — reasoning is attached to each hospital.
export function runHospitalAgentSync(opts: {
  symptoms: string;
  suspectedCategory?: string;
  hospitals?: Hospital[];
}): Hospital[] {
  const list = opts.hospitals && opts.hospitals.length ? opts.hospitals : demoHospitals;
  const s = opts.symptoms.toLowerCase();
  const category = (opts.suspectedCategory || "").toLowerCase();
  const desiredSpecialty = (() => {
    if (category.includes("cardiac") || s.includes("chest")) return "Cardiology";
    if (category.includes("neuro") || s.includes("stroke")) return "Neurology";
    if (category.includes("trauma") || s.includes("broken") || s.includes("injury")) return "Trauma";
    if (category.includes("respiratory") || s.includes("breath")) return "Emergency";
    return "Emergency";
  })();

  return list
    .map((h) => {
      let score = 0;
      score += Math.max(0, 10 - h.distanceKm);
      score += h.rating;
      score += h.emergencyCapability === "Level 3" ? 6 : h.emergencyCapability === "Level 2" ? 3 : 1;
      if (h.icuAvailable) score += 4;
      if (h.openNow) score += 2;
      if (h.specialties.some((sp) => sp.toLowerCase().includes(desiredSpecialty.toLowerCase())))
        score += 5;
      const reasons: string[] = [
        h.specialties.some((sp) => sp.toLowerCase().includes(desiredSpecialty.toLowerCase()))
          ? `${desiredSpecialty} specialist available`
          : "Emergency department available",
        h.icuAvailable ? "ICU available" : "ICU not available",
        `${h.distanceKm} km away`,
        `${h.emergencyCapability} emergency capability`,
        `Rated ${h.rating}/5`,
      ];
      return {
        ...h,
        suitability: Math.round(score * 10) / 10,
        reasons,
        matchScore: Math.min(1, score / 25),
      };
    })
    .sort((a, b) => (b.suitability || 0) - (a.suitability || 0));
}

// ===== Capacity (Bed) Agent =====
// LLM-backed suitability estimate with reasoning WHY.
export async function runCapacityAgentAsync(hospital: Hospital): Promise<CapacityScore> {
  const factors = [
    { label: "Distance", weight: 0.25, value: Math.max(0, 1 - hospital.distanceKm / 10) },
    { label: "Emergency Capability", weight: 0.3, value: hospital.emergencyCapability === "Level 3" ? 1 : hospital.emergencyCapability === "Level 2" ? 0.7 : 0.4 },
    { label: "ICU Available", weight: 0.2, value: hospital.icuAvailable ? 1 : 0.3 },
    { label: "Open Now", weight: 0.1, value: hospital.openNow ? 1 : 0 },
    { label: "Rating", weight: 0.15, value: hospital.rating / 5 },
  ];
  const suitability = factors.reduce((sum, f) => sum + f.weight * f.value, 0);

  // Try LLM for a reasoning explanation
  const text = await chat({
    system: BED_PROMPT,
    user: `Hospital: ${JSON.stringify({ id: hospital.id, name: hospital.name, distanceKm: hospital.distanceKm, rating: hospital.rating, emergencyCapability: hospital.emergencyCapability, icuAvailable: hospital.icuAvailable }, null, 2)}\nComputed factors: ${JSON.stringify(factors, null, 2)}\nReturn JSON only.`,
  });
  const parsed = extractJson<{ hospitalId: string; suitability: number; factors: any[]; reasoning: string }>(text);
  if (parsed?.reasoning) {
    return {
      hospitalId: hospital.id,
      suitability: Math.round(suitability * 100) / 100,
      factors,
      reasoning: parsed.reasoning,
    };
  }
  return {
    hospitalId: hospital.id,
    suitability: Math.round(suitability * 100) / 100,
    factors,
    reasoning: `Suitability ${Math.round(suitability * 100)}% based on ${hospital.emergencyCapability} emergency capability, ${hospital.icuAvailable ? "ICU available" : "no ICU"}, ${hospital.distanceKm} km away, rated ${hospital.rating}/5. This is an estimate — not a live bed count.`,
  };
}

// Synchronous wrapper kept for backward compatibility with code that doesn't
// need the LLM reasoning (e.g. admin previews).
export function runCapacityAgent(hospital: Hospital): CapacityScore {
  const factors = [
    { label: "Distance", weight: 0.25, value: Math.max(0, 1 - hospital.distanceKm / 10) },
    { label: "Emergency Capability", weight: 0.3, value: hospital.emergencyCapability === "Level 3" ? 1 : hospital.emergencyCapability === "Level 2" ? 0.7 : 0.4 },
    { label: "ICU Available", weight: 0.2, value: hospital.icuAvailable ? 1 : 0.3 },
    { label: "Open Now", weight: 0.1, value: hospital.openNow ? 1 : 0 },
    { label: "Rating", weight: 0.15, value: hospital.rating / 5 },
  ];
  const suitability = factors.reduce((sum, f) => sum + f.weight * f.value, 0);
  return {
    hospitalId: hospital.id,
    suitability: Math.round(suitability * 100) / 100,
    factors,
    reasoning: `${hospital.emergencyCapability} emergency capability, ${hospital.icuAvailable ? "ICU available" : "no ICU"}, ${hospital.distanceKm} km away, rated ${hospital.rating}/5. Suitability estimate — not a live bed count.`,
  };
}

// ===== Specialist Agent =====
export function runSpecialistAgent(opts: {
  suspectedCategory?: string;
  symptoms?: string;
  specialists?: Specialist[];
}): Specialist {
  const list = opts.specialists && opts.specialists.length ? opts.specialists : demoSpecialists;
  const cat = (opts.suspectedCategory || "").toLowerCase();
  const symptoms = (opts.symptoms || "").toLowerCase();

  const desiredSpecialty = (() => {
    if (cat.includes("cardiac") || symptoms.includes("chest")) return "Cardiologist";
    if (cat.includes("neuro") || symptoms.includes("stroke") || symptoms.includes("seizure")) return "Neurologist";
    if (cat.includes("trauma") || symptoms.includes("broken") || symptoms.includes("injury")) return "Orthopedic";
    return "Emergency Physician";
  })();

  const match = list.find((s) => s.available && s.specialty === desiredSpecialty);
  if (match) return match;
  return list.find((s) => s.available) || list[0];
}

// ===== Ambulance Agent =====
// LLM-backed ambulance selection with reasoning WHY.
export async function runAmbulanceAgentAsync(opts: {
  urgency?: Urgency;
  ambulances?: Ambulance[];
}): Promise<{ ambulance: Ambulance; reasons: string[]; matchScore: number }> {
  const list = opts.ambulances && opts.ambulances.length ? opts.ambulances : demoAmbulances;
  const urgency = opts.urgency || "Medium";
  const available = list.filter((a) => a.status === "available");
  const candidates = available.length ? available : list;

  // Try LLM first
  const text = await chat({
    system: AMBULANCE_PROMPT,
    user: `Urgency: ${urgency}\nCandidate ambulances (JSON):\n${JSON.stringify(candidates.map((a) => ({ id: a.id, code: a.code, type: a.type, distanceKm: a.distanceKm, etaMinutes: a.etaMinutes, oxygen: a.oxygen, paramedic: a.paramedic, status: a.status })), null, 2)}\nReturn JSON only.`,
  });
  const parsed = extractJson<{ ambulanceId: string; matchScore: number; reasons: string[] }>(text);
  if (parsed?.ambulanceId) {
    const amb = list.find((a) => a.id === parsed.ambulanceId);
    if (amb) return { ambulance: { ...amb, reasons: parsed.reasons, matchScore: parsed.matchScore }, reasons: parsed.reasons, matchScore: parsed.matchScore };
  }
  // Heuristic fallback
  let selected: Ambulance;
  if (urgency === "Critical" || urgency === "High") {
    const als = [...candidates].filter((a) => a.type === "ALS" && a.paramedic).sort((a, b) => a.etaMinutes - b.etaMinutes);
    selected = als[0] || [...candidates].sort((a, b) => a.etaMinutes - b.etaMinutes)[0] || candidates[0];
  } else {
    selected = [...candidates].sort((a, b) => a.etaMinutes - b.etaMinutes)[0] || candidates[0];
  }
  const reasons = [
    urgency === "Critical" || urgency === "High" ? `${selected.type} preferred for ${urgency} case` : `${selected.type} ambulance`,
    `Only ${selected.etaMinutes} min ETA`,
    selected.paramedic ? "Paramedic onboard" : "No paramedic",
    selected.oxygen ? "Oxygen available" : "No oxygen",
    `${selected.distanceKm} km away`,
  ];
  return { ambulance: { ...selected, reasons, matchScore: 0.85 }, reasons, matchScore: 0.85 };
}

// Sync wrapper for backward compatibility
export function runAmbulanceAgent(opts: {
  urgency?: Urgency;
  ambulances?: Ambulance[];
}): Ambulance {
  const list = opts.ambulances && opts.ambulances.length ? opts.ambulances : demoAmbulances;
  const urgency = opts.urgency || "Medium";
  const available = list.filter((a) => a.status === "available");
  let selected: Ambulance;
  if (urgency === "Critical" || urgency === "High") {
    const als = available.filter((a) => a.type === "ALS" && a.paramedic).sort((a, b) => a.etaMinutes - b.etaMinutes);
    selected = als[0] || available.sort((a, b) => a.etaMinutes - b.etaMinutes)[0] || list[0];
  } else {
    selected = available.sort((a, b) => a.etaMinutes - b.etaMinutes)[0] || list[0];
  }
  selected.reasons = [
    urgency === "Critical" || urgency === "High" ? `${selected.type} preferred for ${urgency} case` : `${selected.type} ambulance`,
    `Only ${selected.etaMinutes} min ETA`,
    selected.paramedic ? "Paramedic onboard" : "No paramedic",
    selected.oxygen ? "Oxygen available" : "No oxygen",
    `${selected.distanceKm} km away`,
  ];
  selected.matchScore = 0.85;
  return selected;
}

// ===== Blood Agent =====
// LLM-backed blood matching with reasoning WHY.
export async function runBloodAgentAsync(opts: {
  bloodGroup?: string;
  bloodResources?: BloodResource[];
}): Promise<{ blood?: BloodResource; reasons: string[]; matchScore: number }> {
  if (!opts.bloodGroup) return { blood: undefined, reasons: ["Patient blood group not specified — no matching performed"], matchScore: 0 };
  const list = opts.bloodResources && opts.bloodResources.length ? opts.bloodResources : demoBloodResources;

  // Try LLM first
  const text = await chat({
    system: BLOOD_PROMPT,
    user: `Patient blood group: ${opts.bloodGroup}\nCandidate blood resources (JSON):\n${JSON.stringify(list.map((b) => ({ id: b.id, bank: b.bank, bloodGroup: b.bloodGroup, units: b.units, distanceKm: b.distanceKm, updatedAt: b.updatedAt })), null, 2)}\nReturn JSON only.`,
  });
  const parsed = extractJson<{ bloodResourceId: string; matchScore: number; reasons: string[] }>(text);
  if (parsed?.bloodResourceId) {
    const match = list.find((b) => b.id === parsed.bloodResourceId);
    if (match) return { blood: { ...match, reasons: parsed.reasons, matchScore: parsed.matchScore }, reasons: parsed.reasons, matchScore: parsed.matchScore };
  }
  // Heuristic fallback
  const exact = list.filter((b) => b.bloodGroup === opts.bloodGroup && b.units > 0).sort((a, b) => a.distanceKm - b.distanceKm);
  if (exact[0]) {
    const reasons = [
      `Exact ${opts.bloodGroup} match`,
      `${exact[0].units} units available`,
      `${exact[0].distanceKm} km away`,
      `Updated ${timeAgo(exact[0].updatedAt)}`,
    ];
    return { blood: { ...exact[0], reasons, matchScore: 0.95 }, reasons, matchScore: 0.95 };
  }
  const universal = list.filter((b) => b.bloodGroup === "O-" && b.units > 0).sort((a, b) => a.distanceKm - b.distanceKm);
  if (universal[0]) {
    const reasons = ["Universal O- donor matched", `${universal[0].units} units available`, `${universal[0].distanceKm} km away`];
    return { blood: { ...universal[0], reasons, matchScore: 0.8 }, reasons, matchScore: 0.8 };
  }
  return { blood: undefined, reasons: [`No ${opts.bloodGroup} or O- blood found within available resources`], matchScore: 0 };
}

// Sync wrapper
export function runBloodAgent(opts: {
  bloodGroup?: string;
  bloodResources?: BloodResource[];
}): BloodResource | undefined {
  if (!opts.bloodGroup) return undefined;
  const list = opts.bloodResources && opts.bloodResources.length ? opts.bloodResources : demoBloodResources;
  const exact = list
    .filter((b) => b.bloodGroup === opts.bloodGroup && b.units > 0)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  if (exact[0]) {
    exact[0].reasons = [`Exact ${opts.bloodGroup} match`, `${exact[0].units} units available`, `${exact[0].distanceKm} km away`];
    exact[0].matchScore = 0.95;
    return exact[0];
  }
  const universal = list
    .filter((b) => b.bloodGroup === "O-" && b.units > 0)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  if (universal[0]) {
    universal[0].reasons = ["Universal O- donor matched", `${universal[0].units} units available`, `${universal[0].distanceKm} km away`];
    universal[0].matchScore = 0.8;
    return universal[0];
  }
  return undefined;
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  } catch {
    return "recently";
  }
}

// ===== Document Agent (OCR-based, LLM-summarized) =====
export async function runDocumentAgent(
  ocrText: string,
  lang: Language = "en",
): Promise<DocumentSummary> {
  if (!ocrText || ocrText.trim().length < 10) {
    return emptyDocumentSummary("No text extracted from document.");
  }
  const langNote = languageNote(lang);
  const text = await chat({
    system: DOCUMENT_PROMPT,
    user: `Document text:\n"""\n${ocrText.slice(0, 4000)}\n""" ${langNote} Return JSON only.`,
  });
  const parsed = extractJson<DocumentSummary>(text);
  if (parsed && parsed.reportType) {
    return {
      reportType: parsed.reportType,
      findings: parsed.findings || [],
      patientHistory: parsed.patientHistory || [],
      medicines: parsed.medicines || [],
      allergies: parsed.allergies || [],
      risks: parsed.risks || [],
      importantFindings: parsed.importantFindings || "",
      rawSummary: ocrText.slice(0, 800),
    };
  }
  return heuristicDocumentSummary(ocrText);
}

function emptyDocumentSummary(msg: string): DocumentSummary {
  return {
    reportType: "Unknown",
    findings: [],
    patientHistory: [],
    medicines: [],
    allergies: [],
    risks: [],
    importantFindings: msg,
    rawSummary: msg,
  };
}

function heuristicDocumentSummary(text: string): DocumentSummary {
  const t = text.toLowerCase();
  const medicines = (t.match(/(?:tablet|capsule|syrup|injection)\s+([a-z\s]+)/gi) || []).slice(0, 5);
  const findings = text.split(/\n/).filter((l) => l.trim().length > 5).slice(0, 5);
  return {
    reportType: /ecg|ekg/.test(t) ? "ECG" : /lipid|cholesterol|blood/.test(t) ? "Blood Report" : /mri|ct|scan/.test(t) ? "Imaging" : "Medical Report",
    findings,
    patientHistory: [],
    medicines,
    allergies: [],
    risks: [],
    importantFindings: "Document processed via heuristic extractor (LLM unavailable).",
    rawSummary: text.slice(0, 800),
  };
}

// ===== Safety Guidance Agent =====
export async function runSafetyAgent(
  symptoms: string,
  urgency: Urgency,
  lang: Language = "en",
): Promise<SafetyGuidance> {
  const langNote = languageNote(lang);
  const text = await chat({
    system: SAFETY_PROMPT,
    user: `Symptoms: "${symptoms}". Urgency: ${urgency}. ${langNote} Return JSON only.`,
  });
  const parsed = extractJson<SafetyGuidance>(text);
  if (parsed && Array.isArray(parsed.doNow)) return parsed;
  return heuristicSafety(symptoms, urgency);
}

function heuristicSafety(symptoms: string, urgency: Urgency): SafetyGuidance {
  const s = symptoms.toLowerCase();
  const isCardiac = s.includes("chest") || s.includes("heart");
  return {
    doNow: isCardiac
      ? ["Sit down and stay calm", "Loosen tight clothing", "Chew aspirin if available and not allergic", "Note time symptoms began"]
      : ["Stay calm and breathe slowly", "Find a safe place to sit or lie down", "Loosen tight clothing", "Keep airway clear"],
    avoid: ["Do not panic", "Do not drive yourself in severe emergencies", "Do not ignore worsening symptoms", "Do not eat or drink if surgery may be needed"],
    whileWaiting: ["Keep your phone nearby and charged", "Unlock your front door", "Gather your medical reports", "Inform a family member or neighbor"],
    warningSigns: ["Loss of consciousness", "Severe difficulty breathing", "Chest pain spreading to arm/jaw", "Sudden weakness or slurred speech"],
  };
}

// ===== Coordinator Agent =====
export async function runCoordinator(opts: {
  symptoms: string;
  triage: TriageResult;
  hospital: Hospital;
  specialist: Specialist;
  ambulance: Ambulance;
  blood?: BloodResource;
  capacity?: CapacityScore;
  documentSummary?: DocumentSummary;
  safety: SafetyGuidance;
  lang?: Language;
}): Promise<{ medicalSummary: string; nextSteps: string[]; reasoning: string }> {
  const lang = opts.lang || "en";
  const langNote = languageNote(lang);
  const context = JSON.stringify(
    {
      symptoms: opts.symptoms,
      triage: opts.triage,
      hospital: {
        name: opts.hospital.name,
        distanceKm: opts.hospital.distanceKm,
        rating: opts.hospital.rating,
        emergencyCapability: opts.hospital.emergencyCapability,
        icuAvailable: opts.hospital.icuAvailable,
        reasons: opts.hospital.reasons,
      },
      capacity: opts.capacity && {
        suitability: opts.capacity.suitability,
        reasoning: opts.capacity.reasoning,
      },
      specialist: { name: opts.specialist.name, specialty: opts.specialist.specialty, available: opts.specialist.available },
      ambulance: {
        code: opts.ambulance.code,
        eta: opts.ambulance.etaMinutes,
        type: opts.ambulance.type,
        reasons: opts.ambulance.reasons,
      },
      blood: opts.blood
        ? { bank: opts.blood.bank, group: opts.blood.bloodGroup, units: opts.blood.units, reasons: opts.blood.reasons }
        : null,
      document: opts.documentSummary
        ? { reportType: opts.documentSummary.reportType, importantFindings: opts.documentSummary.importantFindings, findings: opts.documentSummary.findings.slice(0, 3) }
        : null,
      safety: opts.safety,
    },
    null,
    2,
  );
  const text = await chat({
    system: COORDINATOR_PROMPT,
    user: `Coordinate this emergency:\n${context}\n${langNote} Return JSON only.`,
  }, { maxTokens: 1200 });
  const parsed = extractJson<{ medicalSummary: string; nextSteps: string[]; reasoning: string }>(text);
  if (parsed && parsed.medicalSummary) return parsed;
  // Heuristic fallback coordinator
  const steps: string[] = [
    `Confirm ambulance ${opts.ambulance.code} (ETA ${opts.ambulance.etaMinutes} min)`,
    `Head to ${opts.hospital.name} — ${opts.hospital.distanceKm} km away`,
    `On arrival, ask for ${opts.specialist.name} (${opts.specialist.specialty})`,
  ];
  if (opts.blood) steps.push(`Reserve ${opts.blood.units} unit(s) of ${opts.blood.bloodGroup} at ${opts.blood.bank}`);
  steps.push("Share the plan with your family");
  steps.push("Keep emergency contact 112 / 15 ready if symptoms worsen");
  return {
    medicalSummary: `${opts.triage.urgency} urgency ${opts.triage.suspectedCategory.toLowerCase()} case. Recommended ${opts.hospital.name} (${opts.specialist.name}) with ambulance ${opts.ambulance.code} arriving in ~${opts.ambulance.etaMinutes} min.`,
    nextSteps: steps,
    reasoning:
      `Hospital ${opts.hospital.name} selected because: ${(opts.hospital.reasons || []).join(", ")}. ` +
      `Ambulance ${opts.ambulance.code} selected because: ${(opts.ambulance.reasons || []).join(", ")}. ` +
      (opts.blood ? `Blood ${opts.blood.bloodGroup} matched because: ${(opts.blood.reasons || []).join(", ")}. ` : "") +
      `Triage rated as ${opts.triage.urgency} (${(opts.triage.confidence * 100).toFixed(0)}% confidence). ` +
      `Human review required before dispatch.`,
  };
}
