# Staff Console Redesign (v2)

**Status:** implemented on `arena/03b7f65b-laundry-app` · **Scope:** presentation layer only: no database schema, RPC or permission change.

---

## 1. Why this pass exists

The staff console grew feature by feature: each page carried its own hard-coded
hex values, its own button, its own "loading" spinner and its own idea of what a
status chip looks like. Nothing was broken, but nothing looked like one product
either: a decline was red in one queue, amber in another, and the shell
(sidebar, topbar) fought the pages underneath it.

This redesign gives the console **one vocabulary**: tokens for colour, space,
radius, elevation and motion, plus a small component library every screen can
compose from. The information architecture was reviewed at the same time:

| Before | After |
| --- | --- |
| 16 flat sidebar links | Four labelled groups: Work · Customers · Business · Administration |
| Sidebar badge numbers unexplained | Each badge counts records waiting in that queue, with a tooltip naming what is counted |
| Topbar held only breadcrumbs | Breadcrumbs + search (⌘/Ctrl-K), live alerts, account menu, primary action |
| Every page invented its own header | One `PageHeader`: gold eyebrow → title → one-line purpose → actions |
| Pages hand-rolled cards, pills, buttons | `@/components/ui` primitives shared by all migrated pages |

---

## 2. The design system

### Tokens: `src/styles/tokens.css`

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
| Workflow | `--stage-received … --stage-completed` (9 stops) | One colour per laundry stage, shared by the order list, the pipeline board and the dashboard |

### Component layer: `src/styles/components.css` + `src/components/ui`

`page`, `page-header`, `card`, `stat`, `pill`, `btn`, `segmented`, `field`,
`data-table`, `empty-state`, `banner`, `meta-item`, `legend-row`, `skeleton`, and the
`table-page` frame described in section 6.

TypeScript wrappers (import from `@/components/ui`):

| Component | Used for |
| --- | --- |
| `PageHeader` | Eyebrow, title, purpose line, actions · identical on every page |
| `Card`, `CardHeader`, `CardBody`, `CardFooter` | All surfaces |
| `StatTile` | KPI with accent rail, delta chip, sparkline |
| `StatusPill` | One tone vocabulary (`neutral/brand/gold/ok/warn/bad/info/violet`) |
| `Button` | `primary · secondary · ghost · gold · danger · ok`, three sizes, icon-only, block |
| `SegmentedControl` | View and range switches, optionally carrying live counts |
| `EmptyState` | Plain words + one next step |
| `Banner` | Save confirmations, permission notices, load errors |
| `Sparkline` | Dependency-free trend line for tiles |
| `Avatar` | Initials chip for a customer or staff name, tinted from the name |

---

## 3. What changed, file by file

**Shell**
- `src/layouts/MainLayout.css`: one shell geometry (`--sidebar-w`, `--topbar-h`), ambient blooms behind the workspace, route fade, mobile slide-over.
- `src/components/sidebar/Sidebar.tsx`: grouped, permission-filtered navigation with live counts; brand block; role label; sign-out; empty-state note when a role has no pages.
- `src/components/sidebar/NavItem.{tsx,css}`: gold active rail, count badge, collapsed-rail dot.
- `src/components/sidebar/WorkspaceSwitcher.css`: branch card in the sidebar footer.
- `src/components/topbar/Topbar.tsx` + `Topbar.css`: glass topbar, shared button, responsive collapse; `Breadcrumbs.{tsx,css}` now label the newer routes.
- `src/components/topbar/CommandPalette.css`, `ProfileDropdown.tsx`, `NotificationDropdown.tsx`: retuned to the tokens; the two dropdowns no longer inject their own Google-Fonts `@import` and no longer shadow the console type system.
- `src/components/FAB/FAB.css`, `src/components/PermissionGuard.css`: same treatment.

