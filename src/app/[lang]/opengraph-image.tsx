import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

  // Satori cannot fetch over the network here, so the mark is read off disk and
  // inlined. It has to be a data URI: handing it a Node Buffer throws
  // "First argument to DataView constructor must be an ArrayBuffer".
  const wordmark = await readFile(join(process.cwd(), "public/images/Logo/wordmark.png"));
  const wordmarkSrc = `data:image/png;base64,${wordmark.toString("base64")}`;

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
        <img src={wordmarkSrc} alt="Janar Kuusk" width={700} height={196} />
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 6,
            // Light, not accent: the wordmark now carries the red, and two red
            // elements stacked leaves the card with no hierarchy.
            color: "#E2E2E2",
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
