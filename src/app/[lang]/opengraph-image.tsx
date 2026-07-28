import { ImageResponse } from "next/og";
import { isLocale, defaultLocale, type Locale } from "@/i18n/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Janar Kuusk — Developer · Designer · AI Engineer";

const TAGLINE: Record<Locale, string> = {
  et: "ARENDAJA · DISAINER · AI INSENER",
  en: "DEVELOPER · DESIGNER · AI ENGINEER",
};

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : defaultLocale;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0D0D0D",
          backgroundImage: "linear-gradient(135deg, #0D0D0D 0%, #1a0f0a 100%)",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: -4,
            lineHeight: 1,
            display: "flex",
          }}
        >
          JANAR KUUSK
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 6,
            color: "#FF4800",
            display: "flex",
          }}
        >
          {TAGLINE[lang]}
        </div>
      </div>
    ),
    { ...size }
  );
}