**Pages**
- `src/pages/Dashboard.tsx` + `Dashboard.css`: rebuilt on `PageHeader`, `StatTile`, `Card`, `SegmentedControl`; skeleton loading instead of a spinner; charts kept (animated area chart, donut, workflow bars, activity feed) but recoloured from tokens. Query logic, permissions and metrics are unchanged.
- `src/pages/Orders.tsx` + `Orders.css`: the order book **kept its original layout and restyled** on
  the shared system. The page still owns the viewport (pinned title, filters and pagination, one
  scrolling list, rows that become labelled cards at ≤640px) and all data logic is untouched. What
  changed is the styling: the frame is now the shared `.table-page`, the controls are
  `PageHeader` / `Button` / `StatusPill` / `EmptyState` / `Avatar`, stage colours come from the
  `--stage-*` ramp, and everything page-specific lives in `Orders.css` under `.ord-*`.
  The toolbar controls also keep the compact shape this page was built with: the filter selects are
  auto-width with their own caret rather than full-width fields, the search field carries a clear
  button and the "/" hint, Refresh Data and Print Range are labelled quiet buttons, and the list and
  pipeline switch is icon-only. That control row is what staff recognise, so it stays.
- `src/pages/MobileRequests.tsx` + `MobileRequests.css`: the intake queue rebuilt: view control with live counts, request cards that state the client's chosen date / item count / estimate, a detail column (preferred vs proposed date, pickup point, items, customer and staff notes) and a decision panel that is the only place a record changes state. Data logic, realtime channel and update payloads are unchanged.

**New**
- `src/pages/DesignPreview.tsx` + `DesignPreview.css` at `/preview`: a credential-free walkthrough of the redesign rendered from **sample records only**, plus a gallery of the components. Section 3 shows the order book frame with six sample orders and the same toolbar controls. It touches no Supabase table. Delete it (and its route) once the redesign is signed off.
- `scripts/check-copy.mjs` (`npm run check:copy`): fails the build if an em dash (U+2014) appears anywhere in the repo. See the copy rules below.
- `src/styles/legacy-bridge.css`: keeps the screens that still use inline-style layouts usable on phones.

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

Screens not yet migrated to the design system (Clients, Staff, Services,
Payments, Receipt, Reports, Settings, Security, System Admin, App Accounts, App
Ideas) keep their own inline styling; they inherit the new shell, typography and
shell tokens. Orders is no longer on that list: it was restyled in phase 5 while
keeping its layout. Migrating the rest to `@/components/ui` is the next pass.

---

## 6. Phases

This redesign is deliberately phased so each step ships on its own and nothing
is half-converted. **Status is tracked here and in [`todo.md`](../todo.md)**:
that is the source of truth, not any chat thread.

Phases 1 to 5 below were the desktop pass. It rebuilt the visual system and the
shell, but it was planned for a desk: on phones the app is usable only by
accident, and five screens scroll sideways or hide their own content. The mobile
pass that follows re-plans the remaining work **mobile first**, daily operations
first, and folds the still-unmigrated screens into it. The two lists are one
roadmap: 1 to 5 are done and are not repeated; A to F are what remains.

### Already landed: the desktop pass

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Design system · tokens + `@/components/ui` + shared stylesheets | ✅ done |
| 2 | App shell · sidebar, topbar, layout, palette, menus, FAB | ✅ done |
| 3 | Dashboard · overview rebuilt on the system | ✅ done |
| 4 | Mobile Requests queue · the intake pattern | ✅ done |
| 5 | **Orders** · layout kept, restyled on the shared system (`.table-page` frame + tokens) | ✅ done |

### Remaining: the mobile-first pass

| Phase | Scope | Status |
| --- | --- | --- |
| A | **Responsive foundation** · shell, `100dvh`, safe areas, one scroll area per page, compact top bar, drawer, notification panel, shared breakpoints and padding tokens | ✅ done |
| B | **Shared mobile patterns** · page header, summary cards, filter/search bar, list row, detail view, bottom actions, full-screen modal, confirm dialog, empty/error/loading states | ✅ done |
| C | **Daily operations** · Mobile Requests, Service Requests, Orders QA, New Order, Clients | ✅ done |
| D | **Rest of the app** · Dashboard, App Ideas, App Accounts, Staff, Services, Payments, Receipt, Reports, Security, Settings, Help, System Admin, Login, Profile | ⬜ |
| E | **Overall appearance** · palette, type, surfaces, border contrast, spacing, button hierarchy, status colours, icons, states, motion, wording (refine the dark operational style, do not replace it) | ⬜ |
| F | **Mobile app integration** · Mobile Requests, Service Requests, customer replies, App Ideas, App Accounts, realtime alerts, staff actions that start in the customer app | ⬜ |
| G | Sign-off: delete `/preview` (route + page + CSS) and the sample-data note here, then close PR #7 | ⬜ |

