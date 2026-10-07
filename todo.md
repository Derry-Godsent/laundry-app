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
- [ ] Phase D, the rest: Dashboard, App Ideas, App Accounts, Staff, Services,
      Payments, Receipt, Reports, Security, Settings, Help, System Admin, Login, Profile.
      Landed in slices, one commit each:
  - [x] D1, Staff + System Admin + Reports, plus a 320px overflow on the Dashboard
        loading skeleton. Staff: cards start where the table floor is released, panes sized
        to the visual viewport, shared `LoadingRows`, 16px fields, thumb-height controls.
        System Admin: the `min-width: 760px` floor that scrolled the staff table and clipped
        the logs table is released, the permissions matrix keeps its header as a named
        sideways scroller, the Add Staff dialog becomes a bottom sheet, the tabs slide.
        Reports: the range buttons were ~400px wide and pushed the page sideways at 320px;
        they are a slide strip now, the header stacks and charts drop to 220px on a phone.
  - [ ] D2, Dashboard, App Ideas, App Accounts.
  - [ ] D3, Services, Payments, Receipt.
  - [ ] D4, Security, Settings, Login, Help, Profile, then the `legacy-bridge` cleanup.
- [ ] Phase E, overall appearance: palette, type, surfaces, border contrast, spacing,
      button hierarchy, status colours, icons, states, motion, wording. Refine the dark
      operational style rather than replacing it.
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
