"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks/use-t";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Droplet,
  Truck,
  Siren,
  FileText,
  BarChart3,
  Languages,
  Plus,
  Trash2,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { demoActivity } from "@/lib/demo-data";

type Row = Record<string, any>;

const RESOURCES = [
  { key: "hospitals", icon: Building2, labelKey: "admin.hospitals" },
  { key: "doctors", icon: Stethoscope, labelKey: "admin.doctors" },
  { key: "bloodBanks", icon: Droplet, labelKey: "admin.bloodBanks" },
  { key: "ambulances", icon: Truck, labelKey: "admin.ambulances" },
  { key: "users", icon: Users, labelKey: "admin.users" },
  { key: "requests", icon: Siren, labelKey: "admin.requests" },
  { key: "reports", icon: FileText, labelKey: "admin.reports" },
] as const;

export function AdminPanel() {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const [tab, setTab] = useState<string>("hospitals");

  if (user?.role !== "admin") {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <Siren className="mx-auto mb-3 size-12 text-slate-300" />
          <h2 className="font-heading text-xl font-bold text-slate-700">Admin access required</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in as <code className="rounded bg-slate-100 px-1.5 py-0.5">admin@resqnet.io</code> / <code className="rounded bg-slate-100 px-1.5 py-0.5">admin123</code> to manage ResQNet resources.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            {t("admin.title")}
          </h1>
          <p className="text-sm text-slate-500">{t("admin.subtitle")}</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 gap-1 sm:grid-cols-7 lg:grid-cols-8">
            {RESOURCES.map((r) => (
              <TabsTrigger key={r.key} value={r.key} className="gap-1 text-xs">
                <r.icon className="size-3.5" />
                <span className="hidden sm:inline">{t(r.labelKey)}</span>
              </TabsTrigger>
            ))}
            <TabsTrigger value="analytics" className="gap-1 text-xs">
              <BarChart3 className="size-3.5" />
              <span className="hidden sm:inline">{t("admin.analytics")}</span>
            </TabsTrigger>
          </TabsList>

          {RESOURCES.map((r) => (
            <TabsContent key={r.key} value={r.key}>
              {/* Keyed by tab so it remounts fresh and starts in loading state */}
              <ResourceTableLoader key={r.key} resource={r.key} />
            </TabsContent>
          ))}

          <TabsContent value="analytics">
            <AnalyticsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ResourceTableLoader({ resource }: { resource: string }) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/${resource}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resource]);

  const columns = items.length
    ? Object.keys(items[0]).filter((k) => k !== "_id" && k !== "passwordHash")
    : [];

  return (
    <ResourceTable
      resource={resource}
      items={items}
      columns={columns}
      loading={loading}
      onChange={() => {
        setLoading(true);
        fetch(`/api/admin/${resource}`)
          .then((r) => r.json())
          .then((d) => {
            setItems(d.items || []);
            setLoading(false);
          });
      }}
    />
  );
}

