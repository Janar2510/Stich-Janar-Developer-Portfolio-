"use client";

// The philosophy quote, rendered through WarpText.
//
// WarpText rasterises into a canvas, so the words leave the DOM. The real quote
// is kept as a visually hidden blockquote so crawlers and screen readers still
// get it. Losing it would undo the indexing work done on this site.
//
// Typography deliberately mirrors the plain blockquote this replaced: same
// family, same clamp() size, same tracking, left aligned, with the accent word
// in brand orange.

import WarpText from "@/components/WarpText";

interface PhilosophyQuoteProps {
  before: string;
  accent: string;
  after: string;
}

export default function PhilosophyQuote({ before, accent, after }: PhilosophyQuoteProps) {
  return (
    <div className="max-w-5xl">
      {/* The indexable, selectable, screen-reader copy. */}
      <blockquote className="sr-only">
        &quot;{before} {accent} {after}&quot;
      </blockquote>

      <WarpText
        text={`"${before} ${accent} ${after}"`}
        align="left"
        color="#e4e4e7"
        highlight={accent}
        highlightColor="#FF4800"
        fontFamily="var(--manrope, 'Manrope', sans-serif)"
        fontSize="clamp(28px, 4.5vw, 64px)"
        fontWeight={700}
        letterSpacing="-0.03em"
        lineHeight={1.1}
        warpStrength={0.07}
        warpScale={1.5}
        speed={0.45}
        pointerInfluence={0.36}
        pointerStrength={0.3}
        refraction={0.016}
        ripple
        decorative
        className="h-[340px] sm:h-[380px] lg:h-[420px]"
      />
    </div>
  );
}
