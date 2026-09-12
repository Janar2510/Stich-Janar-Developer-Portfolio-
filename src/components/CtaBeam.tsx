"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// LaserFlow pulls in ogl. This section sits far below the fold on the home
// page, so the whole thing is deferred into its own chunk rather than being
// added to the initial bundle of the site's most performance-sensitive route.
// ssr:false is why this wrapper exists at all — page.tsx is a Server Component
// and cannot pass that option itself.
const LaserFlow = dynamic(() => import("@/components/LaserFlow"), { ssr: false });

const PHONE = "(max-width: 767px)";

// matchMedia as an external store: the server snapshot is always "not a
// phone", the client reads the live query, and the subscribe callback keeps
// the value fresh across rotation and resize without a setState-in-effect.
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getSnapshot = () => window.matchMedia(PHONE).matches;
const getServerSnapshot = () => false;

/**
 * The tuned CTA preset. Upstream defaults are built to be a centrepiece; these
 * values pull the effect back to a light shaft that sits behind the copy, with
 * the pool of light landing just under the button.
 *
 * The beam's geometry is resolution-relative, so one preset cannot serve both
 * a 1440px-wide section and a 400px-wide one. On phones the section is much
 * taller than it is wide, so the pool is raised (verticalBeamOffset closer to
 * zero) and the shaft shortened, otherwise the bright part lands a full screen
 * below the button and all that shows behind the copy is a faint line.
 */
export default function CtaBeam() {
  const phone = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <LaserFlow
      color="#FF4800"
      backgroundColor="#000000"
      horizontalBeamOffset={0.0}
      verticalBeamOffset={phone ? -0.33 : -0.42}
      horizontalSizing={phone ? 0.42 : 0.5}
      verticalSizing={phone ? 1.7 : 2.2}
      // falloffStart is the real brightness lever — it scales the numerator of
      // the inverse-square term, so it enters squared. This sits between the
      // stock 1.2 (which blows out the copy the shaft passes behind) and a
      // token glow.
      falloffStart={phone ? 0.7 : 0.78}
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
