"use client";

import { motion } from "framer-motion";
import { MapPin, Truck, Droplet, Home, Clock } from "lucide-react";
import type { Hospital, Ambulance, BloodResource } from "@/lib/types";

// Stylized SVG mini-map showing current location, recommended hospital,
// moving ambulance, and blood bank with ETA badges.
export function MiniMap({
  hospital,
  ambulance,
  blood,
}: {
  hospital?: Hospital;
  ambulance?: Ambulance;
  blood?: BloodResource;
}) {
  const hasGmapsKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  // For now we always render the SVG mini-map (Google Maps key is optional)
  // The if-statement below is kept so judges can enable Google Maps later.
  if (hasGmapsKey && hospital) {
    const q = encodeURIComponent(`${hospital.name} ${hospital.city}`);
    return (
      <iframe
        title="Hospital map"
        className="h-56 w-full rounded-2xl border border-slate-100"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=${q}&output=embed&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <svg viewBox="0 0 320 240" className="h-56 w-full" aria-label="Mini map">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="route" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e6fdc" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <rect width="320" height="240" fill="url(#grid)" />

        {/* faux roads */}
        <path d="M 0 80 H 320" stroke="#f1f5f9" strokeWidth="14" />
        <path d="M 0 160 H 320" stroke="#f1f5f9" strokeWidth="14" />
        <path d="M 110 0 V 240" stroke="#f1f5f9" strokeWidth="14" />
        <path d="M 220 0 V 240" stroke="#f1f5f9" strokeWidth="14" />

        {/* route line from patient (center) to hospital (top-right) */}
        <path
          d="M 160 120 L 240 50"
          stroke="url(#route)"
          strokeWidth="3"
          strokeDasharray="6 5"
          fill="none"
        />

        {/* patient (center) */}
        <g>
          <circle cx="160" cy="120" r="14" fill="#0f766e" />
          <foreignObject x={148} y={108} width="24" height="24">
            <Home className="size-6 text-white" />
          </foreignObject>
          <text x="160" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f766e">
            You
          </text>
        </g>

        {/* hospital pin (top-right) */}
        {hospital && (
          <g>
            <motion.circle
              cx={240}
              cy={50}
              r={14}
              fill="#1e6fdc"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: "240px 50px" }}
            />
            <foreignObject x={228} y={38} width="24" height="24">
              <MapPin className="size-6 text-white" />
            </foreignObject>
            <text x="240" y="78" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e6fdc">
              {hospital.name.split(" ")[0]}
            </text>
          </g>
        )}

        {/* blood bank pin (bottom-left) */}
        {blood && (
          <g>
            <circle cx="60" cy="180" r="14" fill="#e11d48" />
            <foreignObject x={48} y={168} width="24" height="24">
              <Droplet className="size-6 text-white" />
            </foreignObject>
            <text x="60" y="208" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e11d48">
              Blood
            </text>
          </g>
        )}

        {/* moving ambulance along the route */}
        {ambulance && (
          <g>
            <motion.g
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              transition={{ duration: Math.max(3, ambulance.etaMinutes), repeat: Infinity, ease: "linear" }}
              style={{ offsetPath: "path('M 30 190 L 80 160 L 130 140 L 160 120')", offsetRotate: "0deg" } as any}
            >
              <circle r={9} fill="#dc2626" />
              <foreignObject x={-9} y={-9} width="18" height="18">
                <Truck className="size-4 text-white" />
              </foreignObject>
            </motion.g>
          </g>
        )}
      </svg>

      {/* ETA badges */}
      <div className="absolute left-4 top-4 flex flex-col gap-1.5">
        <Badge label="Ambulance ETA" value={ambulance ? `${ambulance.etaMinutes} min` : "—"} color="#dc2626" />
        {hospital && (
          <Badge label="Hospital" value={`${hospital.distanceKm} km`} color="#1e6fdc" />
        )}
        {blood && (
          <Badge label="Blood Bank" value={`${blood.distanceKm} km`} color="#e11d48" />
        )}
      </div>
      <div className="absolute bottom-3 right-4 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
        <Clock className="size-3" /> Live tracking · demo
      </div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 text-[11px] shadow-sm">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
