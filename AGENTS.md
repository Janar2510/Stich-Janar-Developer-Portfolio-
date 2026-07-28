# Agent Instructions — Janar Kuusk

> Drop this file at the root of any project to give Antigravity / Cursor / any agent
> the same persistent memory + standing rules Claude Code uses.
> Template lives at: `~/.claude/templates/AGENTS.md`

## 🧠 Persistent Memory

Brain lives in Obsidian vault:
```
/Users/janarkuusk/Claude Brain/Vault/
```

| Path | Purpose |
|---|---|
| `MOCs/Claude-Memory-MOC.md` | master index — read first |
| `Daily Notes/YYYY-MM-DD.md` | per-day session log |
| `Sessions/` | per-session archive |
| `Projects/<name>/` | per-project notes |

**If `obsidian-http-mcp` is connected:** use it to read/write the vault.
**If not:** use filesystem read/write at paths above.

### When to update memory

Append to daily note or project note when you:
- Make a non-obvious architectural decision
- Discover a recurring bug pattern
- Learn a project-specific convention not in code
- Resolve a tricky integration

Skip noisy updates (trivial edits, typos, single-line fixes).

## Active Projects

| Project | Stack |
|---|---|
| **PocketNegotiator** | Expo SDK 53 + RN + TS + Supabase + Gemini AI |
| **Maison Éclat** | Shopify (luxury) |
| **Microcement Web** | Next.js 16 |
| **Janar Kuusk Portfolio** | Next.js 16 + Tailwind v4 |
| **KUUS Design Shopify** | Shopify |
| **Loorea Jewellery** | Shopify |
| **Marketing Agency Website** | Next.js |
| **SolarAir Dynamics** | Next.js |
| **Kuus Agency Echo** | TBD |
| **Fusion AI ERP** | TBD |

## Standing Rules (all projects)

### Code
- TypeScript only — no plain JS
- RN styling: `StyleSheet` + `useTheme()` — never hardcoded colors
- Path alias: `@/*` maps to repo root — no relative imports
- AI calls: route through Supabase Edge Functions — never client-direct
- Streaming: `lib/streaming.ts` → `fetchEdgeFunctionStream()`
- Icons: `lucide-react-native`
- i18n: `t('key')` in `LanguageContext.tsx` (11 langs) — never hardcode strings
- Animations: `react-native-reanimated` 3

### Supabase
- Edge Functions on Deno — validate JWT from `Authorization` header first
- New tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policy on `auth.uid() = user_id`
- New tables: extend `Database` type in `lib/supabase.ts`

### Git
- Never commit to `main` — branch + PR
- Never commit secrets / `.env`
- Use specific file names with `git add`, not `git add .`

### File org
- Never save to root — use `/src /tests /docs /config /scripts /examples`
- Read before edit
- Edit existing > create new
- Never create .md/README unless asked

### Behavior
- Do what was asked — nothing more, nothing less
- Don't ask for confirmation on small tasks — do + report
- For complex tasks: batch ALL related ops in one message (file reads, edits, bash, todos)

## Tooling References

- **claude-mem** worker indexes transcripts globally → `claude-mem search <query>`
- **Obsidian vault MOC:** `/Users/janarkuusk/Claude Brain/Vault/MOCs/Claude-Memory-MOC.md`
- **Global CLAUDE.md:** `~/.claude/CLAUDE.md`

## Personal Font Library

Pick from these before defaulting to Google Fonts:
Osure, Galiath, Antar Bintang, Margoe, Boower, Glavoire, Weliona, Aurelis, Nexed, Futuristics Meicre, Corpta, Polea, Nerlios, Xirod, Montage, Basote, Francy, Lunery, Osiris, Neo Folia, Bierika.

Reference: `/Users/janarkuusk/Claude Brain/Vault/Resources/Fonts.md`
