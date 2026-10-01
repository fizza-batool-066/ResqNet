"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Truck,
  Stethoscope,
  Activity,
  AlertTriangle,
  FileText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useNotifications, type NotificationItem } from "@/hooks/use-notifications";

const typeConfig: Record<
  NotificationItem["type"],
  { icon: React.ReactNode; color: string; bg: string }
> = {
  info:      { icon: <Bell className="size-3.5" />,        color: "text-sky-700",     bg: "bg-sky-50" },
  emergency: { icon: <AlertTriangle className="size-3.5" />, color: "text-red-700",    bg: "bg-red-50" },
  ambulance: { icon: <Truck className="size-3.5" />,      color: "text-orange-700",  bg: "bg-orange-50" },
  hospital:  { icon: <Stethoscope className="size-3.5" />, color: "text-violet-700",  bg: "bg-violet-50" },
  document:  { icon: <FileText className="size-3.5" />,    color: "text-emerald-700", bg: "bg-emerald-50" },
  ai:        { icon: <Sparkles className="size-3.5" />,    color: "text-indigo-700",  bg: "bg-indigo-50" },
  alert:     { icon: <Activity className="size-3.5" />,   color: "text-amber-700",    bg: "bg-amber-50" },
};

const levelRing: Record<NotificationItem["level"], string> = {
  info:    "ring-sky-200",
  success: "ring-emerald-200",
  warning: "ring-amber-200",
  error:   "ring-red-200",
};

export function NotificationsPanel() {
  const { notifications, connected, clear } = useNotifications();

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Bell className="size-4 text-sky-600" />
            Real-time Notifications
          </span>
          <span className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }
            >
              <span className={`mr-1 size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
              {connected ? "Live" : "Connecting…"}
            </Badge>
            {notifications.length > 0 && (
              <Button size="icon" variant="ghost" className="size-7" onClick={clear} title="Clear all">
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No notifications yet. Emergency updates, ambulance status, and AI
            agent events will appear here in real time.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {notifications.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.info;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 ring-1 ${cfg.bg} ${levelRing[n.level]}`}
                  >
                    <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white ${cfg.color}`}>
                      {cfg.icon}
                    </span>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${cfg.color}`}>{n.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      {n.message && (
                        <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
