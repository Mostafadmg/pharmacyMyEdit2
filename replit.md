# PharmaCare Digital Pharmacy

## Overview

A full-stack UK digital pharmacy platform providing online minor ailment consultations reviewed by a pharmacist prescriber. Built to a clinical standard matching GPhC compliance requirements, inspired by Pharmacy2U and MedExpress.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/pharmacy)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Routing**: Wouter
- **Forms**: react-hook-form + zodResolver
- **Animations**: Framer Motion

## Consultation Form

The consultation form (`artifacts/pharmacy/src/pages/Consultation.tsx`) uses a 5 or 6 step flow (6 when photo required):
1. **Safety Check** — one eligibility question per screen with YES/NO cards; blocking answer detection auto-navigates to "Not suitable" page; mini progress dots track position; 350 ms delay before advancing on YES.
2. **About You** — personal details (name, email, age, sex, pregnancy)
3. **Symptoms** — one clinical question per screen with auto-advance on radio selection; back navigation via `clinicalIndex` decrement; progress shown as `X / N`
4. **Medical Background** — allergies, medications, medical history (with "none" checkboxes)
5. **Photo Upload** — shown only when `condition.requiresPhoto = true`
6. **Review & Submit** — full summary with edit links, consent checkbox, submit

Condition-specific questions are defined in `artifacts/pharmacy/src/data/conditionQuestions.ts` (original set) and `artifacts/pharmacy/src/data/newConditionsData.ts` (catalogue expansion). `getConditionQuestions(id)` resolves both maps plus an alias table.

`chlamydia` has `requiresPhoto: false` (April 2026 fix — STI self-test result photo requirement removed).

## Features

### Patient-facing
- Landing page with hero, how-it-works, categories, trust badges
- Browse 50 treatable conditions grouped by category
- Condition detail pages with eligibility info
- Condition-specific step-by-step consultation (MedExpress/Pharmacy2U style)
- Eligibility blocking (red flag screening, unfit answers show "Not suitable" page)
- Patient consultation tracking (by email)

### Pharmacist Dashboard
- Overview stats: pending, approved today, red flags
- Consultation queue with filtering by status
- Full consultation review screen
- Structured action modals (April 2026 upgrade):
  - **Approve & prescribe** — confirm modal with prescription summary
  - **Request More Info** — message modal with quick-ask suggestion chips, posts to patient chat thread
  - **Refer** — modal with recipient type (GP / Hospital specialist / A&E / NHS 111 / Sexual health / Mental health / Other), recipient name, urgency (Routine / 7 days / Urgent / Emergency 999), and a note
  - **Reject** — modal with radio reason categories (Medically unsuitable / Outside scope / Insufficient info / Already prescribed / Other) plus required explanation textarea
- Every action recorded in the `consultation_actions` audit table and surfaced as a notification + chat message to the patient
- Red-flag warning banners

### Patient ↔ Pharmacist Messaging (April 2026 upgrade)
- New `consultation_messages` table — chronological chat thread per consultation, both sides can post.
- New `notifications` table with bell icon in patient header (`<NotificationBell>` in `Header.tsx`) showing unread count and recent items, mark-read + mark-all-read.
- `MyConsultations.tsx` consultation card has an "Open conversation" toggle that embeds `<ConsultationChat>` (8s polling, quick-replies, action timeline pills).
- Pharmacist mobile app and web both write to the same thread; `consultation_actions` events render inline in the timeline.
- **Auth resolution**: `requirePatient` and `resolveAuthActor` (`middlewares/auth.ts`) look up the patient account by id from the bearer and attach `email` to `req.authActor`. `/notifications` and `/consultations/:id/messages` use that resolved email for ownership/recipientKey checks so legitimate patients can read their own messages and notifications.
- **Atomic review**: `POST /api/consultations/:id/review` wraps the consultation status update + `consultation_actions` audit row + chat message + patient notification in a single Drizzle transaction so partial writes can't desync the audit trail.

### Mobile Pharmacist App (expo)
- Login: `pharmacist` / `pharmacare2024` (same as web).
- Consultation detail (`app/consultation/[id].tsx`) — back-button bar; renders ALL submitted patient info (GP / Regular Prescriber, Medical Background, Body Measurements, Delivery, identity verification, consents); fixes the legacy "GP not provided" bug by exposing the full schema in OpenAPI.
- Same 4 structured review modals as the web (Approve / More Info / Refer / Reject).
- Orders tab (`app/(tabs)/orders.tsx`) — 3 primary tabs (Pending / Shipped / Delivered) with per-tab counts; each card shows a 4-step tracking timeline (Preparing → Dispatched → Out for delivery → Delivered) plus carrier and tracking number.

