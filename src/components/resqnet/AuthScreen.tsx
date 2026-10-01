"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  ShieldPlus,
  AtSign,
  Lock,
  User as UserIcon,
  Phone,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "./Shared";

export function AuthScreen() {
  const t = useT();
  const authMode = useAppStore((s) => s.authMode);
  const setAuthMode = useAppStore((s) => s.setAuthMode);
  const pendingEmail = useAppStore((s) => s.pendingEmail);
  const setPendingEmail = useAppStore((s) => s.setPendingEmail);
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const addActivity = useAppStore((s) => s.addActivity);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const tab = authMode;

  const setTab = (m: typeof authMode) => {
    setError(null);
    setNotice(null);
    setAuthMode(m);
  };

  // ============= Submit handlers =============
  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const name = (fd.get("name") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const password = (fd.get("password") as string)?.trim();
    const confirm = (fd.get("confirm") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim();
    if (!name || !email || !password) return setError("Please fill all required fields.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    setPendingEmail(email);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      // request OTP
      const otpRes = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      const otpData = await otpRes.json();
      if (otpData.demoCode) setDemoCode(otpData.demoCode);
      setNotice(`A 6-digit OTP was sent to ${email}. (Sandbox demo code shown below.)`);
      setTab("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = (fd.get("email") as string)?.trim();
    const password = (fd.get("password") as string)?.trim();
    if (!email || !password) return setError("Email and password required.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setUser(data.user, data.token);
      addActivity({
        id: `a-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "auth",
        message: `Logged in as ${data.user.email}`,
      });
      setView(data.user.role === "admin" ? "admin" : "dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = (fd.get("email") as string)?.trim();
    if (!email) return setError("Email required.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "forgot" }),
      });
      const data = await res.json();
      if (data.demoCode) setDemoCode(data.demoCode);
      setNotice(`Reset link / OTP sent to ${email}. (Sandbox demo code: ${data.demoCode || "—"})`);
      setPendingEmail(email);
      setTab("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!otpCode || otpCode.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");
      setNotice("Verified! Please complete your signup to continue.");
      setTab("signup");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grad-hero relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/4 size-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 size-80 rounded-full bg-red-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="relative z-10 grid min-h-screen items-center px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <div className="glass-card overflow-hidden rounded-3xl shadow-lg-soft">
            <div className="grad-info px-6 py-7 text-center text-white">
              <div className="mb-2 inline-grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Siren className="size-6" />
              </div>
              <h1 className="font-heading text-xl font-bold">{t("auth.welcome")}</h1>
              <p className="mt-1 text-sm text-sky-50">{t("auth.subtitle")}</p>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="p-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
                <TabsTrigger value="forgot">{t("auth.forgot")}</TabsTrigger>
                <TabsTrigger value="otp">{t("auth.otp")}</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {tab === "login" && (
                  <TabsContent value="login" forceMount asChild>
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={submitLogin}
                      className="mt-5 space-y-4"
                    >
                      <FieldLabel htmlFor="email" label={t("auth.email")}>
                        <AtSign className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="email" name="email" type="email" autoComplete="email" required className="pl-9" placeholder="you@example.com" />
                      </FieldLabel>
                      <FieldLabel htmlFor="password" label={t("auth.password")}>
                        <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="password" name="password" type="password" autoComplete="current-password" required className="pl-9" placeholder="••••••••" />
                      </FieldLabel>

                      <div className="flex items-center justify-between text-xs">
                        <button type="button" onClick={() => setTab("forgot")} className="text-sky-700 hover:underline">
                          {t("auth.forgotLink")}
                        </button>
                        <button type="button" onClick={() => setTab("signup")} className="text-slate-500 hover:underline">
                          {t("auth.noAccount")} {t("auth.signup")}
                        </button>
                      </div>

                      {error && <ErrorBox text={error} />}
                      <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : t("auth.signIn")}
                      </Button>

                      <DemoAdminHint />
                    </motion.form>
                  </TabsContent>
                )}

                {tab === "signup" && (
                  <TabsContent value="signup" forceMount asChild>
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={submitSignup}
                      className="mt-5 space-y-4"
                    >
                      <FieldLabel htmlFor="name" label={t("auth.name")}>
                        <UserIcon className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="name" name="name" required className="pl-9" placeholder="Ali Raza" />
                      </FieldLabel>
                      <FieldLabel htmlFor="s-email" label={t("auth.email")}>
                        <AtSign className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="s-email" name="email" type="email" required className="pl-9" placeholder="you@example.com" />
                      </FieldLabel>
                      <FieldLabel htmlFor="s-phone" label={t("auth.phone")}>
                        <Phone className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="s-phone" name="phone" className="pl-9" placeholder="+92-300-1234567" />
                      </FieldLabel>
                      <FieldLabel htmlFor="s-password" label={t("auth.password")}>
                        <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="s-password" name="password" type="password" required className="pl-9" placeholder="••••••••" />
                      </FieldLabel>
                      <FieldLabel htmlFor="confirm" label={t("auth.confirmPassword")}>
                        <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="confirm" name="confirm" type="password" required className="pl-9" placeholder="••••••••" />
                      </FieldLabel>

                      {error && <ErrorBox text={error} />}
                      {notice && <NoticeBox text={notice} />}
                      <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : t("auth.createAccount")}
                      </Button>

                      <div className="flex items-center justify-between text-xs">
                        <button type="button" onClick={() => setTab("login")} className="text-slate-500 hover:underline">
                          <ArrowLeft className="mr-1 inline size-3" />
                          {t("auth.haveAccount")} {t("auth.login")}
                        </button>
                      </div>
                      <DemoAdminHint />
                    </motion.form>
                  </TabsContent>
                )}

                {tab === "forgot" && (
                  <TabsContent value="forgot" forceMount asChild>
                    <motion.form
                      key="forgot"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={submitForgot}
                      className="mt-5 space-y-4"
                    >
                      <p className="text-sm text-slate-600">
                        Enter your email and we&apos;ll send a reset code.
                      </p>
                      <FieldLabel htmlFor="f-email" label={t("auth.email")}>
                        <AtSign className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input id="f-email" name="email" type="email" required className="pl-9" placeholder="you@example.com" />
                      </FieldLabel>
                      {error && <ErrorBox text={error} />}
                      {notice && <NoticeBox text={notice} />}
                      <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : t("auth.resetLink")}
                      </Button>
                      <button type="button" onClick={() => setTab("login")} className="w-full text-center text-xs text-slate-500 hover:underline">
                        <ArrowLeft className="mr-1 inline size-3" />
                        {t("auth.haveAccount")} {t("auth.login")}
                      </button>
                    </motion.form>
                  </TabsContent>
                )}

                {tab === "otp" && (
                  <TabsContent value="otp" forceMount asChild>
                    <motion.form
                      key="otp"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={submitOtp}
                      className="mt-5 space-y-4"
                    >
                      <p className="text-sm text-slate-600">
                        We sent a 6-digit code to <span className="font-semibold">{pendingEmail || "your email"}</span>.
                      </p>
                      {demoCode && (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
                          Sandbox code: <span className="font-mono font-bold">{demoCode}</span>
                        </div>
                      )}
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        inputMode="numeric"
                        className="text-center font-mono text-lg tracking-widest"
                      />
                      {error && <ErrorBox text={error} />}
                      {notice && <NoticeBox text={notice} />}
                      <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : t("auth.verify")}
                      </Button>
                    </motion.form>
                  </TabsContent>
                )}
              </AnimatePresence>
            </Tabs>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldPlus className="size-4" />
            {t("footer.disclaimer")}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}
      </Label>
      <div className="relative">{children}</div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {text}
    </div>
  );
}

function NoticeBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      <CheckCircle2 className="mr-1 inline size-4" />
      {text}
    </div>
  );
}

function DemoAdminHint() {
  const t = useT();
  const setAuthMode = useAppStore((s) => s.setAuthMode);
  const setPendingEmail = useAppStore((s) => s.setPendingEmail);
  return (
    <button
      type="button"
      onClick={() => {
        setPendingEmail("admin@resqnet.io");
        setAuthMode("login");
        // also prefill login form by using autofocus trick via DOM is complex; user just types
      }}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 hover:bg-slate-100"
    >
      {t("auth.demoAdmin")}
    </button>
  );
}
