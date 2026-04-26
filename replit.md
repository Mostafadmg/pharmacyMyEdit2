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

Condition-specific questions are defined in `artifacts/pharmacy/src/data/conditionQuestions.ts` — covers all 27 conditions with tailored eligibility screening and clinical questions.

## Features

### Patient-facing
- Landing page with hero, how-it-works, categories, trust badges
- Browse 27 treatable conditions grouped by category
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

## Conditions Covered (27)

Skin: Acne vulgaris, Athlete's foot, Dry skin/eczema, Ringworm/tinea, Scabies, Warts/verrucae
Women's Health: UTI (AFAB 16-64), Vaginal thrush
Eye Care: Dry eye disease, Bacterial conjunctivitis
Digestive: Dyspepsia, Constipation, Diarrhoea, Haemorrhoids
Children & Family: Chickenpox (under 14), Head lice, Infantile colic, Nappy rash, Teething, Threadworms
Pain & Minor Illness: Back pain (16-<50), Cold sores, Ingrowing toenail, Mouth ulcers, Sore throat
Respiratory: Oral thrush
Allergy: Allergic rhinitis

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

## Future Plans

- Mobile app (Expo) for pharmacist push notifications
- Clerk authentication for pharmacist login
- Patient accounts and consultation history
- Photo upload via object storage
- Payment processing (Stripe)
- Real-time notifications via WebSocket

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
