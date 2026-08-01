# Google Search Console Visibility Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repoint every SEO URL the site emits from the dead domain `janarkuusk.com` to the live domain `https://www.janarkuuskpro.com`, emit a per-locale sitemap with correct hreflang, and resubmit it to Google Search Console so all 22 pages become indexable.

**Architecture:** A single `src/lib/site.ts` module becomes the one source of truth for the site origin — mirroring the existing `src/i18n/config.ts` "single source of truth" pattern. All 14 files that currently hardcode `const BASE_URL = "https://janarkuusk.com"` import from it instead. `sitemap.ts` is rewritten to emit one `<url>` entry per locale per route (Google's documented requirement) instead of only default-locale entries, each carrying a complete alternate set including `x-default`. Then GSC is driven via the `gscServer` MCP: resubmit sitemap, verify canonicals resolve.

**Tech Stack:** Next.js 16 App Router, TypeScript, `MetadataRoute.Sitemap` / `MetadataRoute.Robots`, Vercel, Google Search Console API via `gscServer` MCP.

## Diagnosis (evidence gathered before planning)

| Check | Result |
|---|---|
| `curl https://janarkuusk.com/` | `000` — domain does not resolve. Dead. |
| `curl https://janarkuuskpro.com/` | `308` → `https://www.janarkuuskpro.com/` |
| `curl https://www.janarkuuskpro.com/` | `307` → `/et` |
| GSC properties | `sc-domain:janarkuuskpro.com` (siteOwner). No property for `janarkuusk.com`. |
| Live `robots.txt` | `Sitemap: https://janarkuusk.com/sitemap.xml` — points at dead domain |
| Live `sitemap.xml` | 11 `<loc>` entries, **all** on `https://janarkuusk.com` |
| GSC sitemap status | `Valid`, 0 errors, **3 indexed URLs** out of 11 submitted |
| URL inspection `/et` | `user_canonical: https://janarkuusk.com/et` vs `google_canonical: https://www.janarkuuskpro.com/et` — **Google is overriding the declared canonical** |
| Live `<head>` on `/et` | `canonical`, all `hreflang`, and `og:url` all point to `janarkuusk.com` |
| 28-day search analytics | 3 pages with any impressions: `/` (5 clicks / 38 impr), `/en/ai-assessment` (1 impr), `/testimonials` (4 impr, stale URL, now 307) |

**Root cause:** every canonical, hreflang, `og:url`, JSON-LD `url`, `metadataBase`, sitemap `<loc>`, and the `robots.txt` sitemap directive resolve to a domain that does not exist. Google indexed the site anyway by ignoring the site's own signals — which is why only 3 of 22 pages surface and rankings are near-invisible.

## Global Constraints

- Live origin is **`https://www.janarkuuskpro.com`** — with `www`, no trailing slash. The apex 308-redirects to `www`, so `www` is the canonical host.
- Locales are `["et", "en"]`, default `et` — import from `@/i18n/config`, never redeclare.
- Path alias is `@/*` → `src/*`. No relative imports across directories.
- TypeScript only. No new dependencies.
- The repo has **no test framework** (`package.json` scripts: `dev`, `build`, `start`, `lint`). Verification is `npx tsc --noEmit`, `npm run build`, and asserting on generated output in `.next/server/app/` — not unit tests.
- Never commit to `main` — branch first.
- Never commit `.env.local` or secrets.
- Port 3000 is permanently occupied by an Obsidian MCP process on this machine — dev server must use **port 3100**.

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/site.ts` | Single source of truth for site origin + URL builder | **Create** |
| `src/app/sitemap.ts` | Per-locale sitemap with full hreflang alternates | **Rewrite** |
| `src/app/robots.ts` | robots.txt + sitemap directive | Modify |
| `src/app/[lang]/layout.tsx` | `metadataBase`, root canonical, Person JSON-LD `url` | Modify |
| `src/app/[lang]/page.tsx` | Home canonical/OG | Modify |
| `src/app/[lang]/about/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/services/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/portfolio/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/tools/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/contact/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/privacy/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/ai-assessment/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/roi-calculator/page.tsx` | Page canonical/OG | Modify |
| `src/app/[lang]/blog/page.tsx` | Blog index canonical/OG | Modify |
| `src/app/[lang]/blog/[slug]/page.tsx` | Post canonical/OG + BlogPosting JSON-LD | Modify |

---

### Task 1: Single source of truth for the site origin

**Files:**
- Create: `src/lib/site.ts`
- Verify: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `locales`, `defaultLocale`, `Locale` from `@/i18n/config`
- Produces:
  - `export const SITE_URL: "https://www.janarkuuskpro.com"` — origin, no trailing slash
  - `export function localeUrl(lang: Locale, path?: string): string` — `localeUrl("et", "/about")` → `"https://www.janarkuuskpro.com/et/about"`; `localeUrl("et")` → `"https://www.janarkuuskpro.com/et"`
  - `export function languageAlternates(path?: string): Record<string, string>` — returns `{ et, en, "x-default" }`, where `x-default` maps to the `defaultLocale` URL

- [ ] **Step 1: Create the module**

```typescript
// src/lib/site.ts
// Single source of truth for this site's public origin. Import this everywhere —
// never hardcode the domain in a page, sitemap, or JSON-LD block.
//
// The apex (janarkuuskpro.com) 308-redirects to www, so www is the canonical
// host. Anything that ships a URL to Google must be built from here.
import { locales, defaultLocale, type Locale } from "@/i18n/config";

export const SITE_URL = "https://www.janarkuuskpro.com";

/** Absolute URL for a locale-prefixed route. `path` starts with "/" or is empty. */
export function localeUrl(lang: Locale, path = ""): string {
  return `${SITE_URL}/${lang}${path}`;
}

/** hreflang map for a route, including x-default pointing at the default locale. */
export function languageAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localeUrl(locale, path)])),
    "x-default": localeUrl(defaultLocale, path),
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/site.ts
git commit -m "Add single source of truth for the site origin"
```

---

### Task 2: Rewrite the sitemap for per-locale entries

**Files:**
- Modify: `src/app/sitemap.ts` (full rewrite, currently 31 lines)
- Verify: `npm run build` then read `.next/server/app/sitemap.xml.body`

**Interfaces:**
- Consumes: `SITE_URL`, `localeUrl`, `languageAlternates` from `@/lib/site` (Task 1); `locales` from `@/i18n/config`; `getAllPostSlugs` from `@/lib/blog`
- Produces: a sitemap with `locales.length × (routes.length + posts.length)` = `2 × (10 + 1)` = **22 `<url>` entries**

**Why the change:** the current version emits only `defaultLocale` URLs (11 entries) and relies on `xhtml:link` alternates to advertise the English versions. Google's hreflang documentation requires each language version to be listed as its own `<url>` entry with the complete alternate set. Emitting only the Estonian URLs leaves the English pages undiscoverable from the sitemap. The current version also omits `x-default` entirely.

- [ ] **Step 1: Replace the file contents**

```typescript
import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, localeUrl } from "@/lib/site";
import { getAllPostSlugs } from "@/lib/blog";