## Conditions Covered (50, 15 categories)

Original 27 (Skin, Women's Health, Eye Care, Digestive, Children & Family, Pain & Minor Illness, Respiratory, Allergy) plus the 2026 catalogue expansion to match MedExpress / Pharmacy2U:

- **Weight Management** (5): Mounjaro, Wegovy, Saxenda, Orlistat, Mysimba — all gated by BMI eligibility
- **Sexual Performance** (2): Erectile dysfunction, Premature ejaculation
- **Sexual Health** (3): Period delay, Emergency contraception, Bacterial vaginosis (extends Women's)
- **STIs** (3): Chlamydia, Genital herpes, Genital warts
- **Hair, Skin & Nails** (3): Hair loss, Nail (fungal) infection, Rosacea
- **Seasonal Viruses** (2): Flu treatment, COVID-19 self-test
- **Travel Health** (2): Anti-malaria, Jet lag
- Extra digestive: Acid reflux, IBS · Extra pain: Migraine, Numbing cream · Extra family: Threadworm · Extra sleep: Sleep aid

New conditions live in `artifacts/pharmacy/src/data/newConditionsData.ts` and are merged into `getConditionQuestions()` in `conditionQuestions.ts`. The alias map (`conditionAliases`) only contains `hayfever` → `allergic-rhinitis`; add new aliases there if you rename a slug.

## Mega-menu Header (T4)

`artifacts/pharmacy/src/components/layout/Header.tsx` renders a wide MedExpress-style "Treatments" mega-menu on desktop hover, with sub-categories defined in `data/treatmentsMenu.ts`. Mobile uses an accordion within the existing slide-out drawer. Categories: Weight Loss, Sexual Performance, Sexual Health, STIs, Pain Relief, Hair Skin & Nails, Allergies, Digestive Health, Seasonal Viruses, Travel Health, Women's Health, Eye Care, Children & Family.

## Weight Loss Page (T5)

`/treatments/weight-loss` (`pages/WeightLoss.tsx`) — hero, BMI calculator (with `classifyBmi`), 5 treatment cards, "How it works", safety. Each treatment CTA jumps to its tailored consultation.

## Scroll-to-top (T1)

`<ScrollToTop>` inside the Wouter Router in `App.tsx` listens to `useLocation()` and resets `window.scrollTo(0, 0)` on every route change.

## Shop layout (April 2026)

`Shop.tsx` uses a **horizontal scrollable pill-chip category filter** above a full-width product grid instead of the previous left-sidebar layout. Pills are rendered as `overflow-x-auto` flex row with `snap-x`, one chip per category + "All products". The product grid spans full width at all breakpoints.

`Shop.tsx` and `ProductDetail.tsx` show an inline `−/qty/+` stepper when a product is already in the cart (Amazon-style). Tapping `−` to 0 reverts to the "Add" button. Live badge stays in sync.

## API Endpoints

- `GET /api/conditions` — list all conditions
- `GET /api/conditions/:id` — condition detail
- `GET /api/consultations` — list consultations (with status filter)
- `POST /api/consultations` — submit new consultation
- `GET /api/consultations/:id` — consultation detail
- `POST /api/consultations/:id/review` — pharmacist review action
- `GET /api/dashboard/stats` — dashboard statistics
- `GET /api/dashboard/recent` — recent consultations

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## E-commerce + Admin (added)

- DB tables: `products`, `orders`, `order_items`, `deliveries`, `comms_log`. `conditions.questionsJson` for dynamic questionnaires.
- Patient web shop: `/shop`, `/shop/category/:slug`, `/product/:id`, `/cart`, `/checkout`, `/my-orders`, `/order-confirmation/:id?key=…`, `/track-order/:id?key=…`. Persistent cart in localStorage. Guest order keys stored in `pharmacare_guest_orders`. **Each shop card has both an "Add" button and an Amazon-style one-click "Buy now"** (adds to cart and jumps straight to /checkout). Header shows a basket icon with live count on **both desktop AND mobile** (always visible, plus a "Basket" entry inside the mobile menu).
- Pharmacist admin web (`/dashboard/...`): Orders + Order detail (status flow), Products list with **inline-edit price/stock/active toggle and one-click image-replace dialog** plus units sold + revenue, Product create/edit (image upload), Conditions builder (per-condition questionnaire editor), Patient profile with comms toolbar (mailto/tel/Jitsi) + shop orders + comms log.
- Product imagery: 41 real UK pharmacy product photos served from `artifacts/pharmacy/public/products/<slug>.{jpg,png,webp}`. Generic OTC SKUs are branded (Panadol, Nurofen, Disprin, Clarityn, Zirtek, HC45, Vitabiotics, Haliborange).
- Delivery service: `services/delivery.ts` (DeliveryProvider interface + MockDeliveryProvider, carrier "PharmaCare Express", PCEX… tracking). Stages: `preparing → shipped → out_for_delivery → delivered`.
- Pharmacist mobile app (Expo): new "Orders" tab for fulfilment with stage-advance buttons.

## Key API Endpoints (added)

- `GET /api/products` (filters: category, search, limit) / `GET /api/products/:id`
- `POST /api/orders` (one-click + cart, returns guest key for guests) / `GET /api/orders` (pharmacist sees all + ?email filter; patient sees own) / `GET /api/orders/:id?key=…`
- `PATCH /api/admin/orders/:id/status` (also accepts `{deliveryStage}`)
- `GET /api/admin/analytics/sales`
- `POST /api/admin/conditions`, `PATCH /api/admin/conditions/:id`, `DELETE /api/admin/conditions/:id`
- `POST /api/admin/comms-log`, `GET /api/admin/comms-log?email=…`
- `GET /api/admin/patients/:email/timeline`

## Payments (Stripe + demo fallback)

- `STRIPE_SECRET_KEY` env enables real Stripe Checkout Sessions. Without it the app runs a demo path that marks new orders `paid_demo` immediately so the full flow stays usable.
- `GET /api/payments/status` → `{ stripeEnabled }`; the checkout page uses this to pick the path.
- `POST /api/orders/:id/checkout-session` creates a Stripe Checkout Session and returns its URL. The `success_url` is the order-confirmation page with `&session_id={CHECKOUT_SESSION_ID}` appended (handles existing query strings correctly).
- `POST /api/orders/:id/verify-payment` is called from `OrderConfirmation.tsx` when `?session_id=` is present; it confirms with Stripe and on success marks the order `paid` AND decrements stock (deferred from order creation so abandoned Stripe checkouts don't drain inventory).
- Demo mode (no Stripe key) decrements stock at order creation time, since the order is paid_demo immediately.

## Admin product & order CRUD (T001/T002)

- Admin Products page (`/dashboard/products`) is mobile-responsive: card grid on `<md` with the same inline-edit, image-replace, duplicate, and delete actions as the desktop table.
- `DELETE /api/admin/products/:id` soft-deletes by default; `?hard=true` hard-deletes (FK-safe — returns 409 if the product is referenced by any order). The UI dialog offers both.
- `POST /api/admin/products/:id/duplicate` creates a `<slug>-copy` deactivated draft for editing.
- `PATCH /api/admin/orders/:id` supports editing shipping address, customer details, qty changes, item removal (returns 400 if it would empty the order), customer-facing notes, and an append-only `internalNotes` thread (jsonb array). Stock is adjusted by qty delta on paid orders, with a 409 if there isn't enough stock to bump quantities.

## Catalog

- 60 active products spanning 12 categories (Cold & Flu, Pain Relief, Vitamins, First Aid, Allergy, Skin, Digestive, Foot Care, Eye Care, Sleep, Oral Care, Women's Health). Newer SKUs use `/products/_placeholder.svg`; pharmacist can swap any image via the admin Image Edit dialog.

## ReviewConsultation cleanup (April 2026)

`ReviewConsultation.tsx` had its standalone `reviewNote` textarea (free-form notes on the main review page) and the `referralDetails` internal-notes textarea inside the Refer modal removed. The pharmacist's message to the patient is now exclusively captured through the structured action modals (referNote for Refer, rejectExplanation for Reject, moreInfoMessage for More Info). The `handleReview` call sends `pharmacistNote: null` for approve actions and `referralInfo: referNote` for refer actions.

## Contact page (April 2026)

`Contact.tsx` contact-info cards changed from `overflow-hidden` + `break-words` to allow text to fill full card height (removed `overflow-hidden`) and use `break-all` on value text so email addresses and phone numbers wrap cleanly within narrow cards on all viewports.

## Future Plans

- Real delivery integration (Royal Mail / DPD APIs) replacing MockProvider
- Push notifications for new orders/consultations on mobile
- Patient accounts beyond guest checkout (history, saved addresses)
- Stripe webhook for out-of-band payment confirmation (currently uses verify-payment on success page)
- Move pharmacist auth from base64 bearer token to signed JWT or server sessions

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
