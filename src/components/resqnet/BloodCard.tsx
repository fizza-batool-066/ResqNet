"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Droplet, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { BloodResource } from "@/lib/types";

export function BloodCard({ blood }: { blood: BloodResource }) {
  const minutesAgo = Math.round(
    (Date.now() - new Date(blood.updatedAt).getTime()) / 60000,
  );
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Droplet className="size-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900">
              {blood.bank}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="size-3" /> {blood.distanceKm} km
              <Clock className="ml-1 size-3" /> updated {minutesAgo}m ago
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading text-2xl font-extrabold text-rose-600">
            {blood.bloodGroup}
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {blood.units} units
          </Badge>
        </div>
      </div>
      <div className="mt-3">
        <a href={`tel:${blood.phone}`}>
          <Button variant="outline" size="sm" className="h-8">
            <Phone className="size-3.5" /> Reserve
          </Button>
        </a>
      </div>
    </motion.div>
  );
}
