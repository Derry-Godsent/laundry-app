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
- `src/styles/base.css` PLATFORM GUARDS: the two rules that are requirements of the mobile browsers rather than styling, moved here from the deleted legacy bridge: the 16px field floor (`input, select, textarea`, so iOS cannot zoom on focus) and the named sideways scrollers for wide legacy tables (`.tbl-wrap`, `.sf-tbl-wrap`, `.table-wrapper`).

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
| E | **Overall appearance** · palette, type, surfaces, border contrast, spacing, button hierarchy, status colours, icons, states, motion, wording (refine the dark operational style, do not replace it) | ✅ done |
| F | **Mobile app integration** · Mobile Requests, Service Requests, customer replies, App Ideas, App Accounts, realtime alerts, staff actions that start in the customer app | ✅ done |
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
board scrolling sideways, or the permissions matrix, which is a roles-by-pages
grid). The legacy bridge that used to widen inline grids is deleted: every
screen sets its own layout from the tokens at its own breakpoint.

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

**Phase D (the rest of the app) · slices.** D covers fourteen screens, so it
lands in slices, one commit each, in the order the work is actually needed:
the management screens first, then the tools, then the rarely opened ones.

| Slice | Screens | What it does |
| --- | --- | --- |
| D1 | Staff, System Admin, Reports, Dashboard overflow | The last of the five screens that were broken rather than unpolished, plus a 320px overflow on the Dashboard loading skeleton (fixed pixel widths, now percentages with caps). |
| D2 | Dashboard, App Ideas, App Accounts | Phone polish on the pages that already compose from the shared system. |
| D3 | Services, Payments, Receipt | Legacy token-object pages: frames, floors, side-by-side grids, dialogs. |
| D4 | Security, Settings, Login, Help, Profile | The remaining legacy pages, then the `legacy-bridge` cleanup (done). |

What D1 changed, and the bugs found while doing it:

| Screen | What was wrong | What changed |
| --- | --- | --- |
| Staff | The loading state was `height: 100vh` inside the frame; card mode did not start until 480px while the table floor was released at 700px, so 481 to 700px squeezed eight columns; panes used `100dvh` and ignored zoom | Loading state is the shared `LoadingRows`; cards start exactly where the floor is released (700px) with their `data-label` headers; the panel and the dialog are sized to the visual viewport; fields reach 16px; the filter row is a slide strip; pagination, row actions, the clear button and the footer buttons are thumb-height |
| System Admin | `.sys-table` kept `min-width: 760px` at every width: the staff table scrolled sideways and the logs table, inside a clipped card, simply cut its columns off. The permissions matrix lost its header to the card rules | The floor is released with the card mode; the matrix is a named, deliberate exception that keeps its header and scrolls sideways inside its own wrapper; the Add Staff dialog becomes a bottom sheet sized to the visible area; the tabs slide; the settings grid stacks; the toggle keeps its 24px look but gains a 44px tap area |
| Reports | The four range buttons were an unwrapping flex row about 400px wide, so they pushed the whole page sideways at 320px; no phone media query existed for the header | The range switcher is a slide strip and the header stacks; charts drop to 220px on a phone; the loading state is the shared `LoadingRows` |

The lesson recorded for D2 to D4: on these legacy pages the defect is almost
always one of four things, and all four are greppable before touching anything.
A `min-width` in pixels with no release, a `100vh` inside the shell frame, a
`position: fixed` pane that ignores the visual viewport, and a field under 16px.

D2 landed the three pages that already composed from the shared system, so it
was phone polish rather than restructure:

| Screen | What changed |
| --- | --- |
| App Accounts | The list-and-detail pair now uses the same `DetailView` takeover at 900px as the request queues, so an account is a full screen with a Back button instead of a panel below the list. The list scrolls only on a desk; on a phone the page scrolls once in `.main-body`. Shared `LoadingRows` and `EmptyState`, shared page padding, a 16px search field, a stacked header, and tiles two per row. |
| App Ideas | Shared `Banner`, `EmptyState` and `LoadingRows`; shared page padding; a stacked header with a full-width action; the four status buttons at thumb height sharing the row; six counted tiles two per row; long pasted text wraps instead of pushing the page sideways. |
| Dashboard | The area chart was a 600-unit viewBox scaled to the container, so on a phone its axis labels rendered at about four pixels. It now measures its box with a `ResizeObserver` and draws at that width (clamped 280 to 900), which keeps text at the size it was written, shortens the chart on a narrow box and spaces the labels by available width instead of a fixed count. The loading skeleton is fluid, and quick actions and feed rows are phone-sized. |

