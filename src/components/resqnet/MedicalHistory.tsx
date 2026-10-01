"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { motion } from "framer-motion";
import {
  Droplet,
  Pill,
  AlertTriangle,
  HeartPulse,
  FileText,
  Plus,
  X,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function MedicalHistory() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);
  const bloodGroup = useAppStore((s) => s.bloodGroup);
  const setBloodGroup = useAppStore((s) => s.setBloodGroup);
  const allergies = useAppStore((s) => s.allergies);
  const setAllergies = useAppStore((s) => s.setAllergies);
  const medicines = useAppStore((s) => s.medicines);
  const setMedicines = useAppStore((s) => s.setMedicines);
  const conditions = useAppStore((s) => s.conditions);
  const setConditions = useAppStore((s) => s.setConditions);
  const reports = useAppStore((s) => s.reports);
  const setReports = useAppStore((s) => s.setReports);
  const removeReport = useAppStore((s) => s.removeReport);
  const contacts = useAppStore((s) => s.contacts);
  const setContacts = useAppStore((s) => s.setContacts);
  const addContact = useAppStore((s) => s.addContact);
  const removeContact = useAppStore((s) => s.removeContact);
  const user = useAppStore((s) => s.user);
  const token = useAppStore((s) => s.token);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile from MongoDB on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/history", {
          headers: { authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            const p = data.profile;
            if (p.bloodGroup) setBloodGroup(p.bloodGroup);
            if (Array.isArray(p.allergies)) setAllergies(p.allergies);
            if (Array.isArray(p.medicines)) setMedicines(p.medicines);
            if (Array.isArray(p.conditions)) setConditions(p.conditions);
            if (Array.isArray(p.emergencyContacts) && p.emergencyContacts.length) setContacts(p.emergencyContacts);
            if (Array.isArray(p.reports) && p.reports.length) setReports(p.reports);
          }
        }
      } catch {
        // ignore — local state still works
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/history", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          bloodGroup,
          allergies,
          medicines,
          conditions,
          emergencyContacts: contacts,
          reports,
        }),
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Medical history saved to your MongoDB Atlas profile.");
        setTimeout(() => setSaved(false), 2500);
      } else {
        toast.error("Could not save to server.");
      }
    } catch {
      toast.error("Network error. Profile kept in local state.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading medical history…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            {t("hist.title")}
          </h1>
          <p className="text-sm text-slate-500">{t("hist.subtitle")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <EditableListCard
                title={t("hist.allergies")}
                icon={<AlertTriangle className="size-4 text-red-600" />}
                items={allergies}
                onAdd={(v) => setAllergies([...allergies, v])}
                onRemove={(idx) => setAllergies(allergies.filter((_, i) => i !== idx))}
                accent="border-red-200"
              />
              <EditableListCard
                title={t("hist.medicines")}
                icon={<Pill className="size-4 text-sky-600" />}
                items={medicines}
                onAdd={(v) => setMedicines([...medicines, v])}
                onRemove={(idx) => setMedicines(medicines.filter((_, i) => i !== idx))}
                accent="border-sky-200"
              />
              <EditableListCard
                title={t("hist.conditions")}
                icon={<HeartPulse className="size-4 text-rose-600" />}
                items={conditions}
                onAdd={(v) => setConditions([...conditions, v])}
                onRemove={(idx) => setConditions(conditions.filter((_, i) => i !== idx))}
                accent="border-rose-200"
              />
              <Card>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Droplet className="size-4 text-rose-600" />
                    {t("hist.bloodGroup")}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Powers faster blood matching during emergencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Select value={bloodGroup} onValueChange={setBloodGroup}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-emerald-600" />
                  {t("hist.previousReports")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {reports.length === 0 ? (
                  <p className="text-sm text-slate-500">No reports uploaded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {reports.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                      >
                        <div className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                          <FileText className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{r.name}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(r.uploadedAt).toLocaleDateString()} · {r.type}
                          </div>
                          {r.summary && (
                            <div className="mt-1 text-xs text-slate-500">{r.summary}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeReport(r.id)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-violet-600" />
                  {t("hist.emergencyContacts")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-sm">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.relation} · {c.phone}</div>
                    </div>
                    <button
                      onClick={() => removeContact(c.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <AddContactInline onAdd={addContact} />
              </CardContent>
            </Card>

            <Button onClick={onSave} disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700" size="lg">
              <Save className="size-4" /> {saving ? "Saving…" : saved ? "Saved!" : t("hist.save")}
            </Button>

            <Button variant="outline" onClick={() => setView("dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableListCard({
  title,
  icon,
  items,
  onAdd,
  onRemove,
  accent = "border-slate-200",
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (idx: number) => void;
  accent?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <Card className={accent}>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2 text-sm">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing added yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {items.map((it, i) => (
              <motion.li
                key={`${it}-${i}`}
                layout
                className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              >
                {it}
                <button
                  onClick={() => onRemove(i)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label="Remove"
                >
                  <X className="size-3" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                onAdd(value.trim());
                setValue("");
              }
            }}
            placeholder="Add item…"
            className="h-9 text-sm"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 shrink-0"
            onClick={() => {
              if (value.trim()) {
                onAdd(value.trim());
                setValue("");
              }
            }}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddContactInline({
  onAdd,
}: {
  onAdd: (c: { id: string; name: string; relation: string; phone: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
      >
        <Plus className="size-3" /> Add contact
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <Input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation" />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92-300-…" />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (!name || !phone) return toast.error("Name and phone required");
            onAdd({ id: `c-${Date.now()}`, name, relation: relation || "Contact", phone });
            setOpen(false);
            setName(""); setRelation(""); setPhone("");
          }}
          className="bg-sky-600 hover:bg-sky-700"
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

void Label;
