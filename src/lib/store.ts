"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  View,
  Language,
  User,
  EmergencyPlan,
  EmergencyContact,
  MedicalReport,
  ActivityLog,
} from "./types";
import { demoContacts, demoReports, demoProfile, demoActivity } from "./demo-data";

interface AppState {
  view: View;
  language: Language;
  user: User | null;
  token: string | null;

  // emergency flow state
  activeEmergency: EmergencyPlan | null;
  emergencyStatus: "idle" | "analyzing" | "plan_ready" | "confirmed";
  emergencyInput: string;
  inputMethod: "text" | "voice" | "upload";

  // profile state
  contacts: EmergencyContact[];
  reports: MedicalReport[];
  activities: ActivityLog[];
  bloodGroup: string;
  allergies: string[];
  medicines: string[];
  conditions: string[];

  // ui state
  authMode: "login" | "signup" | "forgot" | "otp";
  pendingEmail: string;

  setView: (v: View) => void;
  setLanguage: (l: Language) => void;
  setUser: (u: User | null, token?: string | null) => void;
  logout: () => void;

  setActiveEmergency: (p: EmergencyPlan | null) => void;
  setEmergencyStatus: (s: AppState["emergencyStatus"]) => void;
  setEmergencyInput: (s: string) => void;
  setInputMethod: (m: "text" | "voice" | "upload") => void;

  setContacts: (c: EmergencyContact[]) => void;
  addContact: (c: EmergencyContact) => void;
  removeContact: (id: string) => void;

  addReport: (r: MedicalReport) => void;
  setReports: (r: MedicalReport[]) => void;
  removeReport: (id: string) => void;

  setBloodGroup: (b: string) => void;
  setAllergies: (a: string[]) => void;
  setMedicines: (m: string[]) => void;
  setConditions: (c: string[]) => void;

  addActivity: (a: ActivityLog) => void;

  setAuthMode: (m: AppState["authMode"]) => void;
  setPendingEmail: (e: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "landing",
      language: "en",
      user: null,
      token: null,

      activeEmergency: null,
      emergencyStatus: "idle",
      emergencyInput: "",
      inputMethod: "text",

      contacts: demoContacts,
      reports: demoReports,
      activities: demoActivity,
      bloodGroup: demoProfile.bloodGroup || "O+",
      allergies: demoProfile.allergies,
      medicines: demoProfile.medicines,
      conditions: demoProfile.conditions,

      authMode: "login",
      pendingEmail: "",

      setView: (v) => set({ view: v }),
      setLanguage: (l) => set({ language: l }),
      setUser: (u, token) =>
        set({ user: u, token: token === undefined ? null : token }),
      logout: () =>
        set({
          user: null,
          token: null,
          view: "landing",
          activeEmergency: null,
          emergencyStatus: "idle",
        }),

      setActiveEmergency: (p) => set({ activeEmergency: p }),
      setEmergencyStatus: (s) => set({ emergencyStatus: s }),
      setEmergencyInput: (s) => set({ emergencyInput: s }),
      setInputMethod: (m) => set({ inputMethod: m }),

      setContacts: (c) => set({ contacts: c }),
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, c] })),
      removeContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((x) => x.id !== id) })),

      addReport: (r) => set((s) => ({ reports: [r, ...s.reports] })),
      setReports: (r: MedicalReport[]) => set({ reports: r }),
      removeReport: (id) =>
        set((s) => ({ reports: s.reports.filter((x) => x.id !== id) })),

      setBloodGroup: (b) => set({ bloodGroup: b }),
      setAllergies: (a) => set({ allergies: a }),
      setMedicines: (m) => set({ medicines: m }),
      setConditions: (c) => set({ conditions: c }),

      addActivity: (a) =>
        set((s) => ({ activities: [a, ...s.activities].slice(0, 30) })),

      setAuthMode: (m) => set({ authMode: m }),
      setPendingEmail: (e) => set({ pendingEmail: e }),
    }),
    {
      name: "resqnet-store",
      partialize: (s) => ({
        language: s.language,
        user: s.user,
        token: s.token,
        contacts: s.contacts,
        reports: s.reports,
        activities: s.activities,
        bloodGroup: s.bloodGroup,
        allergies: s.allergies,
        medicines: s.medicines,
        conditions: s.conditions,
      }),
    },
  ),
);
