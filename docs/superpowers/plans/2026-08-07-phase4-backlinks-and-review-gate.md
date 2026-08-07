# Phase 4 Backlinks + Sep 7 Review Gate — Step-by-Step

Written 2026-08-07. These are the two items called out as still-open at the end of
`2026-08-07-google-ranking-plan.md`. Both are hands-on: GBP and the Sep 7 gate need
Janar's own accounts/access; the client-site credits need per-client repo access,
which is only partially available from this machine (checked below).

---

## Part A — Google Business Profile setup

The domain has effectively zero backlinks and no local-search presence. GBP is the
single highest-leverage, lowest-cost item in the whole ranking plan — it directly
unlocks `kodulehe tegemine tartu`-class queries that nothing else on this list touches.

### A1. Create / claim the profile

1. Go to business.google.com, sign in with the Google account tied to
   `info@janarkuuskpro.com`.
2. Business name: **`Janar Kuusk`** — exactly this, or the legal OÜ name if
   registered. Do not add keywords to the name ("Janar Kuusk Web Design Tartu")
   — this is the single most common cause of GBP suspension and is not fast to
   recover from.
3. Category — search the picker for these, in order:
   - Primary: **Website designer**
   - Secondary: **Software company**, **Computer consultant**, **Graphic designer**
   Availability varies by country; check "mobile app" too, but don't force a category
   that isn't offered.
4. Phone: `+372 5610 3001`
5. Website: `https://www.janarkuuskpro.com/et?utm_source=gbp&utm_medium=organic`
   — the UTM tag means Plausible will show GBP-attributed traffic separately from
   direct traffic. Without it you can't measure whether GBP is working.

### A2. Address and verification

1. Enter a real address to get verified (home address is fine — Google requires
   *something* real to mail a verification code to).
2. Once entered, tick **"I deliver goods and services to my customers"** — this
   converts the listing to a service-area business and hides the street address
   from public view. You get verified without a public storefront address.
3. **Service areas: Estonian regions only.** Tartu, Tartu County, Tallinn, Harju
   County, Pärnu, Viljandi, Jõgeva — 7ish entries, don't exceed ~10. Do **not**
   list "European Union" or "United States" as service areas — GBP service areas
   are meant to be places you could plausibly travel to for a job; claiming EU/US
   reach here reads as fake to Google and risks the listing being suppressed or
   pulled. Your actual EU/US client reach is already correctly expressed in the
   site's own schema (`AREA_SERVED` in `src/lib/schema.ts`) — that's the right
   place for that claim, GBP is not.
4. Complete verification (postcard code by mail, or phone/email if Google offers
   it for this account — varies).

### A3. Hours — blocked on one fact from Janar

**Still needed: your actual weekday opening/closing times.** The site's schema
currently asserts 09:00–17:00 Mon–Fri as a placeholder (flagged as an assumption
in `src/lib/schema.ts` since it was written). Once GBP is live, its hours and the
site's schema must agree — a mismatch between GBP and on-site schema is a
trust signal working against you, not neutral.

**Action:** reply with real hours (e.g. "09:00–18:00" or whatever they are), and
I'll update `OPENING_HOURS` in `src/lib/schema.ts` to match in one small PR.

### A4. Business description (750 char max)

