"use client";

import { motion } from "framer-motion";
import { AlertOctagon, Brain, Stethoscope, BedDouble, Droplet, Truck, ClipboardCheck, ScanLine, FileText, UserCheck } from "lucide-react";
import { useT } from "@/hooks/use-t";

// Timeline shown in the emergency flow sidebar — tracks live progress.
// Seven steps matching the ResQNet spec exactly:
//   1. Emergency Detected
//   2. Triage Completed
//   3. Hospital Selected
//   4. Bed Available
//   5. Blood Found
//   6. Ambulance Assigned
//   7. Final Emergency Plan
export const EMERGENCY_STAGES = [
  { key: "detected",  label: "Emergency Detected",     icon: AlertOctagon,  color: "#dc2626" },
  { key: "triage",    label: "Triage Completed",       icon: Brain,         color: "#f59e0b" },
  { key: "hospital",  label: "Hospital Selected",      icon: Stethoscope,   color: "#1e6fdc" },
  { key: "bed",       label: "Bed Available",           icon: BedDouble,     color: "#10b981" },
  { key: "blood",     label: "Blood Found",             icon: Droplet,       color: "#e11d48" },
  { key: "ambulance", label: "Ambulance Assigned",      icon: Truck,         color: "#7c3aed" },
  { key: "plan",      label: "Final Emergency Plan",    icon: ClipboardCheck, color: "#0891b2" },
];

export function EmergencyTimelineSidebar({ current }: { current: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-heading text-sm font-bold text-slate-900">
        Emergency Timeline
      </h3>
      <ol className="space-y-3">
        {EMERGENCY_STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = s.icon;
          return (
            <li key={s.key} className="flex items-start gap-3">
              <motion.div
                animate={{
                  scale: active ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 1, repeat: active ? Infinity : 0 }}
                className={`grid size-9 shrink-0 place-items-center rounded-full border-2 ${
                  done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : active
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
                style={active || done ? { color: s.color, borderColor: s.color + "80", background: s.color + "10" } : {}}
              >
                <Icon className="size-4" />
              </motion.div>
              <div className="pt-1">
                <div
                  className={`text-sm font-medium ${
                    done ? "text-slate-500 line-through" : active ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  <span className="mr-1.5 font-mono text-[10px] text-slate-400">{i + 1}.</span>
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-400">
                  {done ? "completed" : active ? "in progress" : "pending"}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Landing "Emergency Journey" timeline section — same 7 steps.
export function EmergencyTimeline() {
  const t = useT();
  const stages = [
    { icon: AlertOctagon,    label: "Emergency Detected",     color: "#dc2626", time: "00:00" },
    { icon: Brain,           label: "Triage Completed",       color: "#f59e0b", time: "00:04" },
    { icon: Stethoscope,     label: "Hospital Selected",      color: "#1e6fdc", time: "00:08" },
    { icon: BedDouble,       label: "Bed Available",           color: "#10b981", time: "00:12" },
    { icon: Droplet,         label: "Blood Found",             color: "#e11d48", time: "00:16" },
    { icon: Truck,           label: "Ambulance Assigned",      color: "#7c3aed", time: "00:20" },
    { icon: ClipboardCheck,  label: "Final Emergency Plan",   color: "#0891b2", time: "00:24" },
  ];
  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {t("journey.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          {t("journey.subtitle")}
        </p>
      </div>
      <div className="relative mx-auto max-w-3xl">
        <div className="absolute left-6 top-0 h-full w-0.5 bg-slate-100 sm:left-1/2 sm:-translate-x-1/2" />
        <ul className="space-y-6">
          {stages.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex items-start gap-4 ${i % 2 === 1 ? "sm:flex-row-reverse sm:text-right" : ""}`}
            >
              <div className="z-10 flex w-12 shrink-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:translate-y-1">
                <div
                  className="grid size-12 place-items-center rounded-full border-2 border-white shadow-md"
                  style={{ background: s.color + "1A", color: s.color }}
                >
                  <s.icon className="size-5" />
                </div>
              </div>
              <div className={`flex-1 sm:w-1/2 ${i % 2 === 0 ? "sm:pr-16" : "sm:pl-16"}`}>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400">{s.time}</div>
                  <div className="font-heading text-sm font-bold text-slate-900">
                    <span className="mr-1.5 font-mono text-[10px] text-slate-400">Step {i + 1}</span>
                    {s.label}
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

void ScanLine; void FileText; void UserCheck;

