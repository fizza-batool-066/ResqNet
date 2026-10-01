"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Truck, Wind, UserCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Ambulance, Hospital } from "@/lib/types";
import { LiveTrackingModal } from "./LiveTrackingModal";

export function AmbulanceCard({
  ambulance,
  hospital,
  requestId,
}: {
  ambulance: Ambulance;
  hospital?: Hospital;
  requestId?: string;
}) {
  const [trackingOpen, setTrackingOpen] = useState(false);

  return (
    <>
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
            <Truck className="size-6" />
            <motion.span
              className="absolute -right-1 -top-1 size-3 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-slate-900">
                {ambulance.code}
              </h3>
              <Badge
                variant="outline"
                className={`${
                  ambulance.type === "ALS"
                    ? "border-violet-200 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {ambulance.type}
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {ambulance.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">Driver: {ambulance.driverName}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="size-3" /> {ambulance.etaMinutes} min
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="size-1.5 rounded-full bg-sky-500" /> {ambulance.distanceKm} km
              </span>
              <span className={`flex items-center gap-1 ${ambulance.oxygen ? "text-emerald-600" : "text-slate-400"}`}>
                <Wind className="size-3" /> O₂
              </span>
              <span className={`flex items-center gap-1 ${ambulance.paramedic ? "text-emerald-600" : "text-slate-400"}`}>
                <UserCheck className="size-3" /> Paramedic
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <a href={`tel:${ambulance.phone}`}>
          <Button variant="outline" size="sm" className="h-8">
            <Phone className="size-3.5" /> Call
          </Button>
        </a>
        <Button
          size="sm"
          className="h-8 bg-red-600 hover:bg-red-700"
          onClick={() => setTrackingOpen(true)}
        >
          <Truck className="size-3.5" /> Track live
        </Button>
      </div>
    </motion.div>

    {trackingOpen && requestId && (
      <LiveTrackingModal
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        requestId={requestId}
        ambulance={ambulance}
        hospital={hospital}
      />
    )}
    </>
  );
}
