# Staff Console Redesign (v2)

**Status:** implemented on `arena/03b7f65b-laundry-app` · **Scope:** presentation layer only — no database schema, RPC or permission change.

---

## 1. Why this pass exists

The staff console grew feature by feature: each page carried its own hard-coded
hex values, its own button, its own "loading" spinner and its own idea of what a
status chip looks like. Nothing was broken, but nothing looked like one product
either — a decline was red in one queue, amber in another, and the shell
(sidebar, topbar) fought the pages underneath it.

This redesign gives the console **one vocabulary**: tokens for colour, space,
radius, elevation and motion, plus a small component library every screen can
compose from. The information architecture was reviewed at the same time:

| Before | After |
| --- | --- |
| 16 flat sidebar links | Four labelled groups — Work · Customers · Business · Administration |
| Sidebar badge numbers unexplained | Each badge counts records waiting in that queue, with a tooltip naming what is counted |
| Topbar held only breadcrumbs | Breadcrumbs + search (⌘/Ctrl-K), live alerts, account menu, primary action |
| Every page invented its own header | One `PageHeader`: gold eyebrow → title → one-line purpose → actions |
| Pages hand-rolled cards, pills, buttons | `@/components/ui` primitives shared by all migrated pages |

---

## 2. The design system

### Tokens — `src/styles/tokens.css`

Nothing outside `tokens.css` should hard-code a colour, radius or duration.

| Group | Examples | Meaning |
| --- | --- | --- |
| Surfaces | `--ink-base`, `--ink-shell`, `--ink-card`, `--ink-raised`, `--ink-hover`, `--ink-active` | Backdrop → chrome → card → nested panel → hover → pressed |
| Lines | `--line-faint`, `--line-soft`, `--line`, `--line-strong` | Dividers, card borders, control borders, emphasis |
| Text | `--text-1 … --text-4` | Primary, secondary, tertiary, disabled/label |
| Brand | `--brand-500` (indigo), `--gold-500` (Chapman gold) | Interactive colour; brand marks and premium accents |
| States | `--ok-500`, `--warn-500`, `--bad-500`, `--info-500`, `--violet-500` (+ `-soft` fills) | Shared by pills, charts, banners, badges |
| Rhythm | `--sp-1 … --sp-10`, `--r-xs … --r-pill` | 4px spacing scale, one radius family |
| Motion | `--dur-fast/base/slow`, `--ease-out` | Collapse to 1ms under `prefers-reduced-motion` |

### Component layer — `src/styles/components.css` + `src/components/ui`

`page`, `page-header`, `card`, `stat`, `pill`, `btn`, `segmented`, `field`,
`data-table`, `empty-state`, `banner`, `meta-item`, `legend-row`, `skeleton`.

TypeScript wrappers (import from `@/components/ui`):

| Component | Used for |
| --- | --- |
| `PageHeader` | Eyebrow, title, purpose line, actions — identical on every page |
| `Card`, `CardHeader`, `CardBody`, `CardFooter` | All surfaces |
| `StatTile` | KPI with accent rail, delta chip, sparkline |
| `StatusPill` | One tone vocabulary (`neutral/brand/gold/ok/warn/bad/info/violet`) |
| `Button` | `primary · secondary · ghost · gold · danger · ok`, three sizes, icon-only, block |
| `SegmentedControl` | View and range switches, optionally carrying live counts |
| `EmptyState` | Plain words + one next step |
| `Banner` | Save confirmations, permission notices, load errors |
| `Sparkline` | Dependency-free trend line for tiles |

---

## 3. What changed, file by file

**Shell**
- `src/layouts/MainLayout.css` — one shell geometry (`--sidebar-w`, `--topbar-h`), ambient blooms behind the workspace, route fade, mobile slide-over.
- `src/components/sidebar/Sidebar.tsx` — grouped, permission-filtered navigation with live counts; brand block; role label; sign-out; empty-state note when a role has no pages.
- `src/components/sidebar/NavItem.{tsx,css}` — gold active rail, count badge, collapsed-rail dot.
- `src/components/sidebar/WorkspaceSwitcher.css` — branch card in the sidebar footer.
- `src/components/topbar/Topbar.tsx` + `Topbar.css` — glass topbar, shared button, responsive collapse; `Breadcrumbs.{tsx,css}` now label the newer routes.
- `src/components/topbar/CommandPalette.css`, `ProfileDropdown.tsx`, `NotificationDropdown.tsx` — retuned to the tokens; the two dropdowns no longer inject their own Google-Fonts `@import` and no longer shadow the console type system.
- `src/components/FAB/FAB.css`, `src/components/PermissionGuard.css` — same treatment.