D3 took the three legacy token-object pages, which share a shape: their colours
come from a local `T` object, their padding and gutters are inline, and their
tables and dialogs were written for a desk.

| Screen | What was wrong | What changed |
| --- | --- | --- |
| Services | Loading and page were `100vh` inside the frame; gutters were hardcoded 32px; the modal was a centred box wider than a phone | Page fills the frame; the shared `LoadingRows`; gutters use the page tokens; four count cells stay two per row; the modal is a bottom sheet sized to the visible area with its form grids stacked; fields reach 16px; buttons reach thumb height; the toast clears the hidden strip |
| Payments | A ten-column table with a 680px floor, which on a phone was a sideways scroll through nine columns to reach the receipt button; the record-payment dialog was centred at 85vh; four stat tiles squeezed into one column | Each row is a labelled card (`data-label` on all ten cells), the floor and the head are gone at 900px; the dialog is a bottom sheet sized to the visible area with its rows stacked; tiles two per row; fields 16px; every button thumb height |
| Receipt | `100vh` in two states; the order selector kept `minWidth: 260`; small fields; a toast below the visible area when zoomed | Fills the frame; phone layer is `@media screen` only, so the print stylesheet is untouched; the selector goes full width at 16px; buttons thumb height; the toast clears the hidden strip |

D4 closed phase D with the four rarely opened pages, and then deleted the
bridge that had been carrying them.

| Screen | What was wrong | What changed |
| --- | --- | --- |
| Security | `100vh` in the loading state and the page; two 640px tables with no release, so the roles and audit lists were sideways scrolls; the phone media block started at 860px but did nothing about the floor | Fills the frame; both tables become labelled cards at 900px (`data-label` on all nine cells, head hidden, the empty state stays a centred message); fields 16px; buttons and tabs thumb height; the toast clears the hidden strip. The permissions matrix keeps its named sideways scroller, as it is a roles-by-pages grid. |
| Settings | `100vh` in both states; four `1fr 1fr` grids; an inline `overflowY: auto` body wrapper, which can only ever be a second scroller inside `.main-body`; several classes referenced by the CSS that no longer exist in the JSX | Fills the frame; grids stack; the body wrapper loses the inline overflow and gains the real `cs-body` hook that the CSS was already styling; fields 16px; the loyalty rows wrap instead of squeezing their inputs; the toast clears the hidden strip |
| Login | Two `100vh` heights; 16px fields only arrived at 480px, so the first screen a phone opens zoomed on focus; no home-indicator inset | Heights follow the visible viewport with a `dvh` fallback; 16px fields from 900px down; buttons thumb height; the page handles its own safe-area inset because it sits outside the shell |
| Help | Padding and gutters were inline, the FAQ rows were under the tap floor, and the contact grid could put an address on a squeezed line | Screen-only phone layer: shared page padding, thumb-height FAQ rows, the contact rows stack and wrap |
| Profile | Two cards side by side by inline style, with inline padding | Screen-only phone layer: shared page padding, the pair stacks, fields 16px, buttons thumb height |

**The `legacy-bridge` cleanup.** `src/styles/legacy-bridge.css` existed only to
rescue screens that still laid themselves out with inline styles: attribute
substring selectors (`[style*="padding: 32px"]`, `[style*="grid-template-columns:
repeat(4"]`) that collapse inline grids, widen fixed widths and raise type on
small screens. Every screen it rescued is now migrated and carries its own
class-based phone layer, so the file is deleted. The two rules in it that were
platform requirements rather than styling moved to `base.css` under PLATFORM
GUARDS: the 16px field floor (`input, select, textarea`) and the legacy wide
table scrollers (`.tbl-wrap`, `.sf-tbl-wrap`, `.table-wrapper`), plus hiding the
webview scrollbar under 768px. Attribute substring selectors are now absent from
the stylesheet, so a page cannot accidentally inherit styling from the exact
byte sequence of its inline style any more.

