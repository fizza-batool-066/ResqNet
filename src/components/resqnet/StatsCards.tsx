"use client";

import { useT } from "@/hooks/use-t";
import { motion } from "framer-motion";
import { Hospital, Truck, Droplet, Siren, Activity, Clock } from "lucide-react";

export function StatsCards() {
  const t = useT();
  const stats = [
    { icon: Hospital, value: "8+", label: t("stats.hospitals"), color: "#1e6fdc", suffix: "" },
    { icon: Truck, value: "4+", label: t("stats.ambulances"), color: "#dc2626", suffix: "" },
    { icon: Droplet, value: "52", label: t("stats.blood"), color: "#e11d48", suffix: "" },
    { icon: Siren, value: "1,284", label: t("stats.emergencies"), color: "#f59e0b", suffix: "" },
    { icon: Activity, value: "4.6", label: t("stats.responseTime"), color: "#16a34a", suffix: " min" },
    { icon: Clock, value: "24/7", label: "Always On", color: "#7c3aed", suffix: "" },
  ];
  return (
    <section id="stats" className="mx-auto -mt-8 max-w-7xl px-4 sm:px-6">
      <div className="glass-card grid grid-cols-2 gap-3 rounded-2xl p-4 shadow-md-soft sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            className="flex flex-col items-center gap-2 text-center transition-transform"
          >
            <div
              className="grid size-12 place-items-center rounded-xl shadow-soft"
              style={{ background: s.color + "1A", color: s.color }}
            >
              <s.icon className="size-6" />
            </div>
            <div className="font-heading text-2xl font-extrabold text-slate-900">
              {s.value}
              <span className="text-sm text-slate-400">{s.suffix}</span>
            </div>
            <div className="text-xs font-medium text-slate-500">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