**Pages**
- `src/pages/Dashboard.tsx` + `Dashboard.css` — rebuilt on `PageHeader`, `StatTile`, `Card`, `SegmentedControl`; skeleton loading instead of a spinner; charts kept (animated area chart, donut, workflow bars, activity feed) but recoloured from tokens. Query logic, permissions and metrics are unchanged.
- `src/pages/MobileRequests.tsx` + `MobileRequests.css` — the intake queue rebuilt: view control with live counts, request cards that state the client's chosen date / item count / estimate, a detail column (preferred vs proposed date, pickup point, items, customer and staff notes) and a decision panel that is the only place a record changes state. Data logic, realtime channel and update payloads are unchanged.

**New**
- `src/pages/DesignPreview.tsx` + `DesignPreview.css` at `/preview` — a credential-free walkthrough of the redesign rendered from **sample records only**, plus a gallery of the components. It touches no Supabase table. Delete it (and its route) once the redesign is signed off.
- `src/styles/legacy-bridge.css` — keeps the screens that still use inline-style layouts usable on phones.

---

## 4. Behaviour that is intentionally unchanged

- Every Supabase query, table, column and update payload.
- Realtime channels (`mobile-laundry-requests`, `staff-sidebar-counts`, `workspace-branches`).
- Permissions: `usePermission`, `PermissionGuard`, `role_permissions` filtering, and which actions are hidden for view-only roles.
- Routes and URLs, except the additive `/preview`.

Two small clean-ups rode along: the Mobile Requests page no longer `console.log`s
every customer row it loads, and four now-unnecessary `// @ts-ignore` comments
were dropped from files touched by this pass.

---

## 5. Reviewing the redesign

```bash
npm install          # repo ships bun.lockb; npm works, bun is not required
npm run dev          # http://localhost:5173  → /preview (no sign-in needed)
npx tsc -b           # type check
npm run build        # type check + production bundle
```

Screens not yet migrated to the design system (Orders, Clients, Staff, Services,
Payments, Receipt, Reports, Settings, Security, System Admin, App Accounts, App
Ideas) keep their own inline styling; they inherit the new shell, typography and
shell tokens. Migrating them to `@/components/ui` is the natural next pass.

---

## 6. Phases

This redesign is deliberately phased so each step ships on its own and nothing
is half-converted. **Status is tracked here and in [`todo.md`](../todo.md)** —
that is the source of truth, not any chat thread.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Design system — tokens + `@/components/ui` + shared stylesheets | ✅ done |
| 2 | App shell — sidebar, topbar, layout, palette, menus, FAB | ✅ done |
| 3 | Dashboard — overview rebuilt on the system | ✅ done |
| 4 | Mobile Requests queue — the intake pattern | ✅ done |
| 5 | **Orders** — busiest screen; establishes the table + row-detail pattern | ✅ done |
| 6 | Clients + Staff — register and roster pages (KPI rows, tables, modals) | ⬜ next |
| 7 | Settings · Security · System Admin — the Administration group | ⬜ |
| 8 | Services · Payments · Receipts · Reports | ⬜ |
| 9 | Service Requests · App Ideas · App Accounts | ⬜ |
| 10 | Sign-off: delete `/preview` (route + page + CSS) and the sample-data note here | ⬜ |

The workflow stage ramp (`--stage-received` … `--stage-completed`) and the `Avatar`
primitive were added to the system in phase 5; the pipeline board, order table,
detail drawer and print sheet live in `src/pages/Orders.css`.

Rules that keep the phases safe:

- One page (or one small group) per commit, on the same branch as the open PR.
- Data logic is frozen: queries, tables, columns, realtime channels, update
  payloads, permission checks and routes must not change. Presentation only.
- Each phase must end with `npx tsc -b` and `npm run build` passing, and the
  page exercised in `/preview` (add a sample block) or against a real sign-in.

## 7. Resuming this work in a new chat

Everything needed to continue lives in the repository, so a fresh session can
pick the work up without any chat history:

1. **Read, in this order:** `todo.md` (open phases) → this file (system + rules)
   → `git log --oneline -8` (what has landed) → the open PR.
2. **The branch is the thread.** All redesign commits live on
   `arena/03b7f65b-laundry-app` with PR **#7** open against `master`. If a new
   chat starts on a *different* branch, that branch was cut from `master` and
   will not contain the redesign — merge PR #7 first, or fetch the redesign
   branch, before continuing.
3. **A ready-made prompt** for the next session:

   > Continue the staff console redesign. Read `docs/staff-console-redesign.md`
   > and `todo.md` first. Phases 1–4 are committed on
   > `arena/03b7f65b-laundry-app` (PR #7 open against master). Work on the next
   > unchecked phase — presentation only, no data-logic changes — verify with
   > `npx tsc -b` and `npm run build`, then commit and push to the same branch.

4. **Review without credentials** at any point: `/preview` (sample data only).
