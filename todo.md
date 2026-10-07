# Staff System TODO

- [x] Add a protected Mobile Requests page for Laundry-first customer bookings.
- [x] Add safe staff actions to review, confirm or decline a mobile request, and preserve the customer date choice.
- [x] Connect the mobile Laundry booking flow only after the staff request page is validated.
- [x] Verify one customer-created Laundry request appears in the live staff Mobile Requests queue.
- [x] Merge the reviewed Mobile Requests feature into the live staff-system master branch and confirm the production deployment.
- [x] Point the normal staff-system address to the successful Mobile Requests production deployment without a Vercel login wall.
- [x] Add a customer-only response action for an accepted or rejected proposed Laundry date.
- [x] Superseded the disappearing-queue behaviour with managed request views so no staff record is lost from view.
- [x] Let staff confirm a request using the client’s originally selected date, without showing a date field.
- [x] Keep active, waiting, approved, and declined mobile requests in clear staff management views with matching client decision labels.
- [x] Add optional client-approved one-time pickup coordinates to Laundry requests for authorised staff dispatch.
- [x] Repair existing customer account links so verified customers can submit Laundry requests after the protected database migration
- [x] Add one shared design vocabulary (tokens + component library) so every staff screen looks like the same product.
- [x] Rebuild the console shell: grouped navigation with live counts, glass topbar with search and alerts, consistent page headers.
- [x] Rebuild the Dashboard on the shared components, keeping the live figures and charts unchanged.
- [x] Rebuild the Mobile Requests queue so a record's state, client date and decision are readable at a glance.
- [x] Add a credential-free `/preview` page that renders the redesign from sample records for review before sign-in.
## Staff console redesign: phases

Full notes, rules and the resume instructions live in `docs/staff-console-redesign.md`.

- [x] Phase 1, design system: tokens, shared stylesheets, `@/components/ui` primitives.
- [x] Phase 2, app shell: grouped sidebar with live counts, topbar, layout, palette, menus, FAB.
- [x] Phase 3, Dashboard rebuilt on the shared components.
- [x] Phase 4, Mobile Requests queue rebuilt around one decision panel.
- [x] Phase 5, Orders: rebuilt, reverted, then restyled with the LAYOUT KEPT. The original page was
      restored at 274fa56 (byte-for-byte against 5512924), then reworked onto the shared system:
      the `.table-page` frame, `@/components/ui` controls, the `--stage-*` ramp and `Orders.css` for
      the order-specific pieces. Pinned title/filters/pagination, one scrolling list and card-style
      rows on phones all survive. Data logic untouched. The rejected rebuild stays at 22f31ed.
      The toolbar controls keep their original compact look (auto-width selects with their own caret,
      labelled Refresh Data, icon-only list/pipeline switch) because that is what staff recognise.
      Also: `npm run check:copy` now fails on any em dash in the repo, and `/preview` section 3 shows
      the order book frame with sample orders.

## Mobile-first pass (phases A to F)

Approved order: foundation, shared patterns, daily operations, the rest of the
app, appearance review, then mobile app integration. Full scope, target widths,
the five-screen correctness pass and the definition of done live in
`docs/staff-console-redesign.md` section 6.

- [x] Phase A, responsive foundation: one shell, `100dvh`, safe areas, one scroll
      area per page, compact mobile top bar, stable drawer, notification panel that
      stays on screen, shared breakpoints (320/360/390/430/768/1024) and padding tokens.
- [x] Phase B, shared mobile patterns: `FilterBar`, `RecordList`/`RecordRow`, `DetailView`,
      `ActionBar`, `Modal`, `ConfirmDialog`, `LoadingRows`, `ErrorState`, plus the phone
      treatment of the page header and summary tiles. Demonstrated in `/preview`
      section 5 inside the width probe.
- [x] Phase C, daily operations: Mobile Requests and Service Requests migrated to the
      shared patterns (record rows, `DetailView` takeover at 900px, decisions in the pinned
      action bar, `SegmentedControl` views, `EmptyState`, `LoadingRows`, `Banner`). Orders
      audited at 320 to 430px (the 1060px table floor is already released at ≤640px, cells
      carry `data-label`). New Order: `ActionBar` pins `Create Order` with the amount due on
      phones. Clients: the phone list is document flow, so the single scroller is `.main-body`.
      Verified with `tsc -b`, `vite build`, `check:copy` and a 25-point structural check.