**Phase D follow-up, reported from a phone.** Three of the four are one bug at
heart, and none of them could be seen by a static check: there is no browser in
the build environment.

| Reported | What was actually happening | Fix |
| --- | --- | --- |
| On Mobile Requests the takeover had to be scrolled before the Send date button could be reached, and the Back / name / status bar moved with it. Service Requests "opened the modal weirdly". | Every page was inside two wrappers with an entrance animation that ended on `transform: translateY(0)` and kept it (fill mode `both`): `.route-transition` and `.page`. A retained transform, even an identity one, makes that element the containing block for `position: fixed` descendants. So the takeover was laid out against the page instead of the screen, and it scrolled with `.main-body`: its header walked off the top and its pinned action ended up below the fold. It also stacked under the top bar instead of over it. | Two parts. Every finite entrance animation in the repo now lands on `transform: none`, so no wrapper keeps a containing block (33 keyframes). And `DetailView` renders its takeover on `<body>` rather than in place, which makes it immune to any ancestor, then opens through `useOverlay`: Escape closes it, focus stays inside, and the page behind it is frozen. The bar and the action row are flex siblings of the scrolling body, so they cannot move. |
| The notification panel nearly filled a phone and scrolling it scrolled the app behind it. | The panel's list was given `max-height: none` under 640px, so a long list grew past the panel and was clipped by its `overflow: hidden`: nothing inside could scroll, and the swipe went to the page. The row actions were `opacity: 0` until `:hover`, which a touch screen never fires. | The list is the scroller of the panel's flex column (`flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain`), the panel is capped by the visual viewport so it can never be taller than what is on screen, and on a phone it is a sheet under the top bar with a backdrop that swallows the gesture, a close button, row actions that are always visible and thumb sized, and the page behind it locked. |
| The Mobile Requests queue showed "Verified customer" instead of who was actually asking. | The row carries `customer_account_id` but the embedded read of `customer_accounts` was never in the query, so the mapper's `customer_accounts` line was always undefined and both helpers fell through to their placeholder strings. The phone number was never rendered either: both branches of the helper printed a claim, not a number. | The ids on the queue are resolved in two reads, the same way the service-request queue does it: `customer_accounts` by `auth_user_id`, then `clients` by `client_id` as the fallback, both failing soft so a request is still workable when a name cannot be read. The real name and number now appear in the list row, in the takeover header and as two detail rows. The placeholders are honest when a read fails: "Name not readable", "No number on file". |

**Rule for new pages.** An entrance keyframe must land on `transform: none`, never
on `translateY(0)` or `scale(1)`, and any wrapper that can contain a full-screen
or pinned surface must not be a transform, filter or containment ancestor of it.
A retained identity transform silently moves every `position: fixed` element
inside it, which is how a takeover ends up scrolling with the page.

### Phase E: the whole appearance, in one pass

Phase E refines the dark operational style. It does not replace it: the
surfaces, the workflow colours and the density stay, and what changes is the
craft. This is not delivered in slices. The whole system changes at once, and
every page is in scope.

**The nine rules.**

1. **One typeface system.** Inter for the interface, one mono for machine text
   (ids, money, counts, timestamps, keyboard keys). Nothing else. Before this,
   three families were in use and one of them, `'Outfit'`, was never loaded at
   all: the notification panel and the account menu silently rendered in the
   browser's fallback font.
2. **Nine type sizes.** `--fs-2xs` to `--fs-4xl`, replacing the twenty-eight
   sizes between 9px and 30px, half of them half-pixel steps.
3. **One palette, and it is natural.** Tokens only; no colour literal outside
   `tokens.css`. The warm graphite surfaces, the muted steel blue accent and the
   earthen state colours replaced a metallic gold and a violet/indigo range that
   made the console look like a launch page rather than a work surface.
