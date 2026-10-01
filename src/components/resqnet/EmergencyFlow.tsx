"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { useNotifications } from "@/hooks/use-notifications";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  Type,
  Mic,
  Upload,
  ArrowLeft,
  Loader2,
  Activity,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoiceAssistant } from "./VoiceAssistant";
import { DocumentUploader } from "./DocumentUploader";
import { EmergencyPlanView } from "./EmergencyPlan";
import { EmergencyTimelineSidebar } from "./EmergencyTimeline";
import { AnimatedAgentPipeline } from "./AnimatedAgentPipeline";
import { FamilyNotifyModal } from "./FamilyNotifyModal";
import { DisclaimerBanner } from "./Shared";
import { toast } from "sonner";
import type { EmergencyPlan as EmergencyPlanType } from "@/lib/types";

export function EmergencyFlow() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const bloodGroup = useAppStore((s) => s.bloodGroup);
  const activeEmergency = useAppStore((s) => s.activeEmergency);
  const setActiveEmergency = useAppStore((s) => s.setActiveEmergency);
  const emergencyStatus = useAppStore((s) => s.emergencyStatus);
  const setEmergencyStatus = useAppStore((s) => s.setEmergencyStatus);
  const emergencyInput = useAppStore((s) => s.emergencyInput);
  const { send: sendNotification } = useNotifications();
  const setEmergencyInput = useAppStore((s) => s.setEmergencyInput);
  const inputMethod = useAppStore((s) => s.inputMethod);
  const setInputMethod = useAppStore((s) => s.setInputMethod);
  const addActivity = useAppStore((s) => s.addActivity);

  const [loading, setLoading] = useState(false);
  const [documentText, setDocumentText] = useState<string>("");
  const [showShare, setShowShare] = useState(false);
  const [approving, setApproving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Animated agent stages
  const [activeStage, setActiveStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState(0);

  // If the user navigates back to the emergency view and already has an active
  // plan in memory, we show it instead of the input form.
  const showPlan =
    activeEmergency &&
    (emergencyStatus === "plan_ready" || emergencyStatus === "confirmed");

  const startAnalysis = async () => {
    if (!emergencyInput || emergencyInput.trim().length < 3) {
      toast.error("Please describe your symptoms first.");
      return;
    }
    setLoading(true);
    setEmergencyStatus("analyzing");
    setActiveEmergency(null);
    sendNotification({
      type: "emergency",
      title: "Emergency analysis started",
      message: `Symptoms received: "${emergencyInput.slice(0, 60)}${emergencyInput.length > 60 ? "…" : ""}"`,
      level: "warning",
    });

    // Animate agent stages — 9 stages × ~300ms ≈ 2.7s of feedback
    setCompletedStages(0);
    const stageTick = setInterval(() => {
      setActiveStage((p) => {
        const n = p + 1;
        if (n > 9) {
          clearInterval(stageTick);
          return p;
        }
        setCompletedStages(n);
        return n;
      });
    }, 280);

    try {
      const res = await fetch("/api/emergency/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: emergencyInput,
          language,
          bloodGroup,
          documentText: documentText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.plan) {
        throw new Error(data.error || "Analysis failed");
      }
      const plan = data.plan as EmergencyPlanType;
      // Give the animation a beat to finish before swapping in the plan
      setTimeout(() => {
        clearInterval(stageTick);
        setCompletedStages(9);
        setActiveStage(9);
        setActiveEmergency(plan);
        setEmergencyStatus("plan_ready");
        sendNotification({
          type: "ai",
          title: `Emergency Plan Ready · ${plan.triage.urgency}`,
          message: `Hospital: ${plan.recommendedHospital.name} · Ambulance: ${plan.recommendedAmbulance.code} (ETA ${plan.recommendedAmbulance.etaMinutes} min) · Specialist: ${plan.recommendedSpecialist.name}`,
          level: plan.triage.urgency === "Critical" ? "error" : plan.triage.urgency === "High" ? "warning" : "success",
        });
        addActivity({
          id: `a-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "emergency",
          message: `Emergency plan generated — ${plan.triage.urgency} urgency, ${plan.recommendedHospital.name}`,
        });
        setLoading(false);
      }, 600);
    } catch (err: any) {
      clearInterval(stageTick);
      setLoading(false);
      setEmergencyStatus("idle");
      setActiveStage(-1);
      setCompletedStages(0);
      toast.error(err.message || "Could not analyze emergency.");
    }
  };

  const onConfirm = () => {
    if (!activeEmergency) return;
    setApproving(true);
    // Brief delay to animate the "Dispatching…" state on the approve button
    setTimeout(() => {
      const updated = { ...activeEmergency, status: "dispatched" as const };
      setActiveEmergency(updated);
      setEmergencyStatus("confirmed");
      setApproving(false);
      toast.success("Plan approved & dispatched. Help is on the way.");
      sendNotification({
        type: "ambulance",
        title: "Ambulance dispatched",
        message: `${activeEmergency.recommendedAmbulance.code} (${activeEmergency.recommendedAmbulance.type}) en route — ETA ${activeEmergency.recommendedAmbulance.etaMinutes} min`,
        level: "warning",
      });
      addActivity({
        id: `a-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "emergency",
        message: `Plan approved — ambulance dispatched (${activeEmergency.recommendedAmbulance.code})`,
      });
    }, 900);
  };

  const onReject = () => {
    setActiveEmergency(null);
    setEmergencyStatus("idle");
    setEmergencyInput("");
    setDocumentText("");
    setActiveStage(-1);
    setCompletedStages(0);
    toast.info("Plan rejected. Re-analyze with updated symptoms or upload a report.");
  };

  const onNewEmergency = () => {
    setActiveEmergency(null);
    setEmergencyStatus("idle");
    setEmergencyInput("");
    setDocumentText("");
    setInputMethod("text");
    setActiveStage(-1);
    setCompletedStages(0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Top banner */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("dashboard")}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="btn-ripple flex items-center gap-2 rounded-xl grad-emergency px-4 py-2 text-white shadow-glow-red"
            >
              <Siren className="size-5" />
              <span className="font-heading font-bold">{t("em.active")}</span>
              <span className="size-2 animate-pulse rounded-full bg-white" />
            </motion.div>
            <DisclaimerBanner compact />
          </div>
          {showPlan && (
            <Button variant="outline" onClick={onNewEmergency}>
              New emergency
            </Button>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {showPlan ? (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <EmergencyPlanView
                    plan={activeEmergency!}
                    onConfirm={onConfirm}
                    onShare={() => setShowShare(true)}
                    onReject={onReject}
                    approving={approving}
                  />
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl glass-card p-5 shadow-md-soft">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid size-12 place-items-center rounded-xl bg-sky-50 text-sky-600 shadow-soft">
                        <Loader2 className="size-6 animate-spin" />
                      </div>
                      <div>
                        <h2 className="font-heading text-lg font-bold text-slate-900">
                          {t("em.analyzing")}
                        </h2>
                        <p className="text-sm text-slate-500">
                          Triage → Hospital → Specialist → Ambulance → Blood → Capacity → Document → Safety → Coordinator
                        </p>
                      </div>
                    </div>
                    <AnimatedAgentPipeline
                      activeStage={activeStage}
                      completedStages={completedStages}
                    />
                  </div>
                  <div className="rounded-2xl glass-card p-5 shadow-md-soft">
                    <div className="space-y-3">
                      {["Triage assessing urgency…", "Finding best-matched hospital…", "Selecting specialist…", "Matching ambulance & ETA…", "Checking blood availability…", "Scoring hospital capacity…", "Summarizing medical document…", "Generating safety guidance…", "Coordinator synthesizing plan…"].map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: i < completedStages ? 1 : 0.4 }}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          {i < completedStages ? (
                            <Loader2 className="size-4 text-emerald-600" />
                          ) : (
                            <span className="size-4 rounded-full border-2 border-slate-200" />
                          )}
                          {m}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl glass-card p-5 shadow-md-soft"
                >
                  <h2 className="mb-1 font-heading text-lg font-bold text-slate-900">
                    Describe your emergency
                  </h2>
                  <p className="mb-4 text-sm text-slate-500">
                    Type, speak, or upload a medical report. The AI coordinator will run
                    9 agents in parallel and prepare a structured emergency plan.
                  </p>

                  <Tabs
                    value={inputMethod}
                    onValueChange={(v) => setInputMethod(v as any)}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="text" className="gap-1.5">
                        <Type className="size-4" /> {t("em.typeSymptoms")}
                      </TabsTrigger>
                      <TabsTrigger value="voice" className="gap-1.5">
                        <Mic className="size-4" /> {t("em.speak")}
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="gap-1.5">
                        <Upload className="size-4" /> {t("em.uploadReport")}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="pt-4">
                      <Textarea
                        value={emergencyInput}
                        onChange={(e) => setEmergencyInput(e.target.value)}
                        placeholder={t("em.symptomsPlaceholder")}
                        rows={6}
                        className="text-base"
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {["Severe chest pain and shortness of breath", "My mother fainted, sweating and dizzy", "Pain in right arm after a fall"].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setEmergencyInput(q)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="voice" className="pt-4">
                      <VoiceAssistant
                        onTranscribed={(text) => {
                          setEmergencyInput((prev) => (prev ? prev + " " + text : text));
                          setInputMethod("text");
                          toast.success("Transcribed — review and start analysis.");
                        }}
                      />
                      {emergencyInput && (
                        <Textarea
                          value={emergencyInput}
                          onChange={(e) => setEmergencyInput(e.target.value)}
                          rows={4}
                          className="mt-4"
                          placeholder="Transcribed text appears here"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="upload" className="pt-4">
                      <DocumentUploader
                        onSummary={(text) => {
                          setDocumentText(text);
                          if (text) {
                            setEmergencyInput(
                              `Uploaded document. Extracted text:\n${text.slice(0, 600)}…`,
                            );
                            toast.success("Document read — review extracted text and start analysis.");
                          }
                        }}
                      />
                      {emergencyInput && (
                        <Textarea
                          value={emergencyInput}
                          onChange={(e) => setEmergencyInput(e.target.value)}
                          rows={4}
                          className="mt-4"
                          placeholder="Extracted text appears here"
                        />
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">
                      Signed in as <span className="font-medium text-slate-700">{user?.email}</span> · Blood group {bloodGroup}
                    </div>
                    <Button
                      size="lg"
                      onClick={startAnalysis}
                      disabled={loading || !emergencyInput}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                      {t("em.startAnalysis")}
                    </Button>
                  </div>

                  <DisclaimerBanner />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar — emergency timeline */}
          <aside className="space-y-4">
            <EmergencyTimelineSidebar current={currentStageNumber(emergencyStatus, showPlan, loading)} />
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700">
                <Phone className="size-4" /> Emergency Hotline
              </h3>
              <div className="flex flex-col gap-1.5 text-sm">
                <a href="tel:112" className="flex items-center justify-between rounded-lg bg-white px-3 py-2 hover:bg-red-50">
                  <span className="font-medium text-slate-700">112 (Rescue)</span>
                  <span className="text-xs text-red-600">Call now</span>
                </a>
                <a href="tel:15" className="flex items-center justify-between rounded-lg bg-white px-3 py-2 hover:bg-red-50">
                  <span className="font-medium text-slate-700">15 (Police)</span>
                  <span className="text-xs text-red-600">Call now</span>
                </a>
                <a href="tel:115" className="flex items-center justify-between rounded-lg bg-white px-3 py-2 hover:bg-red-50">
                  <span className="font-medium text-slate-700">115 (Edhi)</span>
                  <span className="text-xs text-red-600">Call now</span>
                </a>
              </div>
              <p className="mt-2 text-[11px] text-red-700/80">
                For life-threatening emergencies, call these numbers first.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <FamilyNotifyModal
        open={showShare}
        onOpenChange={setShowShare}
        planId={activeEmergency?.requestId}
      />
    </div>
  );
}

function currentStageNumber(
  status: string,
  showPlan: boolean,
  loading: boolean,
): number {
  if (status === "confirmed") return 7;
  if (showPlan) return 6;
  if (loading) return 2;
  return 1;
}
