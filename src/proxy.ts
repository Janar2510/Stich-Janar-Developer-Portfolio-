import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isStaticFile =
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api");

  if (isStaticFile) return NextResponse.next();

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    // 308, not the 307 default. The locale-less URL is never the canonical
    // one, and a temporary redirect keeps Google re-crawling it and listing
    // it under "Page with redirect" instead of consolidating onto /et.
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname === "/" ? "" : pathname}`, request.url),
      308
    );
  }

  return NextResponse.next();
}

export const config = {
  // Exclude API routes, Next internals, and static/public files so those
  // requests are never redirected or locale-prefixed.
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
