"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmergencyPlan } from "@/lib/types";

/**
 * Human Approval Gate — shown between the AI Coordinator finishing its
 * draft plan and the plan being finalized/dispatched. Per the ResQNet AI
 * principle (AI Recommendation → Human Review → Confirm → Execute), the
 * plan is NEVER auto-dispatched. A human must click Approve.
 */
export function HumanApprovalGate({
  plan,
  onApprove,
  onReject,
  approving = false,
}: {
  plan: EmergencyPlan;
  onApprove: () => void;
  onReject: () => void;
  approving?: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="border-2 border-amber-200 bg-amber-50/40 shadow-md">
          <CardHeader className="border-b border-amber-100 bg-amber-50/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold text-amber-900">
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <ShieldCheck className="size-5" />
              </motion.span>
              Human Approval Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm">
              <p className="font-medium text-amber-900">
                The AI Coordinator has drafted an emergency plan. Review it
                carefully before approving — once approved, the ambulance
                will be dispatched to the recommended hospital.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Request <span className="font-mono">#{plan.requestId.slice(-6)}</span> · Risk level{" "}
                <span className="font-bold text-amber-700">{plan.triage.urgency}</span>
              </p>
            </div>

            {plan.triage.recommendEmergencyServices && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Contact emergency services now</p>
                  <p className="text-xs text-red-700">
                    Triage flagged this as a potentially life-threatening case.
                    Call <a href="tel:1122" className="font-bold underline">1122</a> (Rescue) or{" "}
                    <a href="tel:15" className="font-bold underline">15</a> (Edhi) immediately.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                onClick={onApprove}
                disabled={approving}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {approving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Dispatching…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Approve Plan
                  </>
                )}
              </Button>
              <Button onClick={onReject} variant="outline" size="lg">
                <XCircle className="size-4" /> Reject & Re-analyze
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              By approving, you confirm that you have read the AI-generated plan.
              ResQNet provides recommendations only and is not a substitute for
              professional medical advice.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