4. **A readable floor.** Every step that carries text clears WCAG AA on the
   lightest surface it sits on: the ramp is 14.5:1 at the top and 4.8:1 at the
   quietest label. Disabled controls get their own step, because a disabled
   control is not text.
5. **No gradients.** Flat surfaces, hairline borders and type carry the design.
   The rule covers button fills, page backdrops, drifting glow blobs, skeleton
   sheens (now a settled pulse) and the SVG area fills.
6. **No emoji, no glyph stand-ins, and no sparkles.** Icons come from the icon
   set at four sizes, never from a character, and never from the set that reads
   as decoration: the sparkle, the lightning bolt and the star are gone from
   section markers, category maps and eyebrows.
7. **Nothing floats by default.** Elevation is reserved for surfaces that are
   genuinely above the page: modal, sheet, dropdown, command palette, toast, and
   there is exactly one shadow for all of them. Cards sit on hairlines, hover
   changes colour rather than lifting an element off the page, and no shadow is
   coloured: a coloured shadow reads as light leaking out of the component.
8. **Motion with a job.** Three durations: press, state change, entrance.
   Entrances fade and rise at most 6px and leave no transform behind, exits are
   faster than entrances, and nothing animates for decoration.
9. **A bar means a figure.** Every bar, rail or sparkline on a tile is the
   number beside it measured against a real denominator. Where there is no
   denominator the bar does not exist: it is not decoration and it is not a
   mood. Sparklines draw a real series.

**What the pass covers.**

- The palette itself: surfaces, lines, the text ramp, the accent, the four
  state colours and the workflow ramp, in `tokens.css`.
- Every page: the gradients, the glow blobs, the highlight sheens, the hover
  lifts and the one-off shadows come out; the `T` object each page carried is
  now tokens, so a page cannot reach the old palette even by accident.
- Every bar on every summary tile is driven by real counts or removed.
- `npm run check:visual` holds all of it, including a rule that fails on a
  `var()` that nothing defines, which is how a renamed token silently draws
  nothing.
- The `/preview` gallery shows the primitives, the tile family and the button
  hierarchy in every state.

**Connection status (one source of truth).**

Every page used to decide for itself whether the system was up. Some watched
`navigator.onLine`, some treated any failed request as an outage, and Settings
marked itself offline when a *save* was refused, so an online user without write
access was told "the system is offline, changes will not be saved".

There is now one store (`src/hooks/useConnection.ts`) that asks the backend
directly (an unauthenticated health endpoint), and everything reads it:

- The **top bar** shows a live indicator on every page: a dot and a word, with
  the word dropped on narrow phones where the dot and its accessible name carry
  it.
- The **shell** shows one banner under the top bar when the backend cannot be
  reached, and says which side is down: this device has no connection, or the
  device is online and the server is not answering. It is outside the route
  container, so it does not re-mount or re-animate on navigation.
- **Pages** no longer carry their own offline banners. They read the same state
  to explain an empty table or to hold a write back, which is the honest
  response: this app is used by staff standing in a laundry, and "Saved"
  followed by "Save Failed" is worse than "not now".
- A **refused request is not an outage.** A missing row, a policy or a missing
  permission all fail over a working connection, so a failure only counts as
  offline when it looks like one (no HTTP status and no PostgREST code).

**Colour.** Hue says what a thing is for, and the level says how loud it is:

- **Buttons** come in two levels per meaning. Solid fills (primary, ok, warn,
  destructive) commit something and use the deep step of their hue so the label
  keeps its contrast. Tinted fills (accent, confirm, caution, info, decline) are
  a flat wash of the same hue, for actions that do not need to shout.
- **Tiles** carry a flat wash of their own accent, a 3px accent rail and a
  tinted icon chip, so a row of figures reads as a set of different measures
  rather than a row of identical boxes. A chart card stays neutral.
- Every one of these is a flat colour mixed from the accent and the surface.
  None of it is a gradient.

**Two rules that came out of the live console.**

- **A figure on a screen comes from a record or it is not drawn.** The service
  mix used to open on four invented shares, and the ring's centre printed the
  sum of those percentages under the word "ORDERS". A tile, a bar or a share
  that was not measured is now either absent or, where the absence is the
  information, replaced by a line saying what is missing.
