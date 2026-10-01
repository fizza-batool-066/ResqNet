"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, AlertTriangle } from "lucide-react";

interface GroqStatus {
  ok: boolean;
  model: string;
  enabled: boolean;
  error?: string;
  message?: string;
}

/**
 * Groq-powered badge. Polls /api/groq/health once on mount, then displays:
 *  - "Powered by Groq · <model>"  (green) when reachable
 *  - "AI fallback active"          (amber) when Groq is unreachable
 *  - "Groq not configured"         (slate) when no API key set
 */
export function GroqStatusBadge() {
  const [status, setStatus] = useState<GroqStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/groq/health");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // ignore — keep null state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
        <Sparkles className="mr-1 size-3" /> AI: checking…
      </Badge>
    );
  }
  if (!status.enabled) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
        <AlertTriangle className="mr-1 size-3" /> Groq not configured
      </Badge>
    );
  }
  if (status.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
          title={status.message}
        >
          <Zap className="mr-1 size-3" /> Powered by Groq · {status.model}
        </Badge>
      </motion.div>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700" title={status.message}>
      <AlertTriangle className="mr-1 size-3" /> AI fallback active
    </Badge>
  );
}
