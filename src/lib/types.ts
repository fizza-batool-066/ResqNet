// ResQNet shared types

export type Language = "en" | "ur" | "rur";

export type View =
  | "landing"
  | "auth"
  | "dashboard"
  | "emergency"
  | "history"
  | "admin";

export type UserRole = "user" | "admin";

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  avatarColor?: string;
}

export interface UserProfile {
  userId: string;
  bloodGroup?: string;
  age?: number;
  gender?: string;
  allergies: string[];
  medicines: string[];
  conditions: string[];
  emergencyContacts: EmergencyContact[];
  reports: MedicalReport[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface MedicalReport {
  id: string;
  name: string;
  type: "prescription" | "lab" | "mri" | "blood" | "history" | "other";
  uploadedAt: string;
  summary?: string;
  fileName?: string;
}

export interface Hospital {
  id: string;
  name: string;
  area: string;
  city: string;
  distanceKm: number;
  rating: number;
  openNow: boolean;
  emergencyCapability: "Level 1" | "Level 2" | "Level 3";
  icuAvailable: boolean;
  specialties: string[];
  phone: string;
  suitability?: number;
  /** Reasons explaining WHY this hospital was selected — populated by the
   *  Hospital Agent (LLM-backed when Groq is reachable, heuristic otherwise). */
  reasons?: string[];
  /** LLM confidence in this hospital match (0..1). */
  matchScore?: number;
}

export interface Specialist {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  experience: number;
  available: boolean;
  phone: string;
}

export interface Ambulance {
  id: string;
  code: string;
  type: "ALS" | "BLS";
  distanceKm: number;
  etaMinutes: number;
  oxygen: boolean;
  paramedic: boolean;
  status: "available" | "dispatched" | "enroute";
  driverName: string;
  phone: string;
  /** Reasons explaining WHY this ambulance was selected. */
  reasons?: string[];
  matchScore?: number;
}

export interface BloodResource {
  id: string;
  bank: string;
  bloodGroup: string;
  units: number;
  distanceKm: number;
  updatedAt: string;
  phone: string;
  /** Reasons explaining WHY this blood resource was matched (or null). */
  reasons?: string[];
  matchScore?: number;
}

export type Urgency = "Critical" | "High" | "Medium" | "Low";

export interface TriageResult {
  urgency: Urgency;
  confidence: number;
  suspectedCategory: string;
  redFlags: string[];
  reasoning: string;
  recommendEmergencyServices: boolean;
}

export interface CapacityScore {
  hospitalId: string;
  suitability: number;
  factors: { label: string; weight: number; value: number }[];
  /** Human-readable explanation of WHY this capacity score was assigned. */
  reasoning?: string;
}

export interface DocumentSummary {
  reportType: string;
  findings: string[];
  patientHistory: string[];
  medicines: string[];
  allergies: string[];
  risks: string[];
  importantFindings: string;
  rawSummary: string;
}

export interface SafetyGuidance {
  doNow: string[];
  avoid: string[];
  whileWaiting: string[];
  warningSigns: string[];
}

export interface EmergencyPlan {
  requestId: string;
  createdAt: string;
  symptoms: string;
  triage: TriageResult;
  recommendedHospital: Hospital;
  alternativeHospitals: Hospital[];
  recommendedSpecialist: Specialist;
  recommendedAmbulance: Ambulance;
  bloodMatch?: BloodResource;
  capacity: CapacityScore;
  documentSummary?: DocumentSummary;
  safety: SafetyGuidance;
  medicalSummary: string;
  nextSteps: string[];
  reasoning: string;
  status: "draft" | "confirmed" | "dispatched" | "completed";
  /** Per-agent reasoning summaries shown in the UI as "Why this decision?". */
  agentReasoning?: {
    triage?: string[];
    hospital?: string[];
    bed?: string[];
    blood?: string[];
    ambulance?: string[];
    document?: string[];
    specialist?: string[];
    coordinator?: string;
  };
  /** Confidence scores per stage (0..1) — rendered as progress bars. */
  confidence?: {
    triage?: number;
    hospitalMatch?: number;
    ambulanceMatch?: number;
    bloodMatch?: number;
    bedAvailability?: number;
    overall?: number;
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "emergency" | "report" | "contact" | "auth" | "ai";
  message: string;
}

export interface EmergencyRequest {
  id: string;
  userId: string;
  symptoms: string;
  inputMethod: "text" | "voice" | "upload";
  createdAt: string;
  status: "analyzing" | "plan_ready" | "confirmed" | "completed";
  plan?: EmergencyPlan;
}
