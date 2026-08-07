"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Dictionary } from "@/i18n/get-dictionary";
import { trackEvent } from "@/components/Analytics";

const EASE = [0.16, 1, 0.3, 1] as const;

type FormDict = Dictionary["contact"]["form"];

// Builds a prefilled message when arriving from the ROI calculator's
// "book a consultation" CTA (?topic=ai-roi&industry=&roi=&verdict=).
function buildPrefill(search: string, dict: FormDict): { type: string; message: string } | null {
  const params = new URLSearchParams(search);
  if (params.get("topic") !== "ai-roi") return null;
  const industry = params.get("industry");
  const roi = params.get("roi");
  const verdict = params.get("verdict");
  const lines = [
    dict.prefillIntro,
    industry ? `${dict.prefillIndustry} ${industry}` : null,
    roi ? `${dict.prefillRoi} ${roi}%` : null,
    verdict ? `${dict.prefillVerdict} ${verdict.replace(/_/g, " ")}` : null,
    "",
    dict.prefillClosing,
  ].filter((l): l is string => l !== null);
  return { type: dict.prefillType, message: lines.join("\n") };
}

type SubmitState = "idle" | "submitting" | "error";

export default function ContactForm({ dict }: { dict: FormDict }) {
  const [sent, setSent] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [prefill, setPrefill] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    setPrefill(buildPrefill(window.location.search, dict));
  }, [dict]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
    if (!endpoint) {
      console.error("[contact] NEXT_PUBLIC_FORMSPREE_ENDPOINT is not set");
      setState("error");
      return;
    }
    setState("submitting");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      setSent(true);
      trackEvent("Contact Form Submitted", prefill ? { source: "roi-calculator" } : undefined);
    } catch (err) {
      console.error("[contact] submit failed:", err);
      setState("error");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="success"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="flex flex-col items-start gap-6 py-20"
        >
          {[
            <span key="icon" className="material-symbols-outlined text-accent text-5xl">check_circle</span>,
            <h3 key="title" className="font-manrope font-black text-4xl text-white uppercase tracking-tight">{dict.successTitle}</h3>,
            <p key="body" className="text-zinc-500 leading-relaxed">{dict.successBody}</p>,
          ].map((el, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
              }}
            >
              {el}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE } }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-14"
        >
          {prefill && (
            <div className="ai-badge lbl px-4 py-2 self-start">{dict.prefillBadge}</div>
          )}

          <div className="form-field pb-6">
            <label htmlFor="contact-name" className="lbl text-zinc-400 block mb-4">{dict.nameLabel}</label>
            <input id="contact-name" type="text" name="name" placeholder={dict.namePlaceholder} required autoComplete="name" />
          </div>

          <div className="form-field pb-6">
            <label htmlFor="contact-email" className="lbl text-zinc-400 block mb-4">{dict.emailLabel}</label>
            <input id="contact-email" type="email" name="email" placeholder={dict.emailPlaceholder} required autoComplete="email" />
          </div>

          <div className="form-field pb-6">
            <label htmlFor="contact-type" className="lbl text-zinc-400 block mb-4">{dict.typeLabel}</label>
            <input
              id="contact-type"
              key={prefill ? "type-prefilled" : "type-empty"}
              type="text"
              name="type"
              placeholder={dict.typePlaceholder}
              defaultValue={prefill?.type ?? ""}
            />
          </div>

          <div className="form-field pb-6">
            <label htmlFor="contact-message" className="lbl text-zinc-400 block mb-4">{dict.messageLabel}</label>
            <textarea
              id="contact-message"
              key={prefill ? "message-prefilled" : "message-empty"}
              name="message"
              placeholder={dict.messagePlaceholder}
              rows={5}
              required
              defaultValue={prefill?.message ?? ""}
            />
          </div>

          {state === "error" && (
            <p className="text-danger text-sm leading-relaxed -mt-8">{dict.errorMessage}</p>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={state === "submitting"}
              className="press bg-accent text-white font-manrope font-bold px-14 py-5 text-sm tracking-widest hover:bg-white hover:text-black flex items-center gap-4 group disabled:opacity-50"
            >
              {state === "submitting" ? dict.submitting : dict.submitButton}
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                arrow_right_alt
              </span>
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
