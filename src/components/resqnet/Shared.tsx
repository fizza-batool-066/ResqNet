"use client";

import { Activity, Heart, ShieldPlus, Siren, Truck, Droplet } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { motion } from "framer-motion";

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  const t = useT();
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 ${compact ? "" : "mb-3"}`}
      role="note"
    >
      <ShieldPlus className="size-4 shrink-0 text-amber-600" />
      <span>{t("em.disclaimer")}</span>
    </div>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="#"
      onClick={(e) => {
        e.preventDefault();
        useAppStore.getState().setView("landing");
      }}
      className={`flex items-center gap-2 ${className}`}
      aria-label="ResQNet home"
    >
      <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm">
        <Siren className="size-5" />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-heading text-lg font-extrabold tracking-tight text-slate-900">
          ResQ<span className="text-sky-600">Net</span>
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          AI Emergency Coordination
        </span>
      </div>
    </Link>
  );
}

export function ResourceStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm"
    >
      <div
        className="grid size-12 place-items-center rounded-xl"
        style={{ background: color + "1A", color }}
      >
        <Icon className="size-6" />
      </div>
      <div className="text-2xl font-heading font-extrabold text-slate-900">
        {value}
      </div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </motion.div>
  );
}

export const ResourceIcon = {
  Activity,
  Heart,
  Truck,
  Droplet,
  Siren,
};