- **A save names the store and reports the server's reason.** Settings read and
  wrote a table that no migration creates, so the page could not be edited and
  reported the refusal as a possible access problem. The profile now lives in
  its own single-row table, `business_settings` (migration 010), because the
  console's other settings table holds booleans and has no room for a profile.
  A refusal names which of five things it was, prints the server's own words
  beside it, and hands the reader the SQL that fixes it, because the page cannot
  create a table or grant itself a privilege. Blanket advice is not advice: the
  first version of this told an owner to check their access when the table
  simply had no privileges, and the second told them the database was misconfigured
  when the policy was admins-only. Both were guesses. What replaced them is the
  cause, the server's sentence, and the one script that resolves it. The write
  policy also follows the console's own permission table now, so a role the
  System Admin screen grants edit rights to can actually save, instead of the
  UI promising an action the database refuses.

**A chart's size is a prop, not a style.**

Recharts measures the box it is given and then draws at the width and height it
was told. A media query that changes only the container's height therefore
shrinks the box and leaves the drawing at the taller size, and the chart paints
past its card. On phones that was 100px of chart below the Revenue and Busiest
Days cards and 60px below the Service Mix card, which is what "the lines spill
off their boxes" looked like.

Chart heights are chosen in JS from the same breakpoint the layout uses
(`useNarrowChart`), never in CSS. The same measurement is why a chart also needs
a card that can be narrower than the chart last measured itself: grid tracks are
written `minmax(0, …)`, cards carry `min-width: 0`, and each chart sits in a
`.rp-chart` box that clips, so nothing a chart draws can reach the card's edge
between a resize and the next measurement.

**The sign-in screen shows the work before it asks for a password.**

The company runs seven services and the console runs all of them, so the screen
shows all seven as photographs. A list of names was tried first and rejected:
this is the shop window, and the business is pictures of the work, not a
sentence about each service.

- One wide photograph carries the page title and the flagship service, Laundry,
  named in a chip on the picture. Nothing is shown twice: the band is Laundry,
  and Laundry is not in the grid below it.
- The other six are thumbnails: two across on a phone, three from 700px, each
  with the service named on a plate over the picture and one short line under it.
  Six fills every row at both counts, so there is never a ragged last row.
- Sign-in sits directly under the band on a phone, so the fields are one short
  scroll away, and beside the pictures from 1024px where the card holds its place
  while the grid scrolls. Above 900px the fields are 16px, which is the size that
  stops iOS zooming the page when one is focused.
- The connection pill stays in the header, before sign-in, because whether the
  system is up is the first thing staff need to know.

Layout rules that are easy to break later: the wide band and the card are both
allowed to be tall, but a thumbnail is always 4:3 and the band never grows past
its `min-height`. Every dimmed area is a flat translucent surface from the
palette, never a CSS gradient, because `check:visual` forbids gradients and the
flat plate holds its contrast better over an unpredictable photograph anyway.

Adding or removing a service is one entry in `SERVICES` in `src/pages/Login.tsx`,
plus its photograph in `public/services/<slug>.jpg`. The list is static on
purpose: the services table is behind a policy that needs a session, and this
screen runs before there is one.

The photographs are committed with the app, at 640x400 (the band at 1100x481) and
roughly 30kB each, so the screen never waits on a network picture. If one is
renamed or missing the frame falls back to that service's icon on its hue, so a
bad file shows a plain tile rather than a broken image.

**The page sits on the work, out of focus.**

The sign-in page is not black. Behind everything is one photograph of the
company's work, blurred and dimmed, fixed so it does not travel when the page
scrolls. It stays a background: the dim is a flat translucent surface over the
whole picture, so the fields, the card and the title keep their contrast
wherever the crop lands, and nothing has to be re-checked when the photograph is
replaced.

Three decisions, all of which look like mistakes to anyone who has not tried the
other way:

- The blur is baked into the file, at sigma 30, not applied in CSS. A live blur
  on a full-screen layer is repainted on every scroll frame, and on a phone that
  is felt while somebody is typing a password. The file is 39kB.
