// Single source for the verdict palette. globals.css's --color-danger/success/warning
// and RoiReport.tsx's react-pdf styles both trace back to these three values — react-pdf
// renders outside the browser and can't consume Tailwind classes or CSS custom
// properties, so it needs its own copy, but that copy must not drift from the web one.
export const SEMANTIC_COLORS = {
  danger: "#fb7185",
  success: "#34d399",
  warning: "#fbbf24",
} as const;
