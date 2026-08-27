# Mobile Requests: Laundry-First Design

The operations system uses protected browser routes within `MainLayout`. Sidebar entries appear only when the signed-in staff member has a matching `role_permissions` record with viewing access.

The new page will use the route `/mobile-requests` and the permission key `mobile-requests`. It will start with a clear Laundry-first empty state and will not alter the Orders, Clients, or New Order pages. A later mobile connection will create its own request record first; staff will decide when to turn an approved request into an existing operational order.

## Staff access and layout

The new page will use the existing `usePermission` guard. It will be available to the `admin` and `manager` roles, with editing reserved for those same roles. The page will follow the dark operations layout used by Orders: a compact header, count cards, a filterable request list, and a details panel. It will not change the current order list or create any test bookings.

## Laundry request record

Each request is separate from an operational order. It stores the verified customer link, requested and confirmed dates, collection details, selected laundry items, express choice, estimate, customer note, staff note, and review status. Staff can mark a request under review, propose a date for customer acceptance, confirm it, or decline it. Each staff decision is recorded in a request timeline.

Customers will only be able to read their own requests and timeline. Staff retain their existing operational access. The app will not submit records until the staff page is validated.

## Validation record

The isolated staff feature branch built successfully in its deployment preview. Both new records have row-level security enabled. The requests record has three access policies: authorised staff can read and manage requests, while customers can only read a request tied to their own account. The events record has separate staff and customer read policies.
