"use client";

import { useT } from "@/hooks/use-t";
import { motion } from "framer-motion";
import {
  MessageSquareWarning,
  Stethoscope,
  Network,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";

export function HowItWorks() {
  const t = useT();
  const steps = [
    { icon: MessageSquareWarning, title: t("how.step1.title"), desc: t("how.step1.desc"), color: "#dc2626" },
    { icon: Stethoscope, title: t("how.step2.title"), desc: t("how.step2.desc"), color: "#f59e0b" },
    { icon: Network, title: t("how.step3.title"), desc: t("how.step3.desc"), color: "#1e6fdc" },
    { icon: ClipboardCheck, title: t("how.step4.title"), desc: t("how.step4.desc"), color: "#16a34a" },
    { icon: UserCheck, title: t("how.step5.title"), desc: t("how.step5.desc"), color: "#7c3aed" },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {t("how.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">{t("how.subtitle")}</p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="relative flex flex-col gap-3 rounded-2xl glass-card p-5 shadow-md-soft transition-shadow hover:shadow-lg-soft"
          >
            <div className="flex items-center justify-between">
              <div
                className="grid size-11 place-items-center rounded-xl"
                style={{ background: s.color + "1A", color: s.color }}
              >
                <s.icon className="size-5" />
              </div>
              <span className="font-heading text-3xl font-extrabold text-slate-100">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900">{s.title}</h3>
            <p className="text-sm text-slate-600">{s.desc}</p>
            {i < steps.length - 1 && (
              <div
                className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-200 lg:block"
                aria-hidden
              >
                →
              </div>
            )}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
