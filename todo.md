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
      Also: `npm run check:copy` now fails on any em dash in the repo, and `/preview` section 3 shows
      the order book frame with sample orders.
- [ ] Phase 6, Clients and Staff registers (KPI rows, tables, modals).
- [ ] Phase 7, Settings, Security, System Admin.
- [ ] Phase 8, Services, Payments, Receipts, Reports.
- [ ] Phase 9, Service Requests, App Ideas, App Accounts.
- [ ] Phase 10, after sign-off: delete the `/preview` page, its route and its CSS.
