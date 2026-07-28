"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

const variants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      delay,
    },
  }),
};

export default function Reveal({ children, delay = 0, className, y }: RevealProps) {
  const v: Variants = y !== undefined
    ? {
        hidden: { opacity: 0, y },
        visible: (d: number) => ({
          opacity: 1, y: 0,
          transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: d },
        }),
      }
    : variants;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={delay}
      variants={v}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — animates children one after another */
export function StaggerReveal({
  children,
  className,
  stagger = 0.13,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Architectural curtain reveal — image is unveiled bottom-up on scroll.
    Pure variant child (like StaggerItem): must be nested inside a Reveal,
    whose in-view trigger propagates down. No observer of its own. */
export function ClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { clipPath: "inset(0 0 100% 0)" },
        visible: {
          clipPath: "inset(0 0 0% 0)",
          transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
