"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Share2, Copy, MessageCircle, Phone, Check } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export function FamilyNotifyModal({
  open,
  onOpenChange,
  planId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planId?: string;
}) {
  const t = useT();
  const contacts = useAppStore((s) => s.contacts);
  const user = useAppStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const planUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?plan=${planId || "demo"}`
      : "https://resqnet.io";

  const text = `ResQNet Emergency Plan${
    user ? ` from ${user.name}` : ""
  }. View the coordinated plan: ${planUrl}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-sky-600" /> {t("em.notifyFamily")}
          </DialogTitle>
          <DialogDescription>
            Share the emergency plan with a family member so they can stay informed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Message preview</div>
            <p className="mt-1 text-sm text-slate-700">{text}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a
              href={`sms:?&body=${encodeURIComponent(text)}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              <Phone className="size-4" /> SMS
            </a>
            <Button
              variant="outline"
              onClick={onCopy}
              className="w-full"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>

          {contacts.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-medium text-slate-500">
                Your emergency contacts
              </div>
              <ul className="space-y-1">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="ml-2 text-xs text-slate-400">({c.relation})</span>
                    </span>
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Share
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="mt-2 w-full">
            {t("common.close")}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
