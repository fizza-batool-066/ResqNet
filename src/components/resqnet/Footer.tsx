"use client";

import { useT } from "@/hooks/use-t";
import { Logo } from "./Shared";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

export function Footer() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);

  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-slate-500">
            {t("footer.tagline")} AI-powered multi-agent emergency coordination
            for hospitals, ambulances, blood banks and specialists.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("footer.product")}
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <FooterLink onClick={() => setView("landing")}>{t("nav.features")}</FooterLink>
            </li>
            <li>
              <FooterLink onClick={() => setView("landing")}>{t("nav.howItWorks")}</FooterLink>
            </li>
            <li>
              <FooterLink onClick={() => setView("dashboard")}>{t("nav.dashboard")}</FooterLink>
            </li>
            <li>
              <FooterLink onClick={() => setView("history")}>{t("nav.history")}</FooterLink>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("footer.company")}
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><FooterLink>{t("nav.about")}</FooterLink></li>
            <li><FooterLink>{t("nav.contact")}</FooterLink></li>
            <li><FooterLink>Privacy</FooterLink></li>
            <li><FooterLink>Terms</FooterLink></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("footer.support")}
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2 font-medium text-red-600">
              <span className="inline-block size-2 animate-pulse rounded-full bg-red-500" />
              {t("footer.emergency")}
            </li>
            <li><FooterLink>support@resqnet.io</FooterLink></li>
            <li><FooterLink>+92 21 3486 1234</FooterLink></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ResQNet. {t("footer.rights")}{" "}
            <span className="block sm:inline">
              {t("footer.disclaimer")}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className="text-left transition-colors hover:text-sky-700"
    >
      {children}
    </motion.button>
  );
}
