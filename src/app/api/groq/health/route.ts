import { NextResponse } from "next/server";
import { groqHealthCheck, groqModel, groqEnabled } from "@/lib/services/groqService";

// GET /api/groq/health — returns Groq connectivity status so the dashboard
// can display "Powered by Groq llama-3.3-70b-versatile" or "Fallback mode".
export async function GET() {
  if (!groqEnabled) {
    return NextResponse.json({
      ok: false,
      model: groqModel,
      enabled: false,
      message: "GROQ_API_KEY not set — running on ZAI fallback.",
    });
  }
  const result = await groqHealthCheck();
  return NextResponse.json({
    enabled: true,
    model: result.model,
    ok: result.ok,
    error: result.error,
    message: result.ok
      ? `Groq ${result.model} is reachable.`
      : `Groq unreachable — running on ZAI fallback. Error: ${result.error || "unknown"}`,
  });
}
