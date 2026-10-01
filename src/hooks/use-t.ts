"use client";

import { useAppStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export function useT() {
  const language = useAppStore((s) => s.language);
  return (key: string) => translate(language as Language, key);
}

export function useLanguage() {
  return useAppStore((s) => s.language);
}
