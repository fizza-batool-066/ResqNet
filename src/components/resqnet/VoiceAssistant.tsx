"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Browser-based Speech Recognition (Web Speech API) as the live mic fallback
// for z-ai-web-dev-sdk ASR (which needs a file upload).
type SpeechRecognitionType = any;

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

// Map of supported languages for the Web Speech API. Roman Urdu uses the same
// Latin-script English model — the AI Coordinator auto-detects the actual
// language from the transcript text.
const VOICE_LANGS: Record<string, { code: string; label: string }> = {
  en:   { code: "en-US", label: "English" },
  ur:   { code: "ur-PK", label: "Urdu (اردو)" },
  rur:  { code: "en-US", label: "Roman Urdu" },
};

export function VoiceAssistant({
  onTranscribed,
  compact = false,
}: {
  onTranscribed: (text: string) => void;
  compact?: boolean;
}) {
  const t = useT();
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState<string>("en");
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // (Re)build the SpeechRecognition instance whenever the language changes
  // so the user can switch between English / Urdu / Roman Urdu live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = VOICE_LANGS[lang]?.code || "en-US";
    r.onresult = (e: any) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i];
        if (tr.isFinal) finalText += tr[0].transcript;
        else interimText += tr[0].transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        setInterim("");
        onTranscribed(finalText.trim());
      }
    };
    r.onerror = (e: any) => {
      console.warn("SpeechRecognition error:", e.error);
      setListening(false);
      if (e.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow mic permission.");
      } else if (e.error === "no-speech") {
        // Silent — user paused too long; just stop listening.
      } else if (e.error === "language-not-supported") {
        toast.error(`${VOICE_LANGS[lang]?.label || lang} not supported in this browser. Try English.`);
      }
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    return () => {
      try {
        r.stop();
      } catch {}
    };
  }, [onTranscribed, lang]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Live mic not supported in this browser. Try Upload audio.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const b64 = `data:${file.type || "audio/wav"};base64,${BufferToB64(buf)}`;
      const res = await fetch("/api/asr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: b64 }),
      });
      const data = await res.json();
      if (data.text) onTranscribed(data.text);
      else if (data.note) toast.info(data.note);
    } catch (err) {
      console.warn("ASR upload failed:", err);
      toast.error("Could not transcribe audio.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Language picker — English / Urdu / Roman Urdu */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">Voice language:</span>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VOICE_LANGS).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.button
        type="button"
        onClick={toggleMic}
        whileTap={{ scale: 0.95 }}
        className={`relative grid size-20 place-items-center rounded-full transition-colors ${
          listening
            ? "bg-red-500 text-white"
            : "bg-sky-50 text-sky-600 hover:bg-sky-100"
        }`}
        aria-label={listening ? "Stop listening" : "Start voice input"}
      >
        {listening && (
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500/50"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
        {listening ? <MicOff className="size-8" /> : <Mic className="size-8" />}
      </motion.button>
      <div>
        <p className="text-sm font-medium text-slate-700">
          {listening ? `Listening in ${VOICE_LANGS[lang]?.label}… speak now` : "Tap mic and describe your emergency"}
        </p>
        {listening && (
          <p className="mt-1 text-xs text-slate-400">Press again to stop</p>
        )}
        <AnimatePresence>
          {interim && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 italic"
            >
              “{interim}…”
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Live mic (browser)
        </span>
        <span>or</span>
        <label className="cursor-pointer text-sky-600 hover:underline">
          {uploading ? (
            <Loader2 className="inline size-3 animate-spin" />
          ) : (
            "Upload audio"
          )}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={onFile}
            disabled={uploading}
          />
        </label>
      </div>
      {compact && (
        <p className="text-[11px] text-slate-400">
          Supports English, Urdu, Roman Urdu — auto-detected
        </p>
      )}
    </div>
  );
}

function BufferToB64(buf: ArrayBuffer): string {
  // Browser API: btoa on binary string
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof window !== "undefined"
    ? window.btoa(binary)
    : Buffer.from(bytes).toString("base64");
}

void X;

