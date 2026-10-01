"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  ClipboardCheck,
  CheckCircle2,
  TriangleAlert,
  Share2,
  Download,
  Phone,
  UserCheck,
  Stethoscope,
  Truck,
  Droplet,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/hooks/use-t";
import type { EmergencyPlan } from "@/lib/types";
import { HospitalCard } from "./HospitalCard";
import { AmbulanceCard } from "./AmbulanceCard";
import { BloodCard } from "./BloodCard";
import { MiniMap } from "./MiniMap";
import { DisclaimerBanner } from "./Shared";
import { ConfidenceScores, AgentReasoningPanel } from "./ConfidenceScores";
import { HumanApprovalGate } from "./HumanApprovalGate";

const urgencyColors: Record<string, { bg: string; text: string; ring: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  Low: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
};

export function EmergencyPlanView({
  plan,
  onConfirm,
  onShare,
  onReject,
  approving = false,
}: {
  plan: EmergencyPlan;
  onConfirm: () => void;
  onShare: () => void;
  onReject?: () => void;
  approving?: boolean;
}) {
  const t = useT();
  const u = urgencyColors[plan.triage.urgency] || urgencyColors.Medium;
  const isDraft = plan.status === "draft";

  const onDownload = () => {
    const html = planToHtml(plan);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resqnet-plan-${plan.requestId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Top banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-slate-900">
              {t("em.planReady")}
            </h2>
            <p className="text-sm text-slate-600">
              Request <span className="font-mono text-xs">#{plan.requestId.slice(-6)}</span> · {new Date(plan.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ring-2 ${u.ring} ${u.bg} ${u.text}`}>
          <AlertTriangle className="size-5" />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">{t("em.riskLevel")}</div>
            <div className="font-heading text-lg font-bold">{plan.triage.urgency}</div>
          </div>
        </div>
      </div>

      <DisclaimerBanner compact />

      {/* Confidence scores + Emergency Priority badge */}
      <ConfidenceScores plan={plan} />

      {/* Human Approval Gate — only shown when plan is still in draft state.
          Once approved, the gate disappears and the Confirm & Dispatch button
          becomes active. This implements the AI principle:
          AI Recommendation → Human Review → Confirm → Execute. */}
      {isDraft && (
        <HumanApprovalGate
          plan={plan}
          onApprove={onConfirm}
          onReject={onReject || (() => window.location.reload())}
          approving={approving}
        />
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!isDraft ? (
          <Button size="lg" onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700">
            <UserCheck className="size-4" /> {t("em.confirm")}
          </Button>
        ) : (
          <Button size="lg" disabled className="bg-slate-300 opacity-60">
            <UserCheck className="size-4" /> Awaiting approval
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={onShare}>
          <Share2 className="size-4" /> {t("em.share")}
        </Button>
        <Button variant="outline" size="lg" onClick={onDownload}>
          <Download className="size-4" /> {t("em.download")}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: hospital + ambulance + blood + map */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="size-4 text-sky-600" />
                {t("em.recommendedHospital")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <HospitalCard hospital={plan.recommendedHospital} rank={1} />
              <MiniMap
                hospital={plan.recommendedHospital}
                ambulance={plan.recommendedAmbulance}
                blood={plan.bloodMatch}
              />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-4 text-red-600" /> {t("em.ambulanceEta")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <AmbulanceCard
                  ambulance={plan.recommendedAmbulance}
                  hospital={plan.recommendedHospital}
                  requestId={plan.requestId}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Stethoscope className="size-4 text-violet-600" /> {t("em.specialist")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                      <UserCheck className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-slate-900">
                        {plan.recommendedSpecialist.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {plan.recommendedSpecialist.specialty} · {plan.recommendedSpecialist.experience} yrs
                      </p>
                      <p className="text-xs text-slate-400">
                        {plan.recommendedSpecialist.hospital}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={plan.recommendedSpecialist.available ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600"}>
                      {plan.recommendedSpecialist.available ? "Available" : "Off-duty"}
                    </Badge>
                    <a href={`tel:${plan.recommendedSpecialist.phone}`}>
                      <Button variant="outline" size="sm" className="h-7">
                        <Phone className="size-3" /> Call
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {plan.bloodMatch && (
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplet className="size-4 text-rose-600" /> {t("em.bloodMatch")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <BloodCard blood={plan.bloodMatch} />
              </CardContent>
            </Card>
          )}

          {plan.alternativeHospitals?.length > 0 && (
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Stethoscope className="size-4 text-sky-600" />
                  {t("em.alternativeHospitals")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.alternativeHospitals.map((h) => (
                    <HospitalCard key={h.id} hospital={h} compact />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: triage + summary + next steps + safety + reasoning */}
        <div className="space-y-5">
          {/* Triage */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-amber-600" /> Triage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className={`rounded-lg px-3 py-2 ${u.bg} ${u.text}`}>
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  Urgency
                </div>
                <div className="font-heading text-lg font-bold">
                  {plan.triage.urgency}{" "}
                  <span className="text-xs font-medium opacity-80">
                    · {(plan.triage.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Suspected category
                </div>
                <div className="text-slate-700">{plan.triage.suspectedCategory}</div>
              </div>
              {plan.triage.redFlags.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Red flags
                  </div>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700">
                    {plan.triage.redFlags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Reasoning
                </div>
                <p className="text-slate-600">{plan.triage.reasoning}</p>
              </div>
            </CardContent>
          </Card>

          {/* Medical summary */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-sky-600" />
                {t("em.medicalSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <p className="text-slate-700">{plan.medicalSummary}</p>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("em.nextSteps")}
                </div>
                <ol className="space-y-1.5">
                  {plan.nextSteps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("em.reasoning")}
                </div>
                <p className="text-slate-600">{plan.reasoning}</p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="size-4 text-emerald-600" /> Capacity Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Overall suitability</span>
                <span className="font-heading text-xl font-extrabold text-emerald-700">
                  {(plan.capacity.suitability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="space-y-1.5">
                {plan.capacity.factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-28 text-xs text-slate-500">{f.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${Math.min(100, f.value * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-[11px] font-mono text-slate-500">
                      {(f.value * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="pt-1 text-[11px] text-slate-400">
                Suitability score — not a live bed count. Always verify with hospital directly.
              </p>
            </CardContent>
          </Card>

          {/* Document summary */}
          {plan.documentSummary && (
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-violet-600" /> Document Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-2">
                <Badge variant="outline" className="text-violet-700">
                  {plan.documentSummary.reportType}
                </Badge>
                <p className="text-slate-700">{plan.documentSummary.importantFindings}</p>
                {plan.documentSummary.findings.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Findings
                    </div>
                    <ul className="list-inside list-disc text-slate-600">
                      {plan.documentSummary.findings.slice(0, 5).map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.documentSummary.medicines.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Medicines
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.documentSummary.medicines.map((m, i) => (
                        <span key={i} className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safety guidance */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-sky-600" />
                {t("em.safetyGuidance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <SafetyBlock title={t("em.doNow")} items={plan.safety.doNow} color="text-emerald-700" iconColor="bg-emerald-100" />
              <SafetyBlock title={t("em.avoid")} items={plan.safety.avoid} color="text-red-700" iconColor="bg-red-100" icon="ban" />
              <SafetyBlock title={t("em.whileWaiting")} items={plan.safety.whileWaiting} color="text-sky-700" iconColor="bg-sky-100" />
              <SafetyBlock title={t("em.warningSigns")} items={plan.safety.warningSigns} color="text-amber-700" iconColor="bg-amber-100" icon="alert" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Per-agent reasoning — explains WHY each decision was made */}
      <AgentReasoningPanel plan={plan} />
    </motion.div>
  );
}

function SafetyBlock({
  title,
  items,
  color,
  iconColor,
  icon,
}: {
  title: string;
  items: string[];
  color: string;
  iconColor: string;
  icon?: string;
}) {
  return (
    <div>
      <div className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${color}`}>
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700">
            <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${iconColor} ${color}`}>
              {icon === "ban" ? (
                <span className="text-[10px] font-bold">✕</span>
              ) : icon === "alert" ? (
                <TriangleAlert className="size-2.5" />
              ) : (
                <span className="text-[10px] font-bold">✓</span>
              )}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function planToHtml(plan: EmergencyPlan): string {
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>ResQNet Emergency Plan ${plan.requestId}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; max-width: 720px; margin: 32px auto; padding: 24px; color: #1e293b; }
  h1 { color: #1e6fdc; font-size: 24px; }
  h2 { color: #0f172a; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  ul { padding-left: 20px; }
  .disclaimer { background: #fffbeb; padding: 12px; border-radius: 8px; border: 1px solid #fde68a; font-size: 12px; }
</style></head>
<body>
  <h1>ResQNet Emergency Plan</h1>
  <p>Request <strong>#${plan.requestId}</strong> · ${new Date(plan.createdAt).toLocaleString()}</p>
  <p class="disclaimer">⚠️ ResQNet provides recommendations only and is not a substitute for professional medical advice.</p>

  <h2>Reasoning</h2>
  <p>${plan.reasoning}</p>

  <h2>Medical Summary</h2>
  <p>${plan.medicalSummary}</p>

  <h2>Triage</h2>
  <ul>
    <li>Urgency: <strong>${plan.triage.urgency}</strong> (${(plan.triage.confidence * 100).toFixed(0)}% confidence)</li>
    <li>Suspected category: ${plan.triage.suspectedCategory}</li>
    <li>Red flags: ${plan.triage.redFlags.join(", ") || "—"}</li>
    <li>Reasoning: ${plan.triage.reasoning}</li>
  </ul>

  <h2>Recommended Hospital</h2>
  <ul>
    <li>${plan.recommendedHospital.name} — ${plan.recommendedHospital.area}, ${plan.recommendedHospital.city}</li>
    <li>Distance: ${plan.recommendedHospital.distanceKm} km · Rating: ${plan.recommendedHospital.rating} · ICU: ${plan.recommendedHospital.icuAvailable ? "Yes" : "No"}</li>
    <li>Phone: ${plan.recommendedHospital.phone}</li>
  </ul>

  <h2>Specialist</h2>
  <p>${plan.recommendedSpecialist.name} — ${plan.recommendedSpecialist.specialty} (${plan.recommendedSpecialist.experience} yrs)</p>

  <h2>Ambulance</h2>
  <p>${plan.recommendedAmbulance.code} (${plan.recommendedAmbulance.type}) · ETA ${plan.recommendedAmbulance.etaMinutes} min · Driver ${plan.recommendedAmbulance.driverName}</p>

  ${plan.bloodMatch ? `<h2>Blood Match</h2><p>${plan.bloodMatch.bank} — ${plan.bloodMatch.bloodGroup} (${plan.bloodMatch.units} units, ${plan.bloodMatch.distanceKm} km)</p>` : ""}

  <h2>Next Steps</h2>
  <ol>
    ${plan.nextSteps.map((s) => `<li>${s}</li>`).join("")}
  </ol>

  <h2>Safety Guidance</h2>
  <p><strong>Do Now:</strong> ${plan.safety.doNow.join("; ")}</p>
  <p><strong>Avoid:</strong> ${plan.safety.avoid.join("; ")}</p>
  <p><strong>While Waiting:</strong> ${plan.safety.whileWaiting.join("; ")}</p>
  <p><strong>Warning Signs:</strong> ${plan.safety.warningSigns.join("; ")}</p>

  <hr style="margin-top:24px" />
  <p style="font-size:11px;color:#64748b">Generated by ResQNet — When Every Second Counts.</p>
</body></html>`;
}
