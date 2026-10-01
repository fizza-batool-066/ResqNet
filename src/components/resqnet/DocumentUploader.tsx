"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Loader2, Check, X } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";
import type { DocumentSummary } from "@/lib/types";

// Document uploader — calls /api/ocr with base64 image, then optionally
// the parent runs /api/emergency/analyze with the extracted text.
export function DocumentUploader({
  onSummary,
}: {
  onSummary: (text: string, summary?: DocumentSummary) => void;
}) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large — max 8 MB.");
      return;
    }
    if (!/^image\/|application\/pdf/.test(file.type)) {
      toast.error("Please upload an image or PDF.");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const b64 = `data:${file.type};base64,${bufToB64(buf)}`;
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64 }),
      });
      const data = await res.json();
      const text = data.text || "";
      onSummary(text, undefined);
      if (data.note) toast.info(data.note);
      if (!text) toast.error("Could not read document — please type symptoms manually.");
    } catch (err) {
      console.warn(err);
      toast.error("OCR failed. Please try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onFile}
      />
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="size-8 animate-spin text-sky-600" />
            <p className="text-sm text-slate-600">Reading document…</p>
          </motion.div>
        ) : fileName ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <Check className="size-4" /> {fileName}
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-sky-600 hover:underline"
            >
              Upload another
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-sky-100 text-sky-600">
              <UploadCloud className="size-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Drag & drop a medical report, or click to upload
            </p>
            <p className="text-xs text-slate-400">
              PDF · PNG · JPG — prescriptions, labs, MRI, blood reports
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Browse file
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof window !== "undefined"
    ? window.btoa(binary)
    : (binary as any);
}

void FileText;
void X;
