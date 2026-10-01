"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  MapPin,
  Home,
  Radio,
  XCircle,
  CheckCircle2,
  Activity,
  Clock,
  Navigation,
  Gauge,
  Phone,
} from "lucide-react";
import type { Ambulance, Hospital } from "@/lib/types";
import { useAmbulanceTracking } from "@/hooks/use-ambulance-tracking";

interface Props {
  open: boolean;
  onClose: () => void;
  requestId: string;
  ambulance: Ambulance;
  hospital?: Hospital;
}

const statusConfig = {
  dispatched: { label: "Dispatched", color: "#0ea5e9", bg: "bg-sky-50", text: "text-sky-700" },
  enroute:    { label: "En route",    color: "#f97316", bg: "bg-orange-50", text: "text-orange-700" },
  arrived:   { label: "Arrived",     color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { label: "Cancelled",   color: "#ef4444", bg: "bg-red-50", text: "text-red-700" },
} as const;

export function LiveTrackingModal({ open, onClose, requestId, ambulance, hospital }: Props) {
  // Stable tracking params — derive once
  const [trackingId] = useState(() => `${requestId}-${ambulance.id}`);
  const { state, events, connected, error } = useAmbulanceTracking({
    requestId: open ? trackingId : null,
    ambulanceCode: ambulance.code,
    distanceKm: ambulance.distanceKm,
  });

  const status = state?.status || "dispatched";
  const sConf = statusConfig[status];
  const progressPct = Math.round((state?.progress || 0) * 100);

  // Route projection for the SVG map (0..320 wide, 0..240 tall)
  // origin = bottom-left, destination = top-right, ambulance moves along a curve
  const patientX = 60, patientY = 180;
  const hospX = 240, hospY = 50;
  const ambulanceX = patientX + (hospX - patientX) * (state?.progress || 0);
  const ambulanceY = patientY + (hospY - patientY) * (state?.progress || 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[88vh] max-w-full overflow-y-auto p-0 sm:max-h-[640px] sm:rounded-t-3xl"
      >
        <SheetHeader className="border-b bg-slate-50/60 px-6 pt-5 pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-heading text-base font-extrabold">
              <Truck className="size-5 text-red-600" />
              Live Ambulance Tracking
            </span>
            <Badge className={`${sConf.bg} ${sConf.text} border-transparent`}>
              <Radio className="mr-1 size-3" />
              {connected ? "Live" : "Connecting…"}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Ambulance <span className="font-mono">{ambulance.code}</span> · {ambulance.type} · Driver {ambulance.driverName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Status banner */}
          <motion.div
            key={status}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-3 rounded-2xl ${sConf.bg} px-4 py-3`}
          >
            <div className="grid size-10 place-items-center rounded-xl bg-white shadow-sm">
              {status === "arrived" ? (
                <CheckCircle2 className="size-6 text-emerald-600" />
              ) : status === "cancelled" ? (
                <XCircle className="size-6 text-red-600" />
              ) : (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Navigation className="size-6 text-orange-600" />
                </motion.span>
              )}
            </div>
            <div>
              <div className={`font-heading text-lg font-bold ${sConf.text}`}>
                {sConf.label}
              </div>
              <div className="text-xs text-slate-600">
                {status === "arrived"
                  ? "Ambulance has reached the destination"
                  : status === "cancelled"
                  ? "Tracking session cancelled"
                  : `ETA ${state?.etaMinutes?.toFixed(1) ?? ambulance.etaMinutes} min · ${state?.speedKmh ?? 0} km/h`}
              </div>
            </div>
          </motion.div>

          {/* Live SVG map */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <svg viewBox="0 0 320 240" className="h-64 w-full" aria-label="Live tracking map">
              <defs>
                <pattern id="livegrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="liveroute" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <rect width="320" height="240" fill="url(#livegrid)" />

              {/* Faux roads */}
              <path d="M 0 80 H 320" stroke="#f1f5f9" strokeWidth="14" />
              <path d="M 0 160 H 320" stroke="#f1f5f9" strokeWidth="14" />
              <path d="M 110 0 V 240" stroke="#f1f5f9" strokeWidth="14" />
              <path d="M 220 0 V 240" stroke="#f1f5f9" strokeWidth="14" />

              {/* Travelled vs remaining route */}
              <path
                d={`M ${patientX} ${patientY} L ${ambulanceX} ${ambulanceY}`}
                stroke="url(#liveroute)"
                strokeWidth="4"
                fill="none"
              />
              <path
                d={`M ${ambulanceX} ${ambulanceY} L ${hospX} ${hospY}`}
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeDasharray="6 5"
                fill="none"
              />

              {/* Patient / origin */}
              <g>
                <circle cx={patientX} cy={patientY} r="13" fill="#0f766e" />
                <foreignObject x={patientX - 11} y={patientY - 11} width="22" height="22">
                  <Home className="size-5 text-white" />
                </foreignObject>
                <text x={patientX} y={patientY + 28} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f766e">
                  Pickup
                </text>
              </g>

              {/* Hospital / destination */}
              <g>
                <motion.circle
                  cx={hospX}
                  cy={hospY}
                  r="13"
                  fill="#1e6fdc"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ transformOrigin: `${hospX}px ${hospY}px` }}
                />
                <foreignObject x={hospX - 11} y={hospY - 11} width="22" height="22">
                  <MapPin className="size-5 text-white" />
                </foreignObject>
                <text x={hospX} y={hospY + 28} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e6fdc">
                  {hospital?.name?.split(" ")[0] || "Hospital"}
                </text>
              </g>

              {/* Moving ambulance */}
              <g>
                <motion.circle
                  cx={ambulanceX}
                  cy={ambulanceY}
                  r="11"
                  fill="#dc2626"
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ transformOrigin: `${ambulanceX}px ${ambulanceY}px` }}
                />
                <foreignObject x={ambulanceX - 9} y={ambulanceY - 9} width="18" height="18">
                  <Truck className="size-4 text-white" />
                </foreignObject>
                {/* Direction arrow */}
                <motion.g
                  animate={{
                    x: ambulanceX,
                    y: ambulanceY,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </g>
            </svg>

            {/* Live stats overlay */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
              <Stat label="ETA" value={state ? `${state.etaMinutes.toFixed(1)} min` : `${ambulance.etaMinutes} min`} color="#dc2626" icon={<Clock className="size-3" />} />
              <Stat label="Speed" value={state ? `${state.speedKmh} km/h` : "—"} color="#0ea5e9" icon={<Gauge className="size-3" />} />
              <Stat label="Distance" value={`${ambulance.distanceKm} km`} color="#1e6fdc" icon={<MapPin className="size-3" />} />
            </div>
            <div className="absolute bottom-3 right-4 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
              <Radio className="size-3" /> WebSocket · port 3003
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Trip progress</span>
              <span className="font-mono font-semibold text-slate-700">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2 bg-slate-100" />
          </div>

          {/* Telemetry grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Telemetry label="Status" value={sConf.label} icon={<Activity className="size-3" />} color={sConf.text} />
            <Telemetry label="Ambulance" value={ambulance.code} icon={<Truck className="size-3" />} />
            <Telemetry label="Type" value={ambulance.type} icon={<Radio className="size-3" />} />
            <Telemetry label="Paramedic" value={ambulance.paramedic ? "Onboard" : "—"} icon={<Phone className="size-3" />} />
          </div>

          {/* Event log */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Activity className="size-3" /> Live event log
            </h3>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm">
              {error && (
                <div className="mb-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                  Error: {error}
                </div>
              )}
              {events.length === 0 && !error ? (
                <p className="text-xs text-slate-400">Waiting for telemetry…</p>
              ) : (
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {events.map((ev, i) => (
                      <motion.li
                        key={`${ev.ts}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 text-xs"
                      >
                        <span className="font-mono text-slate-400">
                          {new Date(ev.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className="text-slate-600">{ev.message}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <a href={`tel:${ambulance.phone}`}>
              <Button variant="outline" size="sm">
                <Phone className="size-3.5" /> Call driver
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 text-[11px] shadow-sm">
      <span style={{ color }}>{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function Telemetry({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {icon} {label}
      </div>
      <div className={`mt-1 font-heading text-sm font-bold ${color || "text-slate-900"}`}>{value}</div>
    </div>
  );
}
