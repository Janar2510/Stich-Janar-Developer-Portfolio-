import { NextResponse } from "next/server";
import { getLeadsDb } from "@/lib/firebaseAdmin";

// Node runtime — Firestore Admin writes and the optional Resend send both
// happen server-side only.
export const runtime = "nodejs";

interface LeadBody {
  email?: unknown;
  scenario?: unknown;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const scenario = body.scenario ?? {};

  // Persist every lead to Firestore. Never blocks the download — a storage
  // failure just gets logged, matching the existing Resend non-blocking rule.
  try {
    await getLeadsDb().collection("roi-calculator-leads").add({
      email,
      scenario,
      source: "roi-calculator",
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("[lead] Firestore write failed (non-blocking):", e);
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // No key configured — log the lead and unlock anyway. The download must
    // never depend on Resend being set up.
    console.log("[lead] AI ROI report lead (RESEND_API_KEY not set):", { email, scenario });
    return NextResponse.json({ ok: true });
  }

  try {
    // Dynamic + wrapped: the build and every other route never depend on
    // this resolving, and a delivery failure here never blocks the user's
    // download below.
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    await resend.emails.send({
      from: "AI ROI Calculator <onboarding@resend.dev>",
      to: "info@janarkuuskpro.com",
      subject: `New AI ROI report lead — ${email}`,
      text: `New lead captured from the AI ROI Calculator PDF gate.\n\nEmail: ${email}\nScenario: ${JSON.stringify(scenario, null, 2)}`,
    });
  } catch (e) {
    console.error("[lead] Resend send failed (non-blocking):", e);
  }

  return NextResponse.json({ ok: true });
}