function ResourceTable({
  resource,
  items,
  columns,
  loading,
  onChange,
}: {
  resource: string;
  items: Row[];
  columns: string[];
  loading: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Row>({});

  const onDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/${resource}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.success("Deleted.");
      onChange();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const onSave = async () => {
    try {
      await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      toast.success("Added.");
      setAdding(false);
      setDraft({});
      onChange();
    } catch {
      toast.error("Add failed.");
    }
  };

  const fieldDefaults: Record<string, Row> = {
    hospitals: { id: "", name: "", area: "", city: "Karachi", distanceKm: 3, rating: 4.5, openNow: true, emergencyCapability: "Level 3", icuAvailable: true, specialties: ["Cardiology"], phone: "" },
    doctors: { id: "", name: "", specialty: "Cardiologist", hospital: "", experience: 10, available: true, phone: "" },
    bloodBanks: { id: "", bank: "", bloodGroup: "O+", units: 5, distanceKm: 3, updatedAt: new Date().toISOString(), phone: "" },
    ambulances: { id: "", code: "", type: "ALS", distanceKm: 3, etaMinutes: 7, oxygen: true, paramedic: true, status: "available", driverName: "", phone: "" },
    users: { id: "", name: "", email: "", role: "user", createdAt: new Date().toISOString() },
    requests: { id: "", symptoms: "", status: "plan_ready", createdAt: new Date().toISOString() },
    reports: { id: "", name: "", type: "lab", uploadedAt: new Date().toISOString() },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-base font-bold capitalize">{resource}</CardTitle>
          <CardDescription>{items.length} records</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setDraft(fieldDefaults[resource] || {}); setAdding(true); }}>
          <Plus className="size-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-6 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No records.</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto scrollbar-resqnet rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50">
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c} className="text-xs font-semibold uppercase text-slate-500">
                      {c}
                    </TableHead>
                  ))}
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.slice(0, 100).map((row, i) => (
                  <TableRow key={row.id || i}>
                    {columns.map((c) => (
                      <TableCell key={c} className="text-xs text-slate-700">
                        {renderCell(row[c])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <button
                        onClick={() => onDelete(row.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h4 className="mb-3 text-sm font-bold text-slate-700">New record</h4>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {Object.keys(draft).map((k) => (
                <div key={k}>
                  <Label className="mb-1 block text-xs font-medium text-slate-600">{k}</Label>
                  <Input
                    value={typeof draft[k] === "object" ? JSON.stringify(draft[k]) : String(draft[k] ?? "")}
                    onChange={(e) => {
                      let v: any = e.target.value;
                      if (typeof draft[k] === "number") v = Number(v) || 0;
                      if (typeof draft[k] === "boolean") v = v === "true";
                      if (Array.isArray(draft[k])) {
                        try { v = JSON.parse(v); } catch { v = v.split(",").map((s: string) => s.trim()); }
                      }
                      setDraft({ ...draft, [k]: v });
                    }}
                    className="h-9 text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={onSave} className="bg-sky-600 hover:bg-sky-700">
                Save record
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function renderCell(v: any) {
  if (v == null) return <span className="text-slate-300">—</span>;
  if (typeof v === "boolean") return <Badge variant="outline">{v ? "Yes" : "No"}</Badge>;
  if (Array.isArray(v)) return <span className="text-slate-500">{v.slice(0, 3).join(", ")}{v.length > 3 ? "…" : ""}</span>;
  if (typeof v === "object") return <span className="text-slate-500">object</span>;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    return <span className="text-slate-500">{new Date(v).toLocaleString()}</span>;
  }
  if (typeof v === "string" && v.length > 40) return <span className="text-slate-500">{v.slice(0, 40)}…</span>;
  return String(v);
}

function AnalyticsView() {
  const t = useT();
  const stats = [
    { label: t("stats.hospitals"), value: "8+", color: "#1e6fdc" },
    { label: t("stats.ambulances"), value: "4+", color: "#dc2626" },
    { label: t("stats.blood"), value: "52", color: "#e11d48" },
    { label: t("stats.emergencies"), value: "1,284", color: "#f59e0b" },
    { label: t("stats.responseTime"), value: "4.6 min", color: "#16a34a" },
    { label: "Active users", value: "312", color: "#7c3aed" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {s.label}
            </div>
            <div className="mt-1 font-heading text-3xl font-extrabold" style={{ color: s.color }}>
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">Recent activity feed</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3 text-sm">
            {demoActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className={`mt-1 size-2 rounded-full ${a.type === "emergency" ? "bg-red-500" : a.type === "report" ? "bg-emerald-500" : "bg-slate-400"}`} />
                <div>
                  <div className="text-slate-700">{a.message}</div>
                  <div className="text-xs text-slate-400">{new Date(a.timestamp).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

void Languages;
void Siren;
