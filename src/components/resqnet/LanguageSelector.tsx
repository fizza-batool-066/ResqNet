"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/use-t";
import { languageLabels } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-soft transition-colors hover:bg-slate-50 ${compact ? "" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="size-4 text-sky-600" />
        <span className={`text-slate-700 ${language === "ur" ? "font-urdu" : ""} ${compact ? "hidden sm:inline" : ""}`}>
          {languageLabels[language as Language].native}
        </span>
        <ChevronDown className="size-3.5 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              {(Object.keys(languageLabels) as Language[]).map((lng) => (
                <li key={lng}>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage(lng);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 ${language === lng ? "text-sky-700" : "text-slate-700"}`}
                  >
                    <span>
                      <span className="block font-medium">{languageLabels[lng].native}</span>
                      <span className="block text-[11px] text-slate-400">{languageLabels[lng].label}</span>
                    </span>
                    {language === lng && <Check className="size-4" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 4 5.9 4 9s-1.5 6.3-4 9c-2.5-2.7-4-5.9-4-9s1.5-6.3 4-9z" />
    </svg>
  );
}
