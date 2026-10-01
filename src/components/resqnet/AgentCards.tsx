"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Stethoscope,
  BedDouble,
  Droplet,
  Truck,
  FileText,
  Sparkles,
} from "lucide-react";

/**
 * Renders the 7 ResQNet AI agents as a grid of cards. Used on the dashboard
 * to give the user an overview of which agents will engage when an emergency
 * is started.
 */
const AGENTS = [
  { key: "triage",     name: "Triage Agent",     icon: <Brain className="size-5" />,        color: "bg-amber-50 text-amber-700 border-amber-200",   desc: "Analyzes symptoms, predicts urgency" },
  { key: "hospital",  name: "Hospital Agent",   icon: <Stethoscope className="size-5" />,  color: "bg-sky-50 text-sky-700 border-sky-200",       desc: "Finds the best hospital by specialty, distance, ICU" },
  { key: "bed",       name: "Bed Agent",         icon: <BedDouble className="size-5" />,    color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Estimates bed capacity suitability" },
  { key: "blood",     name: "Blood Agent",       icon: <Droplet className="size-5" />,      color: "bg-rose-50 text-rose-700 border-rose-200",     desc: "Matches blood group, finds donors" },
  { key: "ambulance", name: "Ambulance Agent",    icon: <Truck className="size-5" />,        color: "bg-orange-50 text-orange-700 border-orange-200", desc: "Selects ALS/BLS, computes ETA" },
  { key: "document",  name: "Document Agent",    icon: <FileText className="size-5" />,    color: "bg-violet-50 text-violet-700 border-violet-200", desc: "OCR + summarises prescriptions, lab reports" },
  { key: "coordinator", name: "Coordinator Agent", icon: <Sparkles className="size-5" />,  color: "bg-slate-50 text-slate-700 border-slate-200",  desc: "Orchestrates every agent, builds the final plan" },
] as const;

export function AgentCards() {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-slate-900">AI Multi-Agent Architecture</h3>
          <span className="text-[11px] text-slate-400">7 agents · orchestrated by Coordinator</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {AGENTS.map((a, i) => (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className={`rounded-xl border p-3 ${a.color}`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="grid size-8 place-items-center rounded-lg bg-white shadow-sm">{a.icon}</span>
                <motion.span
                  className="size-1.5 rounded-full bg-current opacity-60"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              </div>
              <div className="text-xs font-bold">{a.name}</div>
              <div className="mt-0.5 text-[10px] leading-snug opacity-80">{a.desc}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
