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
- [x] Connection status, and the Settings page bugs that came with it.
  - [x] One store (`useConnection`) asks the backend itself, so the app can say
        whether it is live on every page. Top bar: a dot and a word, word hidden on
        narrow phones. Shell: one banner under the top bar, naming which side is down.
  - [x] Settings no longer claims to be offline: the false banner came from a refused
        write and a refused read both being treated as network failures, and from the
        page keeping its own copy of the connection. A refusal is now reported as a
        refusal, and Settings, Staff, Security, Services, Payments, Receipt, Orders,
        System Admin and Login all read the shared state instead of guessing.
  - [x] "Configuration applies to Main Branch. Additional branches inherit these
        settings." is removed: there are no branches in the data model, so the line was
        inventing a product.
  - [x] Colour pass: buttons gain a tinted level per meaning (accent, confirm, caution,
        info, decline) beside the solid ones; summary tiles on Staff, Clients and
        Reports carry a flat wash of their own accent plus a rail and a tinted icon
        chip; every remaining old-palette literal in the pages (indigo, gold, navy,
        cyan, neon green) is on tokens, and the last coloured button glows are gone.
- [x] Two reports from the live console.
  - [x] The dashboard service mix opened on four figures (Laundry 42%, Cleaning
        28%, Fumigation 18%, Car Detail 12%) that were the app's own placeholder,
        and the mix was recomputed only when there were order items to count, so
        a database without any showed the placeholder as if it were real. The mix
        is now built from the items on the orders: counts on the ring, shares in
        the legend that add up, everything past the third category grouped as
        Other rather than dropped, the centre showing the real number of items,
        and an empty state that names the reason when there is nothing to draw.
  - [x] Settings could not be saved at all. The page read and wrote a flat
        `settings` table (business_name, express_surcharge, sheet_password, ...)
        that no migration creates, so the read came back with nothing and the
        write was refused; the page then reported the refusal as a possible
        permission problem, which sent the reader looking in the wrong place. It
        now stores its profile in `system_settings`, the console's key/value
        table, under one key, updating the row and inserting it if it is not
        there. A refused write reports the database's own reason, and a refused
        read says that what is on screen are built-in values rather than saved
        ones.
  - [x] The follow-up on that: `system_settings.value` is a boolean column, so
        the profile could not be stored there (the database answered 22P02).
        Settings now uses its own single-row table, `business_settings`, created
        by migration `20261007_010_business_settings.sql`, and the page shows the
        SQL to run when that table is not in the database yet, with a copy
        button. The page reads the profile from row 1, writes it with one upsert
        and confirms the row came back, so a save that matched nothing can no
        longer report success.
  - [x] The second follow-up: the table existed but the role had no privilege
        on it (a SELECT refused with 42501, which RLS alone never does). A table
        created through raw SQL does not necessarily inherit the privileges
        Supabase's tooling grants to authenticated, so migration 010 and the SQL
        the page offers now include the grants, revoke anon, and replace the
        admins-only write policy with one that mirrors the console's own
        permission table: admins, or any role whose Settings permission allows
        editing. The page also names which of the five causes it hit and prints
        the server's own words beside it.
- [x] Reports: the chart lines spilled out of their cards, most visibly on a
      phone. Two causes, both mine, both structural rather than data:
  - [x] the phone media query set the chart container's height in CSS while
        recharts draws at the height it is given as a prop, so the box shrank
        and the chart did not: 100px of chart below the Revenue and Busiest Days
        cards, 60px below Service Mix. Heights are now chosen in JS from the same
        breakpoint, and the CSS override is gone.
  - [x] the chart cards are grid items, and grid items default to `min-width:
        auto`, so a chart that measured itself wide kept the track wide and
        painted past the card. Tracks are `minmax(0, ...)`, cards carry
        `min-width: 0`, and every chart sits in a `.rp-chart` box that clips.
  - [x] Chart heights: 320/280 on tablet and desktop, 210/200 on a phone.
- [ ] Next, in order:
  - [ ] Type, on the scale. The palette rule is met everywhere now; with the
        guard's pending list emptied it reports 624 font-size declarations and 34
        font-family declarations outside `--fs-*` and the two font stacks. That is
        the "more visible, bigger or better arranged" half of the appearance ask,
        and it touches every page, so it wants its own pass.
  - [ ] Then Phase F, then sign-off.
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
