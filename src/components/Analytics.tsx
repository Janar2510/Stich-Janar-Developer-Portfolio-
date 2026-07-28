import Script from "next/script";

// Plausible — cookieless, no consent banner required under GDPR (unlike
// GA4), which keeps the privacy page's "we use no cookies" claim honest.
// Renders nothing until NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set: sign up at
// https://plausible.io, add the domain, drop it in .env.local.
export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.outbound-links.js"
      strategy="afterInteractive"
    />
  );
}

// Fire a custom Plausible event (tool starts/completions, PDF downloads,
// lead captures) — no-ops safely if analytics isn't configured or the
// script hasn't loaded yet.
export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const plausible = (window as unknown as { plausible?: (n: string, o?: { props?: typeof props }) => void }).plausible;
  plausible?.(name, props ? { props } : undefined);
}
