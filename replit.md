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
1. **Safety Check** — condition-specific eligibility screening (blocking questions)
2. **About You** — personal details (name, email, age, sex, pregnancy)
3. **Symptoms** — 4–6 condition-specific clinical questions (radio, checkbox_group, textarea)
4. **Medical Background** — allergies, medications, medical history (with "none" checkboxes)
5. **Photo Upload** — shown only when `condition.requiresPhoto = true`
6. **Review & Submit** — full summary with edit links, consent checkbox, submit

Condition-specific questions are defined in `artifacts/pharmacy/src/data/conditionQuestions.ts` (original set) and `artifacts/pharmacy/src/data/newConditionsData.ts` (catalogue expansion). `getConditionQuestions(id)` resolves both maps plus an alias table.

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
- Actions: Approve + prescribe, Reject, Ask more info, Refer to GP/urgent care
- Red-flag warning banners

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

## Shop basket stepper (T2)

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

## Future Plans

- Real delivery integration (Royal Mail / DPD APIs) replacing MockProvider
- Push notifications for new orders/consultations on mobile
- Patient accounts beyond guest checkout (history, saved addresses)
- Stripe webhook for out-of-band payment confirmation (currently uses verify-payment on success page)
- Move pharmacist auth from base64 bearer token to signed JWT or server sessions

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
