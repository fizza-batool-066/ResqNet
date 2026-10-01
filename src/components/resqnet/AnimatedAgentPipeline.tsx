"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Brain, Stethoscope, BedDouble, Droplet, Truck, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STAGES = [
  { key: "triage",      icon: <Brain className="size-4" />,        status: "Analyzing symptoms…" },
  { key: "hospital",    icon: <Stethoscope className="size-4" />,  status: "Searching Hospital…" },
  { key: "bed",         icon: <BedDouble className="size-4" />,    status: "Checking Bed…" },
  { key: "blood",       icon: <Droplet className="size-4" />,      status: "Finding Blood…" },
  { key: "ambulance",   icon: <Truck className="size-4" />,        status: "Calling Ambulance…" },
  { key: "document",    icon: <FileText className="size-4" />,    status: "Reading Medical Reports…" },
  { key: "safety",      icon: <ShieldCheck className="size-4" />, status: "Compiling safety guidance…" },
  { key: "specialist",  icon: <Stethoscope className="size-4" />, status: "Selecting specialist…" },
  { key: "coordinator", icon: <Sparkles className="size-4" />,     status: "Coordinator Generating Plan…" },
] as const;

// Animated agent pipeline — lights up sequentially while the AI is analyzing.
// Shows the live status text per the spec: "Searching Hospital…",
// "Checking Bed…", "Finding Blood…", "Calling Ambulance…", etc.
export function AnimatedAgentPipeline({
  activeStage,
  completedStages,
}: {
  activeStage: number; // -1 when idle, STAGES.length when all done
  completedStages: number;
}) {
  const activeStageDef = activeStage >= 0 && activeStage < STAGES.length ? STAGES[activeStage] : null;
  const allDone = activeStage >= STAGES.length;
  return (
    <Card className="border-sky-100 bg-gradient-to-br from-sky-50 to-white">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center gap-2">
          {allDone ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <Loader2 className="size-4 animate-spin text-sky-600" />
          )}
          <h3 className="font-heading text-sm font-bold text-slate-900">
            {allDone
              ? "All agents complete — waiting for your approval"
              : activeStageDef
                ? activeStageDef.status
                : "AI agents are coordinating your emergency…"}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-9">
          {STAGES.map((s, i) => {
            const done = i < completedStages;
            const active = i === activeStage;
            return (
              <motion.div
                key={s.key}
                animate={{
                  scale: active ? 1.06 : 1,
                  opacity: done || active ? 1 : 0.55,
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors ${
                  done
                    ? "border-emerald-200 bg-emerald-50"
                    : active
                      ? "border-sky-300 bg-sky-100 ring-2 ring-sky-300"
                      : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className={done ? "text-emerald-600" : active ? "text-sky-700" : "text-slate-400"}>
                  {s.icon}
                </div>
                <div className="text-[10px] font-medium text-slate-600">
                  {prettyLabel(s.key)}
                </div>
                {done ? (
                  <Check className="size-3 text-emerald-600" />
                ) : active ? (
                  <Loader2 className="size-3 animate-spin text-sky-600" />
                ) : (
                  <span className="size-3" />
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function prettyLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