- The layer is `position: fixed` with `z-index: -1`, and the page establishes its
  own stacking context (`isolation: isolate`), so the backdrop can never climb
  over a card, a notice or the fields, whatever order the browser paints in.
- The handoff screen, the moment between a successful sign-in and the console,
  keeps it hidden: that screen is a moment, not a page.

To replace it, overwrite `public/services/login-backdrop.jpg` and re-run the blur
recipe (sigma 30, quality 70) or supply a blurred version. Nothing else changes.

**One mark, one name.** `src/components/brand/` holds the company name and the
logo path, and `BrandMark` renders it: `public/brand/logo.png` when that file
exists, and a drawn monogram when it does not, so a missing file can never leave
a broken image on the sign-in screen or in the sidebar. Drop the real logo at
that path and every placement picks it up: the sign-in screen, the sidebar, the
mobile top bar, the browser tab, the home screen icon and the offline cache.
`scripts/make-brand-assets.mjs` rasterises the tab and home screen sizes from
the same source (it needs `npm i -D sharp` once). The names in `public/` and the
pages that show them read from that one module, so renaming the business or
replacing the mark is a one-file edit.

**Wording rule.** Anyone who books through the customer app is a **customer**,
in copy and in the queue. **Client** is the console's own record: the Clients
page, the order's billing party, the client id. A sentence does not mix them.

**Money rule.** `GH\u20b5420.00`: the cedi sign, no space, always two decimals
in tables and totals, whole figures allowed in large hero numbers.

**Copy rules (repo-wide).** No em dashes. `npm run check:copy` fails on U+2014
anywhere in the repo; use a full stop, a colon, a comma or a middot separator
instead, and a plain hyphen for "no value" cells. En dashes survive only in
untouched pages and in the pickup-window values inside SQL migrations; new copy
writes ranges as "1 to 20" and those remaining pages will be normalised as they
are migrated. Long explanatory subtitles are out as well: a page subtitle states
what the page holds, nothing more.

**Consequence for phase 6+:** new pages must not regress the pinned chrome. Use
the page frame below for table screens instead of the plain `.page` wrapper.

### The first browser: what it found and what it fixed

The redesign was verified by static checks and by eye, because no browser could be
run here. That changed: Chromium arrives through the npm registry as the
serverless build, and with its libraries unpacked by hand it runs the console
for real. `scripts/audit-console.cjs` opens any list of routes at any list of
widths with a locally seeded session and measures what the definition of done
actually asks about: document overflow, elements past the viewport that nothing
clips, sideways scrollers with no name, and targets a thumb cannot hit.

Four defects it found, all fixed:

- **The top bar at phone width.** The account button, the bell, the search
  trigger, the New Order button, the connection pill and the page name were all
  competing for one 320px row. The bell was refusing to shrink, so it hung 42px
  off the right edge, and everything left of it was crushed: the brand mark was
  squeezed from 26px to 7px, which rendered its wordmark as a smear, and the page
  name was given a 12px-wide scroll strip. The bar now gives up the New Order
  button on phones (the FAB carries it first in its list, within thumb reach), the
  three controls are 40px, and the name truncates instead of scrolling.
- **`button` losing to `button`.** The rule hiding the New Order button on a
  phone did nothing at first, because `styles/components.css` is imported after
  `Topbar.css` and its plain `.btn` rule won the tie. Fixed with the weight the
  cascade actually needs, `.topbar .topbar-action`, not by adding an exemption.
- **The demo walkthrough overflowed a phone by 64px.** `.preview-gallery` asked
  for `minmax(360px, 1fr)`, a floor wider than the screen it was on. It is
  `minmax(min(360px, 100%), 1fr)` now, so the floor collapses to the column it
  is given.
- **The auth session shape.** Not a product defect, but worth writing down: the
  audit seeds `sb-<project-ref>-auth-token` in localStorage, which is where
  supabase-js keeps the session the console reads.

What the browser then proved, at 320, 768 and 1440, across all eighteen console
pages: **no document overflow, nothing past the viewport, no unnamed sideways
scrolling, no page errors.** The notification panel and the account menu open
fully inside the screen at 320, 375 and 414, with the page dimmed behind them and
not scrolling.