### Riding along with A and B: minimal correctness pass

Five screens are not merely unpolished, they are broken on phones. A minimal
correctness pass rides along with A and B so they stop being unusable while
their full design waits for C and D. Presentation only, no data logic:

| Screen | What is wrong |
| --- | --- |
| Clients | `.cl-tbl` keeps `min-width: 780px` on phones and four stacked KPI cards leave the list no height |
| Staff | `.sf-tbl` keeps `min-width: 760px` inside a horizontally scrolling wrapper |
| System Admin | the table is rendered with an inline `minWidth: 1100px`, which defeats the card mode the page already has |
| Reports | no media queries at all: inline `2fr 1fr` grids, fixed 28px/32px padding, `min-height: 100vh` |
| New Order | the cart table is forced to `overflow-x: auto` with `white-space: nowrap` and a panel that clips its own sections |

### Target widths

Every layout decision is checked at these widths, smallest first:

| Width | Device |
| --- | --- |
| 320px | smallest supported phone |
| 360px | small Android phone |
| 390px | common modern phone |
| 430px | larger phone |
| 768px | tablet portrait |
| 1024px+ | desktop layout |

### Definition of done

- No accidental horizontal page overflow at 320px.
- No nested scrolling unless it is deliberate and named.
- Important actions are reachable one-handed.
- Buttons and fields are comfortable to tap (44px minimum where it matters).
- Lists become useful cards or rows on phones.
- Detail views have a clear back or close action.
- Forms never require sideways scrolling.
- Desktop layout stays stable; tablet portrait stays usable.
- Keyboard navigation still works; text can be copied where useful.
- Reduced motion is respected.
- Checked on a Vercel preview at several viewport sizes.
- Existing staff and customer app integration keeps working.

### Mobile patterns (phase B)

Every page composes from these, so a list, a filter row or a decision behaves
the same on every screen. They live in `components.css` under MOBILE PATTERNS
and export from `@/components/ui`.

| Pattern | Class | Phone behaviour |
| --- | --- | --- |
| Page header | `.page-header` | title and actions stack; actions become a full-width, thumb-height row |
| Summary tiles | `.stat-grid` | two compact tiles per row |
| Filter row | `FilterBar` `.filter-bar` | search on its own line, filters become one scrollable strip instead of wrapping the list off screen |
| A record | `RecordRow` `.record` | a card with a 68px tap area and a trail slot for status |
| A record in full | `DetailView` `.detail-view` | `variant="overlay"` takes over the screen with a Back button; `inline` stays a column |
| Primary actions | `ActionBar` `.action-bar` | sticks to the bottom of the viewport, clear of the home indicator |
| A focused task | `Modal` `.modal` | full screen, form and keyboard fit; Escape closes, page behind cannot scroll, focus held inside |
| A decision | `ConfirmDialog` `.confirm` | same dialog everywhere; the decision sits at the bottom on a phone |
| Loading | `LoadingRows` `.loading-rows` | placeholder rows keep the page's shape |
| Failure | `ErrorState` `.state-block` | plain words plus the one action that might fix it |

Section 5 of `/preview` demonstrates all of them, inside the width probe, with
live dialog and confirmation buttons.

### Page archetypes (the two shapes a page may have)

A page picks exactly one, and the shell owns the scrollbar:

1. **Document flow** (default): `.page` inside `.main-body`, which is the single
   scroller. Use for settings-style pages and long forms.
2. **Viewport frame**: `.table-page` for anything with a list that must scroll
   under a pinned title, filters and pagination. `.table-page__scroll` is the
   only scrolling element.

A page must not declare its own `100vh`/`100dvh`, and must not open a second
scroll container unless it is a named, deliberate case (for example the pipeline
board scrolling sideways). The legacy bridge keeps shrinking as pages migrate.

### Decision log

**Phase 5 (Orders) · rebuilt, reverted, then restyled with the layout kept.**
The first attempt replaced the page with a document-scrolling layout and was
reviewed against the live deployment and turned down. The page was restored
byte-for-byte at commit `274fa56` (verified against `5512924:src/pages/Orders.tsx`)
and then reworked in place.

