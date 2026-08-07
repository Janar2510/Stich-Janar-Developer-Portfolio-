# Google Ranking Plan — janarkuuskpro.com

Written 2026-08-07. Owner: Janar. Review dates: 2026-08-21, 2026-09-07, 2026-11-07.

## Where the site stands today

The technical layer is done and verified in Search Console:

| Metric | 2026-08-01 (baseline) | 2026-08-07 |
|---|---|---|
| Sitemap URLs indexed | 3 of 11 | **22 of 22** |
| Pages with impressions | 3 | 7 (last 7 days) |
| Canonical conflicts | 6 of 6 checked | 0 expected after recrawl |
| Non-branded queries | 0 | **0** |

That last row is the whole problem. Every impression in 28 days came from someone
typing a name: `janar kuusk` (21 impressions, position 2.6), `janar`, `janar kuus`,
one `viljar kuusk`. The site is indexable and invisible.

The reason is not a penalty and not authority alone. Until 2026-08-07 no page on
the site targeted a query anyone types. "Teenused — Janar Kuusk" tells Google the
page is about Janar Kuusk. An Estonian who needs a website searches
**kodulehe tegemine**, and that phrase appeared nowhere in a title on this site.

## What was already fixed (done, verified)

- Canonical domain repointed from dead `janarkuusk.com` (PR #1)
- Per-locale sitemap, 22 URLs, x-default hreflang (PR #1)
- `ProfessionalService` + `Person` schema with services, price, phone, hours (PR #2)
- Metadata retargeted to real queries in both locales (this branch) — titles now
  lead with *kodulehe tegemine / web developer Estonia*, descriptions carry the
  500 € entry price and the 24-hour reply promise

## Target queries

Estonian first: the market is small, competition is weak, and one developer in
Tartu can realistically own these. English second: those queries are global and
much harder; treat them as a slow burn.

### Estonian (primary)

| Query | Intent | Target page |
|---|---|---|
| kodulehe tegemine | commercial, highest volume | /et/services → later dedicated page |
| kodulehe valmistamine / kodulehtede valmistamine | commercial | same |
| kodulehe hind | commercial-investigation | blog post + services |
| veebilehe tegemine | commercial | services |
| e-poe tegemine / e-poe loomine | commercial | portfolio (Loorea) + later dedicated page |
| veebirakenduse arendus | commercial, low volume, low competition | services |
| mobiilirakenduse arendus | commercial | services |
| AI lahendused ettevõttele / tehisintellekt ettevõttes | early, almost no ET competition | /et/tools + blog |
| kodulehe tegemine tartu | local commercial | services + GBP |

### English (secondary)

| Query | Note |
|---|---|
| web developer estonia | winnable — small pool |
| next.js developer europe | portfolio-driven |
| ai integration consultant | supported by the two free tools |

## The plan

### Phase 1 — done on this branch

Metadata retarget. Nothing more to do here except watch GSC for the swap to
propagate (days, not weeks — the pages are already crawled frequently).

### Phase 2 — service landing pages (weeks 1–3, biggest lever)

One stacked /services page cannot rank for four different service queries.
Google ranks pages, not sites. Build four dedicated pages:

| URL | Head term | Must contain |
|---|---|---|
| /et/teenused/kodulehe-tegemine | kodulehe tegemine | price from 500 €, process (reuse the four About steps), 2–3 portfolio links, FAQ block |
| /et/teenused/veebirakendused | veebirakenduse arendus | stack (Next.js, TypeScript, Supabase), a case description |
| /et/teenused/mobiilirakendused | mobiilirakenduse arendus | React Native, App Store / Google Play |
| /et/teenused/ai-arendus | AI lahendused ettevõttele | links to ROI calculator and assessment — no Estonian competitor has tools like these |

Rules for each: 600–900 words of real text (not slogans), one `<h1>` carrying the
head term, `FAQPage` schema on the FAQ block, `Service` schema pointing at the
`@id` graph already in place, internal links from home, /services, and the
footer. English mirrors under /en/services/* can follow in week 4 — Estonian
ships first.

The existing /services page stays as an overview linking down to all four.

### Phase 3 — content engine (from week 2, 2 posts/month, ongoing)

The blog has one post. Long-tail Estonian queries are nearly uncontested.
First six posts, in order:

1. **Kui palju maksab koduleht 2026. aastal?** → *kodulehe hind* — price-intent
   readers are closest to buying. Honest number ranges, link to the ROI logic.
2. **Valmis­platvorm või eritellimusel koduleht — kumb valida?** → comparison
   intent (WordPress/Wix vs custom).
3. **Mida küsida enne kodulehe tellimist?** → checklist, earns links.
4. **AI juurutamine väikeettevõttes — kust alustada?** → feeds the assessment tool.
5. **E-poe loomine Eestis: platvormi valik** → Shopify experience (Loorea, KUUS).
6. **Miks su koduleht ei too kliente** → audit-style, links to services.

Every post: one target query in the title, `BlogPosting` schema (already wired),
internal link to the matching service page, both locales' hreflang (already
automatic). Write ET first; translate to EN only when the post isn't
Estonia-specific.

### Phase 4 — authority (parallel, ongoing)

The domain has effectively no backlinks. In order of effort-to-value:

1. **Google Business Profile** — copy already drafted (2026-08-01 session).
   Estonian service areas only. This alone unlocks `kodulehe tegemine tartu`.
2. **Client-site credits** — Loorea, Biopuhastid, KUUS Design are live sites
   Janar built. A footer line "Koduleht: Janar Kuusk" linking to
   janarkuuskpro.com on each is three relevant, legitimate backlinks in a day.
   Ask the clients; two of three are near-certain yeses.
3. **Profiles** — LinkedIn website field, GitHub profile URL, GitHub repo
   `Stich-Janar-Developer-Portfolio-` About link. Free, five minutes.
4. **Estonian directories** — teatmik.ee, infoatlas.ee, kontaktid.ee. NAP must
   match GBP exactly: `+372 5610 3001`, Tartu, janarkuuskpro.com.
5. **One case study pitch per quarter** to Estonian business media
   (Äripäev/Bestmarketing pick up concrete AI-ROI stories). Slow, optional,
   highest ceiling.

### Phase 5 — measure (monthly, 15 minutes)

Run in GSC (or ask Claude to pull via gscServer):

- queries, 28 days — count non-branded rows (the KPI)
- pages, 28 days — which of the four new service pages earn impressions
- compare to `docs/superpowers/plans/2026-08-01-gsc-baseline.json`

| Date | Expectation if on track |
|---|---|
| 2026-08-21 | New titles visible in SERPs; branded CTR holds ≥ 15% |
| 2026-09-07 | First non-branded impressions (long-tail, position 30–60) |
| 2026-11-07 | Non-branded clicks > 0; `kodulehe tegemine tartu` in top 20; 4 service pages + 6 posts live |
| 2027-02 | Non-branded impressions > branded; `kodulehe tegemine` top 30 |

If 2026-09-07 shows zero non-branded impressions **and** Phase 2 shipped on
time, the diagnosis changes from content to authority — reprioritise Phase 4
before writing more posts.

## What this plan deliberately does not do

- **No keyword-stuffed doorway pages** per town. One Tartu signal (GBP + schema)
  is enough; fake "kodulehe tegemine Pärnus" pages get filtered and look cheap.
- **No paid links, no directories beyond the Estonian big three.**
- **No English-first push.** `web developer estonia` is winnable later; `web
  development` globally is not a fight worth funding.
- **No daily rank checking.** Nothing here moves in under a week.