const routes = ["", "/about", "/services", "/portfolio", "/tools", "/roi-calculator", "/ai-assessment", "/contact", "/privacy", "/blog"];

function priorityFor(route: string): number {
  if (route === "") return 1;
  if (route === "/privacy") return 0.3;
  return 0.7;
}

function changeFrequencyFor(route: string): "weekly" | "monthly" | "yearly" {
  if (route === "") return "weekly";
  if (route === "/privacy") return "yearly";
  return "monthly";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Every language version gets its own <url> entry carrying the full alternate
  // set — listing only the default locale hides the other locale from Google.
  const staticEntries: MetadataRoute.Sitemap = routes.flatMap((route) =>
    locales.map((lang) => ({
      url: localeUrl(lang, route),
      lastModified,
      changeFrequency: changeFrequencyFor(route),
      priority: priorityFor(route),
      alternates: { languages: languageAlternates(route) },
    })),
  );

  const postEntries: MetadataRoute.Sitemap = getAllPostSlugs().flatMap((slug) =>
    locales.map((lang) => ({
      url: localeUrl(lang, `/blog/${slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(`/blog/${slug}`) },
    })),
  );

  return [...staticEntries, ...postEntries];
}
```

- [ ] **Step 2: Build and inspect the generated sitemap**

```bash
npm run build
cat .next/server/app/sitemap.xml.body | grep -c "<loc>"
cat .next/server/app/sitemap.xml.body | grep -c "janarkuusk\.com/" 
cat .next/server/app/sitemap.xml.body | grep -c "x-default"
```

Expected:
- `<loc>` count: **22**
- `janarkuusk.com/` (the dead bare domain, note the escaped dot and required trailing slash) count: **0**
- `x-default` count: **22**

If the build output path differs, find it with `find .next -name "sitemap*" -type f`.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "Emit per-locale sitemap entries with x-default hreflang"
```

---

### Task 3: Repoint robots.txt and the root layout

**Files:**
- Modify: `src/app/robots.ts:3` and `:12`
- Modify: `src/app/[lang]/layout.tsx:36` (the `BASE_URL` const), plus its uses at `:45` (Person schema `url`), `:66` (`metadataBase`), `:79` (`og:url`), `:82-86` (`alternates`)

**Interfaces:**
- Consumes: `SITE_URL`, `localeUrl`, `languageAlternates` from `@/lib/site` (Task 1)
- Produces: nothing new — these are leaf consumers.

- [ ] **Step 1: Rewrite `src/app/robots.ts`**

```typescript
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: In `src/app/[lang]/layout.tsx`, delete the local const and import instead**

Delete this line (currently line 36):

```typescript
const BASE_URL = "https://janarkuusk.com";
```

Add to the import block near `import { locales, defaultLocale, isLocale, type Locale } from "@/i18n/config";`:

```typescript
import { SITE_URL, localeUrl, languageAlternates } from "@/lib/site";
```

In `PERSON_SCHEMA`, change `url: BASE_URL,` to:

```typescript
  url: SITE_URL,
```

In `generateMetadata`, change `metadataBase: new URL(BASE_URL),` to:

```typescript
    metadataBase: new URL(SITE_URL),
```

Change the `openGraph.url` line from `url: \`${BASE_URL}/${lang}\`,` to:

```typescript
      url: localeUrl(lang),
```

Replace the whole `alternates` block with:

```typescript
    alternates: {
      canonical: localeUrl(lang),
      languages: languageAlternates(),
    },
```

- [ ] **Step 3: Verify no `BASE_URL` reference survives in these two files**

```bash
grep -n "BASE_URL\|janarkuusk\.com" src/app/robots.ts "src/app/[lang]/layout.tsx"
```

Expected: no output.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/robots.ts "src/app/[lang]/layout.tsx"
git commit -m "Point robots.txt and root metadata at the live domain"
```

---

### Task 4: Repoint the eleven page-level metadata files

**Files (each has one `const BASE_URL = "https://janarkuusk.com";` to remove):**
- Modify: `src/app/[lang]/page.tsx:12`
- Modify: `src/app/[lang]/about/page.tsx:9`
- Modify: `src/app/[lang]/services/page.tsx:10`
- Modify: `src/app/[lang]/portfolio/page.tsx:9`
- Modify: `src/app/[lang]/tools/page.tsx:8`
- Modify: `src/app/[lang]/contact/page.tsx:10`
- Modify: `src/app/[lang]/privacy/page.tsx:6`
- Modify: `src/app/[lang]/ai-assessment/page.tsx:6`
- Modify: `src/app/[lang]/roi-calculator/page.tsx:6`
- Modify: `src/app/[lang]/blog/page.tsx:10`
- Modify: `src/app/[lang]/blog/[slug]/page.tsx:11`

**Interfaces:**
- Consumes: `SITE_URL`, `localeUrl`, `languageAlternates` from `@/lib/site` (Task 1)
- Produces: nothing new — leaf consumers.

**Method:** these files each build canonicals as template literals off their local `BASE_URL`. Do **not** blind-replace the domain string — that would leave eleven duplicated constants, which is the defect that made this bug possible. Delete each local const and rewrite its call sites through the helpers.

- [ ] **Step 1: Read each file's metadata block before editing it**

```bash
grep -n "BASE_URL" src/app/\[lang\]/*/page.tsx src/app/\[lang\]/page.tsx src/app/\[lang\]/blog/\[slug\]/page.tsx
```

This prints every call site. Read each file around those lines so the rewrite matches the file's actual shape — the pages differ (`blog/[slug]/page.tsx` also feeds a `BlogPosting` JSON-LD block at line 58).

- [ ] **Step 2: In each file, remove the const and add the import**

Remove:

```typescript
const BASE_URL = "https://janarkuusk.com";
```

Add alongside the file's existing `@/i18n/config` import (import only the helpers that file actually uses):

```typescript
import { localeUrl, languageAlternates } from "@/lib/site";
```

- [ ] **Step 3: Rewrite each call site**

Apply these substitutions, where `<path>` is that page's route segment (`"/about"`, `"/services"`, `"/portfolio"`, `"/tools"`, `"/contact"`, `"/privacy"`, `"/ai-assessment"`, `"/roi-calculator"`, `"/blog"`, `` `/blog/${slug}` ``, and `""` for `src/app/[lang]/page.tsx`):

```typescript
// before → after
`${BASE_URL}/${lang}<path>`                                  →  localeUrl(lang, "<path>")
canonical: `${BASE_URL}/${lang}<path>`                       →  canonical: localeUrl(lang, "<path>")
url: `${BASE_URL}/${lang}<path>`                             →  url: localeUrl(lang, "<path>")
languages: Object.fromEntries(locales.map(...))              →  languages: languageAlternates("<path>")
```

For `src/app/[lang]/blog/[slug]/page.tsx`, the JSON-LD `url`/`mainEntityOfPage` field also uses `BASE_URL` — route it through `` localeUrl(lang, `/blog/${slug}`) `` too. If that file imports `SITE_URL` for an image or publisher URL, import `SITE_URL` as well.

- [ ] **Step 4: Verify the dead domain is gone from the entire source tree**

```bash
grep -rn "janarkuusk\.com" src/ --include="*.ts" --include="*.tsx" --include="*.json"
```

Expected: **no output.** Note this pattern deliberately does not match `janarkuuskpro.com`, which legitimately appears as the contact email `info@janarkuuskpro.com` in `src/i18n/dictionaries/{et,en}.json` and several pages — those are correct and must not be touched.

Then confirm no stray local constant survives:

```bash
grep -rn "const BASE_URL" src/
```

Expected: no output.

- [ ] **Step 5: Type-check and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: `tsc` exit 0. Build completes with 30 routes, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app
git commit -m "Route every page canonical through the shared site origin"
```

---

### Task 5: Verify the rendered output locally

**Files:**
- Modify: none. This task is verification only.

**Interfaces:**
- Consumes: the built output from Task 4.
- Produces: a go/no-go signal for deployment.

- [ ] **Step 1: Start the production server on port 3100**

```bash
npm run build && npx next start -p 3100
```

Port 3000 is occupied by an unrelated Obsidian MCP process on this machine — 3100 is the project's established dev port.

- [ ] **Step 2: Assert the sitemap is correct**

```bash
curl -s http://localhost:3100/sitemap.xml | grep -c "<loc>"
curl -s http://localhost:3100/sitemap.xml | grep -c "www\.janarkuuskpro\.com"
curl -s http://localhost:3100/sitemap.xml | grep "janarkuusk\.com/" | grep -v "janarkuuskpro" | wc -l
```

Expected: `22`, then a count ≥ `22`, then **`0`**.

- [ ] **Step 3: Assert robots.txt is correct**

```bash
curl -s http://localhost:3100/robots.txt
```

Expected to contain exactly: `Sitemap: https://www.janarkuuskpro.com/sitemap.xml`

- [ ] **Step 4: Assert canonicals and hreflang on both locales**

```bash
for u in /et /en /et/about /en/blog; do
  echo "--- $u"
  curl -s "http://localhost:3100$u" | grep -oE '<link rel="canonical"[^>]*>|hrefLang="[a-z-]+" href="[^"]*"'
done
```

Expected: every `href` on `https://www.janarkuuskpro.com`, each page carrying `et`, `en`, and `x-default` alternates, and the canonical matching the page's own locale and path.

- [ ] **Step 5: Stop the server**

```bash
# Ctrl-C the next start process, or:
lsof -ti:3100 | xargs kill
```

- [ ] **Step 6: Commit (nothing to commit if verification passed cleanly)**

No code change in this task. If any assertion failed, fix it in the owning task's file and re-run this task before proceeding.

---

### Task 6: Deploy to production

**Files:**
- Modify: none.

**Interfaces:**
- Consumes: the verified commits from Tasks 1–4.
- Produces: a live deployment serving the corrected sitemap — Task 7 cannot start until Google can fetch it.

- [ ] **Step 1: Push the branch and open a PR**

```bash
git push -u origin fix/gsc-canonical-domain
gh pr create --title "Fix canonical domain: janarkuusk.com is dead, live site is www.janarkuuskpro.com" --body "$(cat <<'EOF'
## Problem

Every canonical, hreflang, og:url, JSON-LD url, metadataBase, sitemap <loc>, and the
robots.txt Sitemap directive pointed at `https://janarkuusk.com` — a domain that does
not resolve (curl returns 000). The live site is `https://www.janarkuuskpro.com`.

Google Search Console confirms the damage: URL inspection on `/et` reports
`user_canonical: https://janarkuusk.com/et` against
`google_canonical: https://www.janarkuuskpro.com/et`. Google is overriding the site's
own canonical because the declared one is unreachable. The submitted sitemap shows
3 indexed URLs out of 11, and 28-day search analytics shows impressions on only
3 pages.

## Fix

- New `src/lib/site.ts` is the single source of truth for the origin, mirroring the
  existing `src/i18n/config.ts` pattern. The domain was previously duplicated across
  14 files, which is what allowed it to go stale everywhere at once.
- All 14 files now build URLs through `localeUrl()` / `languageAlternates()`.
- `sitemap.ts` now emits one entry per locale per route (22 URLs, up from 11) with a
  complete alternate set including `x-default`. Previously only Estonian URLs were
  listed, leaving the English pages undiscoverable from the sitemap.

## Verification

- `npx tsc --noEmit` clean
- `npm run build` clean, 30 routes
- `grep -rn "janarkuusk\.com" src/` returns nothing (the `janarkuuskpro.com` contact
  email is untouched)
- Local production server: sitemap has 22 `<loc>`, 0 on the dead domain; canonicals
  and hreflang on `/et`, `/en`, `/et/about`, `/en/blog` all resolve to the live origin

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Merge and wait for the Vercel deployment**

Merge the PR, then poll until the live sitemap reflects the change:

```bash
curl -s https://www.janarkuuskpro.com/sitemap.xml | grep -c "<loc>"
curl -s https://www.janarkuuskpro.com/robots.txt
```

Expected: `22`, and the robots Sitemap line on `www.janarkuuskpro.com`.

Safari caches aggressively — use `curl` for verification, not a browser.

- [ ] **Step 3: Confirm the live canonical**

```bash
curl -s https://www.janarkuuskpro.com/et | grep -oE '<link rel="canonical"[^>]*>'
```

Expected: `<link rel="canonical" href="https://www.janarkuuskpro.com/et"/>`

**Do not start Task 7 until this returns the corrected value** — resubmitting the sitemap before deployment just re-registers the broken one.

---

### Task 7: Resubmit to Google Search Console

**Files:**
- Modify: none. This task drives the `gscServer` MCP.

**Interfaces:**
- Consumes: the live corrected sitemap from Task 6.
- Produces: a resubmitted sitemap and a baseline indexing report.

**Property:** `sc-domain:janarkuuskpro.com` (domain property — covers apex and `www`).

- [ ] **Step 1: Resubmit the sitemap**

Call `mcp__gscServer__submit_sitemap` with:
- `site_url`: `sc-domain:janarkuuskpro.com`
- `sitemap_url`: `https://www.janarkuuskpro.com/sitemap.xml`

Resubmitting the same path is intentional — it forces Google to re-fetch rather than serve its cached 2025-12-26 copy.

- [ ] **Step 2: Confirm the resubmission registered**

Call `mcp__gscServer__get_sitemaps` with `site_url: sc-domain:janarkuuskpro.com`.

Expected: `status: Valid`, `errors: 0`, and a `last_downloaded` timestamp of today. The `indexed_urls` count will still read low immediately — Google reindexes over days, not minutes. That is expected, not a failure.

- [ ] **Step 3: Request indexing signal on the highest-value URLs**

Call `mcp__gscServer__inspect_url_enhanced` for each, with `site_url: sc-domain:janarkuuskpro.com`:

```
https://www.janarkuuskpro.com/et
https://www.janarkuuskpro.com/en
https://www.janarkuuskpro.com/et/services
https://www.janarkuuskpro.com/en/services
https://www.janarkuuskpro.com/et/portfolio
https://www.janarkuuskpro.com/en/portfolio
```

Record `coverage_state`, `user_canonical`, and `google_canonical` for each.

**Success criterion:** `user_canonical == google_canonical` for every URL. Before this fix they disagreed on every page. If they still disagree, the deployment has not propagated — re-check Task 6 Step 3.

Note: `inspect_url_enhanced` reports status; it does not queue a crawl. The API has no "request indexing" method — if a page needs manual submission, do it in the GSC web UI.

- [ ] **Step 4: Check for indexing problems across the property**

Call `mcp__gscServer__check_indexing_issues` with `site_url: sc-domain:janarkuuskpro.com` and the six URLs above.

Expected: no `robots.txt` blocks, no `noindex`, no fetch failures.

- [ ] **Step 5: Record the pre-fix baseline for later comparison**

Call `mcp__gscServer__get_search_analytics` with `site_url: sc-domain:janarkuuskpro.com`, `days: 28`, `dimensions: "page"`, `row_limit: 50`.

Save the output to `docs/superpowers/plans/2026-08-01-gsc-baseline.json`. Today's numbers are the pre-fix baseline: 3 pages with impressions, 5 total clicks, 43 total impressions. Re-run in 14 and 28 days to measure whether the fix worked.

- [ ] **Step 6: Note the stale URL for follow-up**

`https://www.janarkuuskpro.com/testimonials` has 4 impressions at position 5.2 but now returns `307`. It is a leftover from a previous version of the site and is not in the sitemap. This is out of scope for this plan — it needs a decision (301 to a real page, or let it drop out). Record it; do not fix it here.

---

## Out of Scope

Deliberately excluded from this plan — each is a separate piece of work:

- The stale `/testimonials` URL (Task 7 Step 6) — needs a redirect decision.
- Adding a GSC property for `janarkuusk.com` — pointless, the domain does not resolve.
- Content or keyword work. This plan fixes a technical blocker only; it makes the site indexable, it does not make it rank.
- Schema expansion beyond the existing `Person` and `BlogPosting` blocks.
- The `seo-geo@skills-dir` plugin currently failing to load (`path is a file; skills entries must be directories containing SKILL.md`) — unrelated tooling bug.
