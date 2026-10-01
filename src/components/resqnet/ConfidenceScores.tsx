"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Activity, Stethoscope, Truck, Droplet, BedDouble } from "lucide-react";
import type { EmergencyPlan } from "@/lib/types";

const urgencyColor: Record<string, string> = {
  Critical: "bg-red-500 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-500 text-white",
};

const confidenceItems = (plan: EmergencyPlan) => {
  const c = plan.confidence || {};
  return [
    { label: "Diagnosis Confidence", value: c.triage ?? plan.triage.confidence ?? 0, icon: <Brain className="size-3.5" />, color: "bg-sky-500" },
    { label: "Hospital Match", value: c.hospitalMatch ?? 0, icon: <Stethoscope className="size-3.5" />, color: "bg-violet-500" },
    { label: "Emergency Priority", value: c.triage ?? plan.triage.confidence ?? 0, icon: <Activity className="size-3.5" />, color: "bg-amber-500" },
    { label: "Ambulance Match", value: c.ambulanceMatch ?? 0, icon: <Truck className="size-3.5" />, color: "bg-red-500" },
    { label: "Blood Match", value: c.bloodMatch ?? 0, icon: <Droplet className="size-3.5" />, color: "bg-rose-500" },
    { label: "Bed Availability", value: c.bedAvailability ?? 0, icon: <BedDouble className="size-3.5" />, color: "bg-emerald-500" },
  ];
};

/**
 * ConfidenceScores — renders AI confidence per stage as animated progress
 * bars. Also displays the emergency priority as a colored badge.
 */
export function ConfidenceScores({ plan }: { plan: EmergencyPlan }) {
  const items = confidenceItems(plan);
  const overall = plan.confidence?.overall ?? 0;
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <TrendingUp className="size-4 text-sky-600" /> Confidence Scores
          </span>
          <span className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${urgencyColor[plan.triage.urgency] || urgencyColor.Medium}`}
            >
              {plan.triage.urgency}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {(overall * 100).toFixed(0)}% overall
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
        {items.map((it, i) => {
          const pct = Math.min(100, Math.max(0, it.value * 100));
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-slate-500">{it.icon}</span>
                  {it.label}
                </span>
                <span className="font-mono font-semibold text-slate-700">{pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                  className={`h-full rounded-full ${it.color}`}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** AgentReasoningPanel — displays per-agent reasoning ("Why this decision?")
 *  for every agent that contributed to the plan. */
export function AgentReasoningPanel({ plan }: { plan: EmergencyPlan }) {
  const ar = plan.agentReasoning || {};
  const cards = [
    { key: "Triage",         icon: <Brain className="size-3.5" />, color: "bg-amber-50 text-amber-700 border-amber-200", items: ar.triage },
    { key: "Hospital",       icon: <Stethoscope className="size-3.5" />, color: "bg-sky-50 text-sky-700 border-sky-200", items: ar.hospital },
    { key: "Bed / Capacity", icon: <BedDouble className="size-3.5" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200", items: ar.bed },
    { key: "Blood",          icon: <Droplet className="size-3.5" />, color: "bg-rose-50 text-rose-700 border-rose-200", items: ar.blood },
    { key: "Ambulance",      icon: <Truck className="size-3.5" />, color: "bg-orange-50 text-orange-700 border-orange-200", items: ar.ambulance },
    { key: "Document",       icon: <Activity className="size-3.5" />, color: "bg-violet-50 text-violet-700 border-violet-200", items: ar.document },
  ];
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="size-4 text-violet-600" /> Why these decisions?
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
        {cards.map((c) =>
          c.items && c.items.length > 0 ? (
            <div key={c.key} className={`rounded-xl border p-3 text-sm ${c.color}`}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
                {c.icon} {c.key}
              </div>
              <ul className="space-y-1">
                {c.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-current opacity-60" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </CardContent>
    </Card>
  );
}
