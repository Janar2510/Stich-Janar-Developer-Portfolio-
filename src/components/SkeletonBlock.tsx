// Pulse-block loading placeholder. Shared by the ROI calculator's AI analysis and the
// AI assessment's action plan — both wait on the same /api/gemini route and previously
// each grew its own ad-hoc loading treatment (one had a skeleton, one had none at all).
export default function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-surface-high animate-pulse ${className ?? ""}`} />;
}