Use the two drafts already written earlier in this project (ET + EN, both under
750 characters, covering: what you build, that you work solo, the €500 entry
price, location + remote scope, contact). Paste as-is into the GBP description
field — Estonian as primary if GBP lets you set one description (GBP only
supports one description per listing, not per-language, so lead with Estonian
since that's the primary market this listing targets).

### A5. Services tab

Add four service line items, one per landing page now live on the site — reuse
the short descriptions from `src/i18n/dictionaries/et.json` → `servicePages`:

| GBP service name | Price | Description source |
|---|---|---|
| Veebidisain | Alates 500 € | `servicePages.kodulehe-tegemine.priceNote` |
| Veebirakenduste arendus | — | `servicePages.veebirakendused.intro` |
| Mobiilirakenduste arendus | — | `servicePages.mobiilirakendused.intro` |
| AI arendus | — | `servicePages.ai-arendus.intro` |

### A6. Products tab (one entry, makes the price visible in the listing)

- Name: Veebileht / Website
- Price: Alates 500 € / From €500
- Description: one sentence, pull from `servicePages.kodulehe-tegemine.seo.description`
- Link the product to `https://www.janarkuuskpro.com/et/services/kodulehe-tegemine`
  — this landing page exists now (shipped in PR #9), so the product tile has
  somewhere real and relevant to send clicks.

### A7. Q&A — seed it yourself

Post these as the business owner, then answer them from the same account (GBP
allows self-seeded Q&A and it fills space competitors otherwise leave empty):

- Kas töötad ka väljaspool Tartut? → Jah, üle Eesti, kaugtööna.
- Kui palju veebileht maksab? → Alates 500 eurost, sõltub mahust.
- Mis keeles saab suhelda? → Eesti ja inglise keeles.
- Kui kaua kodulehe tegemine aega võtab? → Lihtsam leht paari nädalaga.

### A8. Photos (10+ minimum — this is where listings usually fail)

- Profile photo: headshot (you *are* the business).
- Cover: the wordmark logo (`public/images/Logo/wordmark.png` — already on brand,
  reuse it, don't create a new asset).
- 6–8 work screenshots: Biopuhastid, Loorea, KUUS Design.
- 1–2 "you working" photos, phone-quality is fine.
- Refresh with one new photo monthly — stale photo count is a known ranking drag.

### A9. Posts — one every 2–3 weeks (drafted, ready to paste)

1. `Veebileht 500 eurost. Disain ja arendus ühelt inimeselt, ilma agentuuri lisatasuta. Vaata tehtud töid: janarkuuskpro.com`
2. `Enamik ettevõtteid ei vaja AI strateegiat. Nad vajavad ühte automatiseeritud protsessi, mis praegu sööb tunde. Alustame sellest.`
3. `Tegin AI valmiduse hindamise tööriista. Tasuta, viis minutit, ütleb kus AI su ettevõttes tegelikult aitaks. janarkuuskpro.com/et/ai-assessment`
4. `ROI kalkulaator näitab, kas tarkvarainvesteering tasub ära, enne kui midagi ehitad. Tasuta ja ilma registreerimiseta.`

Posts 3 and 4 point at existing tools, not generic marketing — better click reason.

### A10. First reviews

Ask the **three most recent clients** for a review, send the direct GBP review
link (not "search for us on Google"). Reviews are the largest single local-ranking
factor and the listing launches with zero. Reply to every review, positive or not.

### A11. NAP consistency check (do this last, once GBP is live)

Confirm phone `+372 5610 3001`, "Tartu", and `janarkuuskpro.com` match exactly
across: LinkedIn contact info, GitHub profile bio, and the GBP listing itself.
Inconsistent NAP across sources is a documented drag on local ranking.

**Owner: Janar. Nothing in A1–A11 is something I can do — no GBP write access
from this session.**

---

## Part B — Client-site backlink credits

Three legitimate, relevant backlinks from real sites Janar built — cheapest
authority signal available, higher trust than any directory listing.

### Repo access check (done 2026-08-07)

| Client | Local repo found | Notes |
|---|---|---|
| Biopuhastid (Kingspan Eesti BIO) | `/Users/janarkuusk/kingspan-eesti-bio` | Vite/React app, has its own CLAUDE.md/PRODUCT.md — real project |
| Loorea Jewellery | `/Users/janarkuusk/Loorea-Jewellery`, plus `Loorea Jewellery web`, `LOOREA SHOP` | Multiple directories exist — unclear which is the live production site without opening them |
| KUUS Design | none found | Appears to be Shopify-hosted with no local theme repo on this machine — editable only via Shopify admin / theme editor |

I have not opened or modified any of these — they're separate businesses' live
production sites, and touching one needs an explicit go-ahead scoped to that
site specifically, the same way work on this portfolio needed sign-off each PR.

### B1. Decide the credit format (Janar's call, pick one)

- **Footer line:** `Koduleht: Janar Kuusk` or `Web design by Janar Kuusk`, linking
  to `https://www.janarkuuskpro.com`, on every page (footer = site-wide link).
- **"Credits" or "About" mention:** one line on an about/impressum page instead of
  every page — less SEO value (fewer pages linking) but less visually intrusive
  if the client prefers a quieter footer.
- Recommendation: footer, dofollow (no `rel="nofollow"`), since these are genuine
  vendor-credit links, not paid placements — nothing to disclose or suppress.

### B2. Per-client steps

**Biopuhastid — I can likely do this directly, once you confirm:**
1. Open `/Users/janarkuusk/kingspan-eesti-bio`, locate the footer component.
2. Add the credit line + link, matching that site's existing footer style (not
   this portfolio's — each site keeps its own design language).
3. Verify the site's own build/deploy process, test, ship per that repo's own
   conventions (its CLAUDE.md likely documents this — read it first).
4. **This needs your explicit go-ahead before I touch that repo** — it's a
   separate business's live site, not this one.

**Loorea Jewellery — needs clarification first:**
1. Three local directories exist for this client; unclear which is the deployed
   site without opening each one. Tell me which is live, or I'll check when asked
   to proceed.
2. Same footer-credit approach once the right repo is identified.

**KUUS Design — no code access, needs Shopify admin:**
1. Log into the KUUS Design Shopify admin.
2. Online Store → Themes → Edit code → find the footer section/snippet (theme-
   dependent, commonly `sections/footer.liquid`).
3. Add the credit line + link inside the existing footer markup, matching that
   theme's HTML/CSS conventions.
4. If you'd rather I do this: get me theme edit access (Shopify collaborator
   request, or temporary staff account) and point me at it — same "explicit
   go-ahead for a separate live site" rule applies.

### B3. Verify each link once live

For each client site, after the credit ships:

```bash
curl -s https://<client-domain>/ | grep -o 'href="https://www.janarkuuskpro.com[^"]*"'
```

Confirm it resolves (not a typo'd domain), and confirms `rel` attribute is absent
or explicitly not `nofollow`.

### B4. Sequencing

Ask the two client sites you're most confident will say yes first (per your
earlier read, "two of three are near-certain yeses") — don't block on KUUS Design
if it needs more back-and-forth on Shopify access.

**Owner: mostly Janar (client conversations, access decisions). I can execute the
actual footer edit once (a) a specific client explicitly authorizes it and
(b) I know which repo is the real deployed site.**

---

## Part C — September 7 review gate

This is the first scheduled checkpoint from the ranking plan. Purpose: confirm
whether the technical + content work (PRs #1, #2, #8, #9) produced the first
non-branded search visibility, or whether the diagnosis needs to shift toward
authority (Part A/B above) before writing more content.

### C1. What to run (via the `gscServer` MCP tools, same as used throughout this project)

```
mcp__gscServer__get_search_analytics
  site_url: sc-domain:janarkuuskpro.com
  days: 28
  dimensions: query
  row_limit: 50
```

```
mcp__gscServer__get_search_analytics
  site_url: sc-domain:janarkuuskpro.com
  days: 28
  dimensions: page
  row_limit: 30
```

```
mcp__gscServer__get_sitemaps
  site_url: sc-domain:janarkuuskpro.com
```

### C2. What to compare against

Baseline file: `docs/superpowers/plans/2026-08-01-gsc-baseline.json`

| Metric | 2026-08-01 baseline | 2026-08-07 (post PR #8) | Sep 7 target |
|---|---|---|---|
| Non-branded queries | 0 | 0 | **> 0** — this is the actual pass/fail signal |
| Branded query position (`janar kuusk`) | 2.6 | 2.6 | holds ≥ current — must not regress while chasing new queries |
| Sitemap indexed URLs | 3 of 11 | 22 of 22 | 30+ of 32 (landing pages + blog post need time to index) |
| Pages with impressions | 3 | 7 (7-day) | 10+ |

### C3. Decision tree

**If non-branded impressions > 0, even at position 40–90:** on track. Continue
Phase 3 (the remaining 5 blog posts from the ranking plan) on schedule. No
change needed.

**If non-branded impressions are still 0 AND Part A (GBP) + Part B (backlinks)
are NOT done by Sep 7:** not a surprise, not a failure — do Parts A and B before
writing more content. Four weeks is genuinely too fast for a zero-authority
domain to rank on content alone; this was flagged in the original ranking plan.

**If non-branded impressions are still 0 AND Parts A + B ARE done:** re-open the
diagnosis. Check `check_indexing_issues` on the 4 new landing pages specifically
— possible causes at that point: pages indexed but not yet ranked (most likely,
just needs more time), a content-quality signal Google is discounting, or a
crawl issue worth inspecting page-by-page.

### C4. Record the result

Save the Sep 7 pull the same way the Aug 1 baseline was saved — a dated JSON
file in `docs/superpowers/plans/`, e.g. `2026-09-07-gsc-checkin.json`, same
shape as the baseline file, so Nov 7 has two prior points to compare against
instead of one.

**Owner: either of us. This is a 15-minute check — ask me to run it on or after
Sep 7 and I'll pull the data, compare against baseline, and tell you which branch
of C3 applies.**
