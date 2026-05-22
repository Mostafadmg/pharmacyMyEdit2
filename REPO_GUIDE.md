# PharmaCare — Repository Guide

This is a **pnpm monorepo** containing every piece of the PharmaCare platform: the patient website, the prescriber web portal, the pharmacist mobile app, and the shared backend API + database.

Each app lives in its own folder so you can open exactly the codebase you want to work on.

---

## Where each piece of the product lives

### `artifacts/pharmacy/` — Patient website
The public-facing web app patients use to **shop OTC products, start consultations, track orders, and message the pharmacy**.

- Stack: React + Vite + Tailwind + shadcn/ui
- Routing: Wouter
- Key pages: `src/pages/Home.tsx`, `Shop.tsx`, `Consultation.tsx`, `MyOrders.tsx`, `Checkout.tsx`
- Run it: `pnpm --filter @workspace/pharmacy run dev`

### `artifacts/pharmacist-rx/` — Prescriber web portal (Rx)
The web dashboard **pharmacist prescribers** use to review consultations, approve / decline / request more info, and generate prescriptions for Mounjaro, ED, UTI, hair loss, hay fever, and every other treatable condition.

- Stack: React + Vite + Tailwind + shadcn/ui
- Key pages: `src/pages/Dashboard.tsx`, `Queue.tsx`, `OrderDetail.tsx`, `PatientMessages.tsx`, `Patients.tsx`, `Prescriptions.tsx`
- Layout / sidebar: `src/components/RxLayout.tsx`
- Run it: `pnpm --filter @workspace/pharmacist-rx run dev`

### `artifacts/pharmacist-app/` — Pharmacist mobile app
The **iOS + Android app** for pharmacists on the go. Same review actions as the web Rx portal plus a fulfilment "Orders" tab and patient profile screens.

- Stack: Expo (React Native) + expo-router
- Key screens: `app/(tabs)/index.tsx`, `orders.tsx`, `messages.tsx`, `patients.tsx`, `app/consultation/[id].tsx`, `app/patient/[email].tsx`
- Run it: `pnpm --filter @workspace/pharmacist-app run dev`

### `artifacts/api-server/` — Backend API
The **Express 5 server** that powers all three apps above. Handles auth, consultations, orders, messages, prescriptions PDF generation, emails, Stripe, and the admin endpoints.

- Stack: Express 5 + TypeScript + Drizzle ORM + Postgres
- Routes live in `src/routes/` (one file per feature area — `consultations.ts`, `orders.ts`, `patients.ts`, `messages.ts`, `prescriptions.ts`, etc.)
- Run it: `pnpm --filter @workspace/api-server run dev`

### `artifacts/mockup-sandbox/` — Design sandbox (internal only)
A small Vite app used inside Replit's Canvas for prototyping UI variants. **Not shipped to users** — safe to ignore if you're only working on product code.

---

## Shared libraries (`lib/`)

These are imported by the apps above. You rarely edit them directly — most changes flow from the OpenAPI spec.

| Folder | What it holds |
|---|---|
| `lib/db/` | Postgres schema (Drizzle ORM) + migrations. **Single source of truth for the database.** |
| `lib/api-spec/` | The OpenAPI YAML spec. **Source of truth for every API endpoint.** Edit here, then run `pnpm --filter @workspace/api-spec run codegen` to regenerate the two libs below. |
| `lib/api-zod/` | Auto-generated Zod validators used by the server. **Do not hand-edit.** |
| `lib/api-client-react/` | Auto-generated React Query hooks used by the web apps. **Do not hand-edit.** |

---

## Repo root

| File / folder | Purpose |
|---|---|
| `package.json` | Workspace-level scripts (typecheck, format, etc.) |
| `pnpm-workspace.yaml` | Tells pnpm which folders are workspace packages, plus dependency catalog |
| `tsconfig.base.json` / `tsconfig.json` | Shared TypeScript config + project references |
| `replit.md` | High-level product overview and notes |
| `scripts/` | One-off utility scripts |
| `.replit`, `artifact.toml` files | Replit deployment config — not needed for local dev |

---

## Common workflows

**Add or change an API endpoint**
1. Edit `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Implement the route in `artifacts/api-server/src/routes/<feature>.ts`
4. Use the generated hook in the web app(s) you need it in

**Change the database schema**
1. Edit `lib/db/src/schema/<table>.ts`
2. Run `pnpm --filter @workspace/db run push-force` (dev) or generate a migration (prod)

**Add a new page to the patient site**
1. Create `artifacts/pharmacy/src/pages/MyPage.tsx`
2. Register it in `artifacts/pharmacy/src/App.tsx`

**Add a new page to the prescriber portal**
1. Create `artifacts/pharmacist-rx/src/pages/MyPage.tsx`
2. Register it in `artifacts/pharmacist-rx/src/App.tsx`
3. Add a nav entry in `artifacts/pharmacist-rx/src/components/RxLayout.tsx`

**Add a new screen to the pharmacist mobile app**
1. Create a file under `artifacts/pharmacist-app/app/` — expo-router picks it up by filename

---

## First-time setup (cloning from GitHub)

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres locally (or point DATABASE_URL at any Postgres)
#    .env: DATABASE_URL=postgres://user:pass@localhost:5432/pharmacare

# 3. Push the schema
pnpm --filter @workspace/db run push-force

# 4. In separate terminals, start whichever app(s) you're working on:
pnpm --filter @workspace/api-server      run dev   # backend (required by all)
pnpm --filter @workspace/pharmacy        run dev   # patient web
pnpm --filter @workspace/pharmacist-rx   run dev   # prescriber web
pnpm --filter @workspace/pharmacist-app  run dev   # pharmacist mobile (Expo)
```

---

## Quick mental model

```
┌─────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐
│ artifacts/pharmacy  │   │ artifacts/           │   │ artifacts/          │
│ (patient web)       │   │   pharmacist-rx      │   │   pharmacist-app    │
│                     │   │ (prescriber web)     │   │ (pharmacist mobile) │
└──────────┬──────────┘   └──────────┬───────────┘   └──────────┬──────────┘
           │                         │                          │
           └─────────────┬───────────┴──────────────────────────┘
                         │
                         ▼
         ┌──────────────────────────────────┐
         │ artifacts/api-server  (Express)  │
         └─────────────────┬────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Postgres (lib/db)   │
                └──────────────────────┘

Shared contract:  lib/api-spec  →  lib/api-zod  +  lib/api-client-react
```