What was ever wrong with it was the styling, never the layout. The page carried
its own grey palette, its own pill and button shapes and off-token accents, so
beside Dashboard and Mobile Requests it read as a different product. The layout
was what made it work on a phone, so the layout is exactly what was preserved:

- the page owns the viewport: title, filter bar and pagination are pinned and
  only the list scrolls;
- at ≤640px the header row gives way and each record becomes a labelled card
  (`td::before { content: attr(data-label) }`);
- list and pipeline views, the drawer, the bulk-action bar, print mode and the
  CSV export all behave as before.

A review note came back after the restyle and is worth recording: the *controls* were the part
staff had learned, so the filter selects, the labelled Refresh Data button and the icon-only view
switch keep their original compact shape while their colours come from the tokens. Everything else
follows the shared vocabulary.

What changed is presentation only: the frame is now the shared `.table-page`
(the same one this document prescribes for every table screen), the controls are
`PageHeader` / `StatusPill` / `EmptyState` / `Avatar`, with the compact
`.ord-ghost`, `.ord-fp` and `.ord-vt` controls for the toolbar; stage colours
come from the `--stage-*` ramp in `tokens.css`, and the `.ord-*` rules in
`Orders.css` cover just the order-specific pieces. Queries, mutations, realtime,
permission checks and routes are untouched.

Kept for the record: the original page is at `5512924` and the rejected rebuild
at `22f31ed` on this branch. `/preview` section 3 shows the frame with sample
orders.

**Phase C (daily operations) · the intake queues and the two busiest screens.**
Mobile Requests and Service Requests now compose from the phase B patterns
instead of their own copies. The two queues were near-identical in structure and
completely different in code, which is exactly the drift the shared patterns
exist to stop.

| Screen | What changed |
| --- | --- |
| Mobile Requests | Queue is `RecordList`/`RecordRow` with an avatar lead, `#id · phone` subtitle, date, item count and total, plus the status badge and express tag in the trail; the skeleton is `LoadingRows`; the detail is `DetailView variant="overlay"` at ≤900px (a `useMediaQuery` switch, because the phone version is a different element, not a different style) with the decision in the pinned footer and a Back button. |
| Service Requests | Same treatment, plus `SegmentedControl` for the five views with their counts, `EmptyState` for the empty queue, `Banner` for the saved and error lines, and `PageHeader`. The two decision panels stay as the inputs they always were; `Send this date` and `Decline` moved into the pinned footer, and the panel says where they are on a desk. |
| Orders | Audited at 320 to 430px, no change: the 1060px table floor is already released at ≤640px by the frame, every cell carries `data-label`, and the pipeline stays a deliberate sideways board inside the named scroller. |
| New Order | Audited, then given the one thing it lacked on a phone: `ActionBar` pins `Create Order`, with the amount due, to the bottom of the screen, where the header button was out of thumb reach once the cart was full. The button is the page's own, disabled by the same `submitting \|\| !canEdit` guard, so it cannot double-submit. |
| Clients | The phone list is now document flow: the shell stops being a fixed frame and `.main-body` becomes the single scroller, so 127 clients are no longer squeezed into the sliver of height the tiles and filters left behind. Rows were already labelled cards. |

Verification for this phase: `npx tsc -b`, `npx vite build` and
`npm run check:copy` green; a 25-point structural check over the five screens
(record rows, labelled cells, released width floors, breakpoints matching the
CSS, the pinned action bar and the guard on the second submit); an SSR smoke of
the shared pieces; and a grep audit for fixed widths that are not released and
for new `100vh`. The pages themselves sit behind `PermissionGuard`, so there is
no server-rendered markup to assert against: the width-by-width eyeball stays
with the reviewer on a preview.

**Zooming on a phone (follow-up to phase C).** A report came back from a live
phone: the decision button at the bottom of Mobile Requests could not be seen,
because the whole console is zoomable. Two separate mechanisms were behind it,
and both are fixed without taking pinch zoom away from anyone who needs it.

1. **A focused field under 16px makes iOS Safari zoom the page in, and it stays
   zoomed.** The Status select, the date input and the note textarea were 13 to
   13.5px. Fields are now 16px at 900px and below, in the shared field rules and
   in the four pages that set their own (Mobile Requests through the shared
   classes, Service Requests, Orders, Clients). The 16px figure is the exact
   threshold, so this is also the fix that keeps focus from moving the page.
