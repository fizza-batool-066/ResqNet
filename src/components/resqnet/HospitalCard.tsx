"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Star, Clock, Stethoscope, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import type { Hospital } from "@/lib/types";

export function HospitalCard({
  hospital,
  rank,
  compact = false,
}: {
  hospital: Hospital;
  rank?: number;
  compact?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl glass-card p-4 shadow-md-soft transition-shadow hover:shadow-lg-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                {hospital.name}
              </h3>
              {rank === 1 && (
                <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Top match</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="size-3" /> {hospital.area} · {hospital.city}
              <span>· {hospital.distanceKm} km</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                {hospital.rating.toFixed(1)}
              </span>
              <span className={`flex items-center gap-1 ${hospital.openNow ? "text-emerald-600" : "text-red-600"}`}>
                <span className={`size-1.5 rounded-full ${hospital.openNow ? "bg-emerald-500" : "bg-red-500"}`} />
                {hospital.openNow ? "Open now" : "Closed"}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="size-3" /> {hospital.emergencyCapability}
              </span>
            </div>
          </div>
        </div>
        {hospital.suitability != null && (
          <div className="text-right">
            <div className="text-xs text-slate-400">Suitability</div>
            <div className="font-heading text-lg font-extrabold text-sky-700">
              {hospital.suitability.toFixed(1)}
            </div>
          </div>
        )}
      </div>
      {!compact && (
        <CardContent className="px-0 pt-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {hospital.specialties.map((s, i) => (
              <span key={i} className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                {s}
              </span>
            ))}
            {hospital.icuAvailable && (
              <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">
                ICU
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href={`tel:${hospital.phone}`}>
              <Button variant="outline" size="sm" className="h-8">
                <Phone className="size-3.5" /> Call
              </Button>
            </a>
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(hospital.name + " " + hospital.city)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" className="h-8 bg-sky-600 hover:bg-sky-700">
                <Navigation className="size-3.5" /> Directions
              </Button>
            </a>
          </div>
        </CardContent>
      )}
    </motion.div>
  );
}

void Card;
void CardHeader;
void CardTitle;
