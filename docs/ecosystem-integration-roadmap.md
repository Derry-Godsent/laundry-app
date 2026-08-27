# Chapman Ecosystem: Clear Plan From Here

This is the simple plan for making the website, customer mobile app, staff system, and database work together. It is written to show what is already complete, what still needs to be built, and when Chapman needs to make a decision.

## What each part does

| Part | Its job | Current position |
| --- | --- | --- |
| Website | Introduces Chapman Prestige Limited and encourages customers to use the service. | Complete and independent. |
| Mobile app | Lets customers browse services, choose a date, request service, track progress, earn rewards, and contact Chapman. | Customer experience is built; live business data is not connected yet. |
| Staff system | Lets the Chapman team manage prices, services, customers, orders, payments, and staff work. | Existing staff work remains in place. |
| Supabase | Holds the shared business records behind the staff system and mobile app. | It needs its temporary test permissions tightened before the mobile app can safely use live customer data. |

## What is already done

- [x] Chapman website is available.
- [x] Staff system is available.
- [x] Customer mobile app screens, onboarding, service information, booking forms, date choices, tracking design, chat design, rewards design, profile, and splash experience are built.
- [x] The app is connected to the same Supabase project in a **non-live customer mode**.
- [x] A separate GitHub branch contains the first security preparation. It does not change the master branch or the live system.
- [x] A plain backup guide is included in this branch for the day we are ready to change live database permissions.

## What is not live yet

- [ ] Customers cannot yet receive a real phone verification code.
- [ ] A customer booking in the app does not yet appear in a staff queue.
- [ ] A staff member cannot yet propose a date that the customer accepts in the app.
- [ ] Customer tracking, human chat, payment confirmation, rewards, and promotions are not yet connected to staff actions.
- [ ] The staff system does not yet have the extra screens needed for phone requests.

## The right order to build the connection

### Step 1: Close the temporary database doors

During testing, some database permissions were left broad so development was easier. Before the mobile app reads or writes live customer information, those doors must be closed.

The prepared change will do three simple things: staff keep using their current dashboard; a customer can see only their own information; and nobody can change prices, staff accounts, payments, or other customers through the mobile app.

**What I can do:** apply the reviewed change and test it with the existing staff system.

**What Chapman does:** nothing yet. Immediately before the live change, make a private database backup if you want a recovery copy. Git protects code; a database backup protects the live customer, order, price, and settings records. The backup is not needed to continue development today.

### Step 2: Add one new staff page called Mobile Requests

This is the missing bridge between the phone and the staff system. It is a new staff page, not a replacement for the current New Order page.

1. A customer taps **Confirm Laundry Booking** in the app.
2. The request appears in **Mobile Requests** for Chapman staff.
3. Staff checks the requested date and pickup area, then offers a real time.
4. The customer sees the offer and accepts or rejects it in the app.
5. When accepted, the staff system creates the normal operational order.
6. The customer can then follow the order progress in the app.

**What I can do:** build this new page and the supporting records in the GitHub branch without changing your existing staff pages.

**What Chapman decides:** who checks this page each day. If you do not choose yet, the safe default is **Admin**.

### Step 3: Make Laundry work end to end first

Laundry has fixed prices, so it is the safest first service to connect.

- [ ] Show live customer-safe laundry prices in the app.
- [ ] Send a laundry request from the app to Mobile Requests.
- [ ] Let staff offer a date and time.
- [ ] Let the customer accept, reject, or request another date.
- [ ] Turn an accepted request into the current staff Order process.
- [ ] Show real order updates and a receipt to that customer only.
- [ ] Add basic Admin support messages linked to the booking.

When this works smoothly, the app and staff system will already be genuinely connected.

### Step 4: Add services that need a quote

Deep Cleaning, Fumigation, Car Detailing, Sofa and Carpet Cleaning, Polytank Sanitization, and Contract Cleaning need staff assessment before final price.

For these services, the phone app will send the customer’s answers, photos, measurement, preferred date, and location into a **Quote Request**. Staff then writes a quote. The customer accepts or rejects it in the app before it becomes an Order.

- [ ] Add Quote Requests to the staff system.
- [ ] Add customer photos and measurement review.
- [ ] Add staff quote builder and customer acceptance.
- [ ] Connect each quoted service one at a time.

### Step 5: Add payments, notifications, chat, and rewards

These need a real staff process before the app can show them as live.

- [ ] Add payment records so a Mobile Money, card, or cash selection becomes a verified payment result and receipt.
- [ ] Send real app notifications for request received, date offered, date confirmed, job progress, and completion.
- [ ] Add staff Inbox for Admin, CEO, and Contact Us messages.
- [ ] Add a loyalty record so bonuses and rewards are calculated from completed orders, not just displayed in the app.
- [ ] Add Campaigns so promotions and holiday announcements are approved and sent by staff.

### Step 6: Add larger growth features

These are valuable, but they should follow after bookings work properly.

- [ ] Saved routines and service subscriptions.
- [ ] Worker Marketplace requests, kept separate from Chapman internal staff.
- [ ] Optional live-location sharing for active jobs only.
- [ ] Full customer activity history and business reports.

## The only choices Chapman needs to make now

| Decision | Safe default if you do not choose now |
| --- | --- |
| Name of the new staff queue | **Mobile Requests** |
| Who checks new phone requests | **Admin** |
| First live service | **Laundry** |
| Who receives CEO messages first | **Admin routes them to CEO when needed** |
| Payment provider | Decide later, after Laundry requests and dates work correctly |

## What happens next

The next development task is **Step 2: build Mobile Requests in the staff system**, plus the supporting appointment and request records. This can be built and checked in the GitHub branch first. It does not require a production database change today, and it does not disturb the existing New Order, Orders, Staff, Services, Payments, or Reports pages.

When that work is ready, you will see exactly what the staff page looks like before we connect it to live app bookings.

## About the backup

You do **not** need to make a backup now to keep building. You need it only before the one live database-permission change in Step 1. If we ever need to undo that live change, the backup protects the business records. The private instructions are in `docs/production-security-backup-checklist.md`; never place database files, passwords, or connection strings in GitHub or chat.