2. **While a page is zoomed, `position: fixed` and `position: sticky` are laid
   out against the layout viewport, not against what is on screen.** That is why
   the pinned bar sat below the visible area, and it is the same reason a fixed
   overlay can sit under the browser chrome. `visualViewport` is now published as
   three custom properties on `<html>` by `useVisualViewport` (mounted once, in
   the shell):

   | Property | Meaning | Used by |
   | --- | --- | --- |
   | `--vv-h` | the visible height | takeover screen, modal sheet, order drawer, phone drawer, notification sheet |
   | `--vv-top` | where the visible area starts down the page | the same surfaces, so they sit in the visible band after panning |
   | `--vv-bottom` | the strip hidden below the visible area | pinned action bar, table pagination, floating button, toast |

   Each falls back to `100dvh` / `0` in CSS, so a browser without
   `visualViewport` behaves exactly as before, and the keyboard opening lifts the
   pinned bar instead of covering it. `#root` also moved to `100dvh` so the page
   is never taller than the screen. Pinch zoom itself is left alone: iOS ignores
   `user-scalable=no`, and blocking zoom would take magnification away from
   staff who need it, so the layout is made zoom-proof instead.

**Copy rules (repo-wide).** No em dashes. `npm run check:copy` fails on U+2014
anywhere in the repo; use a full stop, a colon, a comma or a middot separator
instead, and a plain hyphen for "no value" cells. En dashes survive only in
untouched pages and in the pickup-window values inside SQL migrations; new copy
writes ranges as "1 to 20" and those remaining pages will be normalised as they
are migrated. Long explanatory subtitles are out as well: a page subtitle states
what the page holds, nothing more.

**Consequence for phase 6+:** new pages must not regress the pinned chrome. Use
the page frame below for table screens instead of the plain `.page` wrapper.

### Page frame for table screens

```
.table-page            fixed-height column, overflow hidden  (fills .main-body)
  .table-page__head    title + actions        · does not scroll
  .table-page__tools   filters/search         · does not scroll
  .table-page__body    flex:1, min-height:0   · the ONLY scrolling area
  .table-page__foot    pagination             · does not scroll
```

Rows collapse to cards at ≤640px using `td::before { content: attr(data-label) }`.

Rules that keep the phases safe:

- One page (or one small group) per commit, on the same branch as the open PR.
- Data logic is frozen: queries, tables, columns, realtime channels, update
  payloads, permission checks and routes must not change. Presentation only.
- Each phase must end with `npx tsc -b`, `npm run build` and `npm run check:copy`
  passing, and the page exercised in `/preview` (add a sample block) or against a
  real sign-in.

## 7. Resuming this work in a new chat

Everything needed to continue lives in the repository, so a fresh session can
pick the work up without any chat history:

1. **Read, in this order:** `todo.md` (open phases) → this file (system + rules)
   → `git log --oneline -8` (what has landed) → the open PR.
2. **The branch is the thread.** All redesign commits live on
   `arena/03b7f65b-laundry-app` with PR **#7** open against `master`. If a new
   chat starts on a *different* branch, that branch was cut from `master` and
   will not contain the redesign. Merge PR #7 first, or fetch the redesign
   branch, before continuing.
3. **A ready-made prompt** for the next session:

   > Continue the staff console redesign. Read `docs/staff-console-redesign.md`
   > and `todo.md` first. Phases 1 to 5 are committed on
   > `arena/03b7f65b-laundry-app` (PR #7 open against master). Work on the next
   > unchecked phase: presentation only, no data-logic changes. Verify with
   > `npx tsc -b`, `npm run build` and `npm run check:copy`, then commit and
   > push to the same branch. Phase C is done and committed: the daily-operation
   > screens (Mobile Requests, Service Requests, Orders, New Order, Clients) now
   > use the phase B patterns. The current phase is D: work through the rest of
   > the app (Dashboard, App Ideas, App Accounts, Staff, Services, Payments,
   > Receipt, Reports, Security, Settings, Help, System Admin, Login, Profile),
   > same rules, same verification.

4. **Review without credentials** at any point: `/preview` (sample data only).
