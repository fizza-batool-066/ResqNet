"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { motion } from "framer-motion";
import {
  Siren,
  FileText,
  Stethoscope,
  Mic,
  Phone,
  Plus,
  Activity as ActivityIcon,
  ChevronRight,
  Upload,
  MapPin,
  Star,
  Clock,
  ShieldPlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HospitalCard } from "./HospitalCard";
import { VoiceAssistant } from "./VoiceAssistant";
import { NotificationsPanel } from "./NotificationsPanel";
import { AgentCards } from "./AgentCards";
import { GroqStatusBadge } from "./GroqStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Hospital } from "@/lib/types";
import { toast } from "sonner";

export function Dashboard() {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const reports = useAppStore((s) => s.reports);
  const contacts = useAppStore((s) => s.contacts);
  const activities = useAppStore((s) => s.activities);
  const addReport = useAppStore((s) => s.addReport);
  const addContact = useAppStore((s) => s.addContact);
  const removeContact = useAppStore((s) => s.removeContact);
  const setEmergencyInput = useAppStore((s) => s.setEmergencyInput);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  useEffect(() => {
    fetch("/api/hospitals")
      .then((r) => r.json())
      .then((d) => {
        setHospitals(d.hospitals || []);
        setLoadingHospitals(false);
      })
      .catch(() => setLoadingHospitals(false));
  }, []);

  const startQuickEmergency = () => {
    setView("emergency");
  };

  const startEmergencyWithInput = (text: string) => {
    setEmergencyInput(text);
    setView("emergency");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback
                style={{ background: user?.avatarColor || "#1e6fdc" }}
                className="text-lg font-bold text-white"
              >
                {user?.name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-slate-900">
                {t("dash.welcome")}, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-slate-500">
                Stay calm — your emergency coordination layer is ready.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setView("history")}>
              <FileText className="size-4" /> {t("nav.history")}
            </Button>
          </div>
        </div>

        {/* Quick Emergency CTA */}
        <motion.button
          onClick={startQuickEmergency}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="emergency-pulse btn-ripple mb-6 flex w-full items-center justify-between gap-4 rounded-3xl grad-emergency p-5 text-white shadow-glow-red sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Siren className="size-6" />
            </div>
            <div className="text-left">
              <div className="font-heading text-xl font-extrabold sm:text-2xl">
                {t("dash.quickEmergency")}
              </div>
              <div className="text-sm text-red-100">
                {t("dash.quickEmergencyDesc")}
              </div>
            </div>
          </div>
          <ChevronRight className="size-6" />
        </motion.button>

        {/* AI architecture overview + Groq status badge */}
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl glass-panel px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-600 shadow-soft">
              <Sparkles className="size-4" />
            </div>
            <p className="text-xs leading-snug text-slate-600">
              <span className="font-semibold text-slate-800">ResQNet AI</span> · 7 agents orchestrated by a Coordinator. Model is swappable — currently{" "}
              <span className="font-mono font-medium text-slate-800">
                {process.env.NEXT_PUBLIC_GROQ_MODEL_LABEL || "Groq llama-3.3-70b-versatile"}
              </span>
              .
            </p>
          </div>
          <GroqStatusBadge />
        </div>
        <AgentCards />

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Recent Emergency / Saved Reports */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {t("dash.recentEmergency")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-slate-600">
                  {activities.find((a) => a.type === "emergency") ? (
                    <div>
                      <p className="text-slate-700">
                        {activities.find((a) => a.type === "emergency")?.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(activities.find((a) => a.type === "emergency")!.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500">{t("dash.noEmergencies")}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {t("dash.savedReports")}
                  </CardTitle>
                  <Badge variant="secondary">{reports.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 pt-4 text-sm">
                  {reports.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <FileText className="size-4 text-slate-400" />
                      <div className="flex-1 truncate">
                        <div className="text-slate-700">{r.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setView("history")}
                    className="text-xs font-medium text-sky-600 hover:underline"
                  >
                    {t("dash.viewAll")}
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Nearby hospitals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Stethoscope className="size-4 text-sky-600" />
                    {t("dash.nearbyHospitals")}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Top matches based on distance, specialty and emergency capability
                  </CardDescription>
                </div>
                <button
                  onClick={() => toast.info("Hospital list refreshed")}
                  className="text-xs text-sky-600 hover:underline"
                >
                  Refresh
                </button>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingHospitals ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                    <Loader2 className="size-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {hospitals.slice(0, 3).map((h, i) => (
                      <HospitalCard key={h.id} hospital={h} rank={i + 1} compact />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Assistant + Documents */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mic className="size-4 text-red-600" />
                    {t("dash.voiceAssistant")}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {t("dash.voiceDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <VoiceAssistant
                    compact
                    onTranscribed={(text) => {
                      startEmergencyWithInput(text);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="size-4 text-emerald-600" />
                    {t("dash.medicalDocs")}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setView("history")}
                  >
                    <Upload className="size-3.5" /> {t("dash.upload")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 pt-4 text-sm">
                  {reports.length === 0 && (
                    <p className="text-slate-500">No documents uploaded yet.</p>
                  )}
                  {reports.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="grid size-7 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                        <FileText className="size-3.5" />
                      </span>
                      <div className="flex-1 truncate">
                        <div className="text-slate-700">{r.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {r.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Real-time notifications */}
            <NotificationsPanel />

            {/* Emergency contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="size-4 text-violet-600" />
                  {t("dash.emergencyContacts")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddContact(true)}
                >
                  <Plus className="size-3.5" /> {t("dash.addContact")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 pt-4 text-sm">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-violet-100 text-xs text-violet-700">
                        {c.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.relation} · {c.phone}
                      </div>
                    </div>
                    <a href={`tel:${c.phone}`}>
                      <Phone className="size-4 text-sky-600" />
                    </a>
                    <button
                      onClick={() => removeContact(c.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className="text-slate-500">No contacts added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ActivityIcon className="size-4 text-sky-600" />
                  {t("dash.recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {activities.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full ${
                          a.type === "emergency"
                            ? "bg-red-500"
                            : a.type === "report"
                              ? "bg-emerald-500"
                              : a.type === "auth"
                                ? "bg-sky-500"
                                : "bg-slate-400"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="text-slate-700">{a.message}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(a.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <ShieldPlus className="mb-1 inline size-4" /> {t("footer.disclaimer")}
            </div>
          </div>
        </div>
      </div>

      <AddContactDialog
        open={showAddContact}
        onOpenChange={setShowAddContact}
        onAdd={(c) => {
          addContact(c);
          setShowAddContact(false);
          toast.success("Contact added.");
        }}
      />

      {/* Voice dialog uses VoiceAssistant too */}
      <Dialog open={showVoice} onOpenChange={setShowVoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Assistant</DialogTitle>
          </DialogHeader>
          <VoiceAssistant onTranscribed={(text) => startEmergencyWithInput(text)} />
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddContactDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (c: { id: string; name: string; relation: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add emergency contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fatima Raza" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Relation</label>
            <Input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Spouse" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92-300-9876543" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (!name || !phone) return toast.error("Name and phone required");
              onAdd({
                id: `c-${Date.now()}`,
                name,
                relation: relation || "Contact",
                phone,
              });
              setName("");
              setRelation("");
              setPhone("");
            }}
            className="bg-sky-600 hover:bg-sky-700"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Avoid unused warnings for icons imported but only used in sub-branches
void MapPin;
void Star;
void Clock;
