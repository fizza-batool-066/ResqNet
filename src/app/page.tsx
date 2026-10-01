"use client";

import { useAppStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/resqnet/Navbar";
import { Footer } from "@/components/resqnet/Footer";
import { LandingHero } from "@/components/resqnet/LandingHero";
import { StatsCards } from "@/components/resqnet/StatsCards";
import { HowItWorks } from "@/components/resqnet/HowItWorks";
import { Features } from "@/components/resqnet/Features";
import { EmergencyTimeline } from "@/components/resqnet/EmergencyTimeline";
import { AuthScreen } from "@/components/resqnet/AuthScreen";
import { Dashboard } from "@/components/resqnet/Dashboard";
import { EmergencyFlow } from "@/components/resqnet/EmergencyFlow";
import { MedicalHistory } from "@/components/resqnet/MedicalHistory";
import { AdminPanel } from "@/components/resqnet/AdminPanel";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const user = useAppStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col"
          >
            <Navbar />
            <main className="flex-1">
              <LandingHero />
              <StatsCards />
              <HowItWorks />
              <Features />
              <EmergencyTimeline />
            </main>
            <Footer />
          </motion.div>
        )}

        {view === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col"
          >
            <AuthScreen />
          </motion.div>
        )}

        {view === "dashboard" && user && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col"
          >
            <Navbar />
            <main className="flex-1">
              <Dashboard />
            </main>
            <Footer />
          </motion.div>
        )}

        {view === "dashboard" && !user && (
          <motion.div
            key="no-auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-screen flex-col"
          >
            <AuthScreen />
          </motion.div>
        )}

        {view === "emergency" && (
          <motion.div
            key="emergency"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col"
          >
            <main className="flex-1">
              <EmergencyFlow />
            </main>
          </motion.div>
        )}

        {view === "history" && user && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col"
          >
            <Navbar />
            <main className="flex-1">
              <MedicalHistory />
            </main>
            <Footer />
          </motion.div>
        )}

        {view === "history" && !user && (
          <motion.div
            key="no-auth-history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-screen flex-col"
          >
            <AuthScreen />
          </motion.div>
        )}

        {view === "admin" && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col"
          >
            <Navbar />
            <main className="flex-1">
              <AdminPanel />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