What it does not cover: the backend is unreachable from here, so every page below
the shell is an empty or skeleton state. Layout is measured; data, wording and
the feel of a list full of real records still need the deployed console and
eyes.

### Phase E closes: the last 658 sizes onto the scale

The palette half of E landed much earlier. The type half was the largest single
change in the redesign: 664 declarations across 32 files were off the scale, 356
in stylesheets and 274 in inline styles, plus 34 font stacks that were not one of
the two shared ones. Every one of them is now a `--fs-*` step or `var(--font-ui)`
/ `var(--font-mono)`, and `scripts/check-visual.mjs` has no exempt list any more:
every file in `src/` is checked, and a new file has to arrive on the scale.

The mapping, applied in one pass, with ties rounded **up** because the ask behind
this work was "more visible, bigger or well arranged":

| was | became | step |
| --- | --- | --- |
| 9, 9.5, 10, 10.5, 11 | 11 | `--fs-2xs` |
| 11.5, 12 | 12 | `--fs-xs` |
| 12.5, 13 | 13 | `--fs-sm` |
| 13.5, 14, 14.5 | 14 | `--fs-md` |
| 15, 15.5, 16 | 16 | `--fs-lg` |
| 17, 18, 19 | 18 | `--fs-xl` |
| 20, 21, 22, 24 | 22 | `--fs-2xl` |
| 26, 27, 28 | 28 | `--fs-3xl` |

What that did to the product: of the 630 declarations that pair one to one
between the two revisions, 362 are the same size as before, 259 grew and 9
shrank, and nothing moved by more than 2px in either direction. The
growth is concentrated where it matters, in the two smallest sizes, which is
where the "more visible" ask pointed: 146 declarations of 9 to 10.5px, mostly
table meta and micro labels, are now 11px, and the seven 20px headings are 22px.
The three that came down (14.5 and 19 to 14 and 18, 24 to 22) were values that
sat between two steps with a nearer neighbour.

Two holes in the guard were found while doing this, and both are closed:

- **`fontSize={11}`.** An SVG attribute and a chart's tick prop need a number, and
  the guard's rules only looked at `font-size:` and `fontSize:`. Four chart ticks
  and a ring label were hiding there, one of them at 9px. Numbers are now checked
  against the scale's own values, in value positions only: in
  `size > 48 ? 12 : 11` the 48 is a threshold, and flagging it would teach people
  to ignore the check.
- **Page-local font aliases.** `--sf-font`, `${FONT}` and `font-family: inherit`
  all end at the same stack, but a reader of the file cannot see that, and the
  guard could not either. They now name `var(--font-ui)` / `var(--font-mono)`
  directly.

The risk in a sweep this size is not a wrong token, it is text overflowing what
used to hold it. That was checked rather than hoped: for every block that sets
both a size and a `line-height` or a fixed `height`, the old and new values were
compared, and there is no case where the new size no longer fits what fitted
before.

### Phase F: the console's end of every app flow

Every request the app sends has an end in the console, and Phase F is about that
end being complete and honest. The four intake screens already read the live
tables and update themselves; what follows is what they were missing.

**Two events reached nobody.** A customer answering the appointment the office
offered on a service request, and a customer creating an account in the app.
Both changed the database and moved a number in the side menu, and neither told
anyone. They now raise an alert, like the laundry answers already did.

**The alert panel only says true things.** It used to list the ten newest rows of
each table whatever had happened to them, so a closed request still read as a new
one ("This one needs a date from CPL" on a job the customer had already
accepted), and an idea somebody had already dealt with still read as unread. Each
query now asks for exactly the rows that still need somebody: intakes nobody has
answered, the two kinds of customer reply, unread ideas and recent signups. A
rejected laundry date says the request is closed, because that is what the
database does with it (migration 20260827_008).

**An account now shows what that person asked for.** Opening an account in App
Accounts lists their five most recent requests from both queues, in the state
each one is in, with links into the two queues. Ordering is by when the customer
asked, for both queues: a laundry request's preferred pickup date is a different
kind of time from a service enquiry's arrival, and sorting by a mixture of the
two would order the list by nothing. The list-page rule holds too, the same one
the KPI cards follow: a figure or a line is drawn from a record or not at all. If
a queue cannot be read, the panel says which one rather than showing a short list
as if it were the whole story.

