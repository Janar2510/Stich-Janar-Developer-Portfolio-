"use client";

import dynamic from "next/dynamic";

// LaserFlow pulls in ogl. This section sits far below the fold on the home
// page, so the whole thing is deferred into its own chunk rather than being
// added to the initial bundle of the site's most performance-sensitive route.
// ssr:false is why this wrapper exists at all — page.tsx is a Server Component
// and cannot pass that option itself.
const LaserFlow = dynamic(() => import("@/components/LaserFlow"), { ssr: false });

/**
 * The tuned CTA preset. Upstream defaults are built to be a centrepiece; these
 * values pull the effect back to a light shaft that sits behind the copy:
 * roughly a third of the stock fog, wisps at a fifth of stock intensity, and a
 * slower flow to match the site's single easing curve. The beam core is lifted
 * above the text so it never competes with the heading's contrast.
 */
export default function CtaBeam() {
  return (
    <LaserFlow
      color="#FF4800"
      backgroundColor="#000000"
      horizontalBeamOffset={0.0}
      verticalBeamOffset={-0.42}
      horizontalSizing={0.5}
      verticalSizing={2.2}
      // falloffStart is the real brightness lever — it scales the numerator of
      // the inverse-square term, so it enters squared. This sits between the
      // stock 1.2 (which blows out the copy the shaft passes behind) and a
      // token glow.
      falloffStart={0.78}
      fogIntensity={0.08}
      fogScale={0.26}
      fogFallSpeed={0.35}
      wispDensity={0.3}
      wispIntensity={1.1}
      wispSpeed={8.0}
      flowSpeed={0.22}
      flowStrength={0.18}
      mouseTiltStrength={0.008}
      mouseSmoothTime={0.12}
    />
  );
}
