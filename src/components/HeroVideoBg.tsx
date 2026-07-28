'use client'

import { useState } from "react"
import Image from "next/image"
import MuxPlayer from "@mux/mux-player-react"

export default function HeroVideoBg({ className = "" }: { className?: string }) {
  const [videoFailed, setVideoFailed] = useState(false)

  return (
    <div className={`absolute inset-0 z-[1] pointer-events-none bg-black ${className}`}>
      {videoFailed ? (
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          className="h-full w-full opacity-60 md:opacity-80 object-cover"
        />
      ) : (
        <MuxPlayer
          playbackId="NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM"
          autoPlay="muted"
          loop
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          className="w-full h-full opacity-60 md:opacity-80 object-cover"
          style={{ "--media-object-fit": "cover" } as React.CSSProperties & { [key: `--${string}`]: string }}
        />
      )}
      {/* Extra darkness overlay to ensure text contrast and smooth gradient blend */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/50 via-black/30 to-[#0D0D0D]" />
    </div>
  )
}