**The office can act on what the app sends.** An idea carries the customer's
number, and the number is now a call link rather than text to copy out.

**An alert opens the view that holds what it is about.** Both queues already had
their own views (Needs action, Waiting for client, Approved work, Declined
history; and Needs a date, With the customer, Accepted, Wants another date, Not
taken), and an alert used to land on whichever view the page happened to open
on. So "Customer accepted the date" took the office to a list that did not
contain the request, and it looked as if the alert were wrong.

The view now lives in the address as well as in state: `/mobile-requests?view=confirmed`,
`/service-requests?view=another`. The page opens on it, follows it if it changes
while the page is already open, and writes it back when a staff member changes
the view themselves, so "the approved work" is a link that can be shared. Each
page exports its own list of views, and a check proves that every alert's link
names a view that page actually has, because a typo there would send the office
to the default view and look like the page ignoring them.

Two decisions worth keeping:

- The alert list holds only live work. A list that keeps last week's resolved
  jobs is a list nobody reads, and it buries the one row that matters.
- Alerts are per staff member and stored in the browser, so the unread count
  means "new since I last looked". That predates Phase F and is unchanged.

### The company name, and the logo pipeline

The company is **Chapman Prestige Limited**, abbreviated **CPL**. Nothing else.
`Chapman` on its own and `Chapman Prestige` without `Limited` were removed
everywhere a person can read them: page titles, the sidebar, receipt headers,
badge tooltips, notification copy, download file names (`cpl-*.csv`,
`cpl-export-*.json`), the browser tab, the web app manifest and the customer
app on the phone.

Three things keep the old spelling on purpose, because renaming them is not a
text change:

| Kept | Why |
| --- | --- |
| `is_chapman_staff()`, `is_chapman_admin()`, `chapman_app_*` tables | Live database functions and tables. Row level security policies call the functions by name, so a rename inside the app without a migration locks every user out. |
| `chapman-query-cache`, `chapman-staff-alerts-read:` | Browser storage keys. Changing them only discards each user's cached data and read markers. |
| `Chapman Prestige Limited - Kumasi` | A branch name, stored as data in the database. |

The mark comes from one file. `src/components/brand/BrandMark.tsx` shows
`public/brand/logo.png` when it exists and falls back to the drawn `CPL` letters
otherwise, so nothing can show a broken image. `public/brand/monogram.svg` is
that drawn mark, and `scripts/make-brand-assets.mjs` rasterises it, or the real
logo, into every size the browser and the phone ask for:

```
```
node scripts/prepare-logo.mjs public/brand/cpl-logo.jpg   # background out, square, 1024px
node scripts/make-brand-assets.mjs                        # every icon, console + phone
```

The supplied artwork is 99 pixels wide. Its three letters take about twelve of
those pixels, which drives two rules that are easy to break by "improving" them:

1. **Under about 44 pixels of placement the artwork is a smudge.** At 32px each
   letter is under four pixels. So the 16px and 32px favicons use the drawn
   monogram, which is legible at 16px, and everything larger uses the artwork.
   `BrandMark` follows the same rule: artwork at `lg` and `xl`, drawn letters at
   `sm` and `md`.
2. **The artwork is navy.** On the navy chip, and on a dark phone home screen, it
   would disappear. So every icon that carries it carries it on a light plate,
   which is the background it was drawn on. `BrandMark` puts that plate behind
   the chip at the sizes where it uses the artwork.

`prepare-logo.mjs` removes the paper by brightness alone. The earlier version
also required a pixel to be colourless before treating it as background, to
protect pale tints in artwork; that was wrong for this logo, because the inside
of its droplet is paper white (253, 253, 253, measured), and the colour rule
punched the droplet out of the mark.

`prepare-logo.mjs` takes a logo that arrived on a white background, makes the
paper transparent without touching the mark's own colours, takes the white back
out of the anti-aliased edges so it does not halo on a dark surface, trims the
surrounding emptiness and re-centres it on a square canvas. It is the only step
between the supplied artwork and every icon in the product.

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
