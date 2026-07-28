"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const springConfig = { stiffness: 480, damping: 30, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    // Only render on devices with a fine pointer — matches the CSS cursor:none scope
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    // Event delegation — survives route changes, no per-element listeners
    const over = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const interactive = (e.target as Element | null)?.closest?.("a, button");
      if (interactive) {
        el.style.width = "44px";
        el.style.height = "44px";
        el.style.backgroundColor = "color-mix(in srgb, var(--color-accent) 12%, transparent)";
      } else {
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.backgroundColor = "transparent";
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
    };
  }, [enabled, reducedMotion, x, y]);

  if (!enabled || reducedMotion) return null;

  return (
    <motion.div
      ref={ref}
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        width: 18,
        height: 18,
        border: "1.5px solid var(--color-accent)",
        backgroundColor: "transparent",
        transition: "width 0.15s ease, height 0.15s ease, background-color 0.12s ease",
      }}
    />
  );
}