- [x] Phase D, the rest (landed in slices, one commit each):
  - [x] D1, Staff + System Admin + Reports, plus a 320px overflow on the Dashboard
        loading skeleton. Staff: cards start where the table floor is released, panes sized
        to the visual viewport, shared `LoadingRows`, 16px fields, thumb-height controls.
        System Admin: the `min-width: 760px` floor that scrolled the staff table and clipped
        the logs table is released, the permissions matrix keeps its header as a named
        sideways scroller, the Add Staff dialog becomes a bottom sheet, the tabs slide.
        Reports: the range buttons were ~400px wide and pushed the page sideways at 320px;
        they are a slide strip now, the header stacks and charts drop to 220px on a phone.
  - [x] D2, Dashboard, App Ideas, App Accounts. App Accounts uses the shared `DetailView`
        takeover at 900px, with the list scrolling only on a desk, shared states and tokens,
        a 16px search field and two-up tiles. App Ideas uses `Banner`/`EmptyState`/`LoadingRows`,
        shared padding, a stacked header, thumb-height status buttons and wrapping idea text.
        Dashboard's area chart now measures its box instead of scaling a 600-unit drawing
        (its phone labels were rendering at about 4px), with label spacing from the measured
        width; the loading skeleton is fluid and quick actions are thumb sized.
  - [x] D3, Services, Payments, Receipt. All three fill the shell frame instead of owning
        the viewport, use the page padding tokens, reach 16px fields and thumb-height buttons,
        and size their dialogs to the visible area as bottom sheets. Payments' ten-column
        table is now labelled cards (it was a sideways scroll to reach the receipt button).
        Receipt's phone layer is `@media screen` only, so the print stylesheet is untouched.
  - [x] D4, Security, Settings, Login, Help, Profile, then the `legacy-bridge` cleanup.
        Security: both 640px tables become labelled cards at 900px (roles and audit), fields
        16px, tabs and buttons thumb height, toast clears the hidden strip. Settings: the
        inline `overflowY: auto` body wrapper is gone and the CSS's already-written body hook
        is actually used, the four `1fr 1fr` grids stack, loyalty rows wrap, fields 16px, toast
        clears the hidden strip. Login: heights follow the visible viewport, 16px fields from
        900px down (they used to start at 480px, so the first screen a phone opens zoomed on
        focus) and it handles its own safe-area inset. Help and Profile: screen-only phone
        layers with shared padding, thumb-height FAQ rows and a stacking pair. The bridge
        `src/styles/legacy-bridge.css` is deleted: its two platform rules moved to `base.css`
        PLATFORM GUARDS (16px field floor, legacy wide-table scrollers) and the CSS no longer
        contains any attribute substring selector.
- [x] Phase D, the rest: Dashboard, App Ideas, App Accounts, Staff, Services,
      Payments, Receipt, Reports, Security, Settings, Help, System Admin, Login, Profile.
      All fourteen screens have had their mobile pass. Verified with `tsc -b`, `vite build`,
      `check:copy` and a 30-point structural check across the ten D4 files.
- [x] Phase D follow-up, three things reported from a phone.
      The takeover on Mobile Requests and Service Requests scrolled with the page (its bar and
      its Send date button moved) because `.route-transition` and `.page` kept a transform from
      their entrance animations, which made them the containing block for `position: fixed`
      descendants; all finite entrance keyframes now land on `transform: none` (33 of them) and
      `DetailView` renders its takeover on `<body>`, through `useOverlay`, so Escape closes it,
      focus stays inside and the page behind is frozen. The notification panel clipped a long
      list, could not scroll it and let the swipe reach the page; the list is now the scroller of
      the panel's flex column, the panel is capped by the visible viewport and on a phone it is a
      sheet under the top bar with a backdrop that swallows the gesture, a close button, always
      visible thumb-sized row actions and the page locked. Mobile Requests now resolves the real
      customer through `customer_accounts` and, failing that, the linked `clients` row, showing
      the name and number in the queue, the header and the detail; the placeholders that claimed
      "Verified customer" are gone.
- [ ] - [x] Phase E, the whole appearance, in one pass. Not slices: every page and every
      primitive, landed together.
  - [x] The palette. Warm neutral graphite surfaces, one muted steel blue accent, four
        earthen state colours and a workflow ramp, all in `tokens.css`. The metallic gold
        and the violet/indigo range are gone, along with the blue-black surfaces that made
        the console read as "galaxy" rather than as a dim room. Text ramp: 14.5:1 at the top,
        4.8:1 at the quietest label, one separate step for disabled controls.
  - [x] Gradients, glows and lifts. Every page backdrop wash, drifting orb, blurred corner
        glow, gradient button fill, gradient tab rule and highlight sheen is out. Nothing
        lifts on hover: hover changes surface, border or brightness. One shadow for every
        overlay (dropdown, sheet, drawer, modal, palette) and no coloured shadow anywhere.
  - [x] Real icons. The sparkle, the lightning bolt and the star are gone from section
        markers, category maps, eyebrows and status glyphs. Service categories, loyalty
        tiers and quick actions use icons that describe the thing. No emoji or glyph
        stand-ins left anywhere in `src`.
  - [x] Bars that mean something. The summary tiles on Staff and Clients drew a fixed 62%
        and 75% bar under every figure. Both now draw the figure as a share of a real
        total with the ratio in the tooltip, and draw nothing where there is no total.
  - [x] One palette per page. The nine pages that carried their own `T` colour object now
        read the tokens, which removes the second palette by construction: a page cannot
        reach the old colours even by accident.
  - [x] `npm run check:visual` now also fails on a `var()` that nothing defines, which is
        how a renamed token silently draws nothing. Two files (Login.css, Login.tsx) have
        left the PENDING list entirely; the rest are the pages still carrying raw literals
        and off-scale sizes in their own CSS.
- [ ] Phase F, mobile app integration: Mobile Requests, Service Requests, customer
      replies, App Ideas, App Accounts, realtime alerts, staff actions from the app.
- [ ] Phase G, sign-off: delete `/preview` (route, page, CSS) and close PR #7.

- [x] Phase C follow-up, zoom on a phone: fields are 16px from 900px down so iOS cannot
      zoom on focus, and the visual viewport is published as `--vv-h` / `--vv-top` /
      `--vv-bottom` so the takeover screen, modal, drawers, notification sheet, pinned action
      bar, pagination, floating button and toast all stay inside what is on screen at any zoom
      level and with the keyboard open.

Riding along with A and B, a minimal correctness pass for the five screens that are
broken on phones rather than only unpolished: Clients, Staff, System Admin, Reports,
New Order. Presentation only, no data logic.
