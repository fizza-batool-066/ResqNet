"use client";

import { useT } from "@/hooks/use-t";
import { motion } from "framer-motion";
import {
  Bot,
  Mic,
  ScanLine,
  Radio,
  Users,
  Languages,
} from "lucide-react";

export function Features() {
  const t = useT();
  const features = [
    {
      icon: Bot,
      title: t("features.multiAgent.title"),
      desc: t("features.multiAgent.desc"),
      color: "#1e6fdc",
    },
    {
      icon: Mic,
      title: t("features.voice.title"),
      desc: t("features.voice.desc"),
      color: "#dc2626",
    },
    {
      icon: ScanLine,
      title: t("features.ocr.title"),
      desc: t("features.ocr.desc"),
      color: "#16a34a",
    },
    {
      icon: Radio,
      title: t("features.realtime.title"),
      desc: t("features.realtime.desc"),
      color: "#f59e0b",
    },
    {
      icon: Users,
      title: t("features.family.title"),
      desc: t("features.family.desc"),
      color: "#7c3aed",
    },
    {
      icon: Languages,
      title: t("features.language.title"),
      desc: t("features.language.desc"),
      color: "#0891b2",
    },
  ];

  return (
    <section id="features" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <span className="mb-2 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700">
            Capabilities
          </span>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            {t("features.subtitle")}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl glass-card p-6 shadow-md-soft transition-shadow hover:shadow-lg-soft"
            >
              <div
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform group-hover:scale-x-100"
                style={{ background: f.color }}
              />
              <div
                className="mb-4 grid size-12 place-items-center rounded-xl"
                style={{ background: f.color + "1A", color: f.color }}
              >
                <f.icon className="size-6" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">
                {f.title}
              </h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
