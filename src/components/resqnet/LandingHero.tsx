"use client";

import { useT } from "@/hooks/use-t";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Siren, ArrowRight, Play, Mic, Stethoscope, Truck, Droplet, FileText, Brain, Activity } from "lucide-react";

export function LandingHero() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);

  const handleStartEmergency = () => {
    if (user) {
      setView("emergency");
    } else {
      setView("auth");
    }
  };

  const nodes = [
    { icon: Stethoscope, label: t("hero.hospital"), color: "text-sky-600", bg: "bg-sky-50", pos: "top" },
    { icon: Truck, label: t("hero.ambulance"), color: "text-red-600", bg: "bg-red-50", pos: "right" },
    { icon: Droplet, label: t("hero.bloodBank"), color: "text-rose-600", bg: "bg-rose-50", pos: "bottom-right" },
    { icon: Brain, label: t("hero.specialist"), color: "text-violet-600", bg: "bg-violet-50", pos: "bottom" },
    { icon: FileText, label: t("hero.reports"), color: "text-emerald-600", bg: "bg-emerald-50", pos: "bottom-left" },
    { icon: Activity, label: "Capacity", color: "text-amber-600", bg: "bg-amber-50", pos: "left" },
  ];

  return (
    <section
      id="hero"
      className="grad-hero relative overflow-hidden pb-20 pt-12 sm:pt-16"
    >
      {/* soft decorative blobs */}
      <div className="pointer-events-none absolute -top-24 left-1/4 size-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 size-80 rounded-full bg-red-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-emerald-100/30 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12">
        <div className="relative z-10 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full glass-card px-3 py-1.5 text-xs font-medium text-slate-700 shadow-soft"
          >
            <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
            AI Multi-Agent Coordination · Live
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg lg:mx-0"
          >
            {t("hero.subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
          >
            <Button
              size="lg"
              onClick={handleStartEmergency}
              className="btn-ripple emergency-pulse relative h-12 rounded-xl grad-emergency px-7 text-base font-semibold text-white shadow-glow-red hover:brightness-105 active:scale-[0.98]"
            >
              <Siren className="size-5" />
              {t("hero.startEmergency")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-ripple h-12 rounded-xl border-slate-200 bg-white/80 px-6 text-base font-medium text-slate-700 shadow-soft backdrop-blur-sm hover:bg-white active:scale-[0.98]"
            >
              {t("hero.learnMore")} <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-ripple h-12 rounded-xl px-5 text-base font-medium text-slate-700 hover:bg-slate-100 active:scale-[0.98]"
            >
              <Play className="size-4" /> {t("hero.watchDemo")}
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 lg:justify-start"
          >
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" /> 8 hospitals live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-500" /> 24/7 ambulance dispatch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sky-500" /> EN · اردو · Roman Urdu
            </span>
          </motion.div>
        </div>

        {/* AI Coordinator visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 mx-auto hidden aspect-square w-full max-w-md anim-float sm:block"
        >
          <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
            <defs>
              <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e6fdc" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1e6fdc" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e6fdc" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#1e6fdc" stopOpacity="0.05" />
              </linearGradient>
              <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e293b" floodOpacity="0.08" />
              </filter>
            </defs>
            {/* center glow */}
            <circle cx="200" cy="200" r="170" fill="url(#center-glow)" />
            {/* concentric rings */}
            <circle cx="200" cy="200" r="80" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="200" cy="200" r="140" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 6" />

            {/* spokes from center */}
            {nodes.map((_, i) => {
              const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2;
              const x = 200 + Math.cos(angle) * 140;
              const y = 200 + Math.sin(angle) * 140;
              return (
                <line
                  key={i}
                  x1={200}
                  y1={200}
                  x2={x}
                  y2={y}
                  stroke="url(#line-grad)"
                  strokeWidth="1.5"
                />
              );
            })}
            {/* center node */}
            <g filter="url(#soft-shadow)">
              <circle cx="200" cy="200" r="46" fill="#fff" stroke="#1e6fdc" strokeWidth="2" />
            </g>
            <text x="200" y="200" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e6fdc" dy="0">
              AI
            </text>
            <text x="200" y="214" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">
              Coord.
            </text>

            {/* outer nodes */}
            {nodes.map((n, i) => {
              const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2;
              const x = 200 + Math.cos(angle) * 140;
              const y = 200 + Math.sin(angle) * 140;
              const Icon = n.icon;
              return (
                <g key={i} filter="url(#soft-shadow)">
                  <circle cx={x} cy={y} r="26" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
                  <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                    <Icon className={`size-6 ${n.color}`} />
                  </foreignObject>
                  <text
                    x={x}
                    y={y + 38}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="#475569"
                  >
                    {n.label.length > 10 ? n.label.slice(0, 9) + "…" : n.label}
                  </text>
                </g>
              );
            })}

            {/* patient node */}
            <g filter="url(#soft-shadow)">
              <circle cx="200" cy="350" r="30" fill="#fff" stroke="#0f766e" strokeWidth="2" />
            </g>
            <text x="200" y="350" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f766e">
              {t("hero.patient")}
            </text>
            <line x1="200" y1="320" x2="200" y2="246" stroke="#0f766e" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>

          {/* floating data labels */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="absolute left-2 top-6 rounded-lg glass-card px-3 py-1.5 text-xs font-medium text-slate-600 shadow-soft"
          >
            <Mic className="mr-1 inline size-3 text-red-500" /> Live mic ready
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute right-2 top-20 rounded-lg glass-success px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-soft"
          >
            <FileText className="mr-1 inline size-3" /> OCR online
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
