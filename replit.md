# PharmaCare Digital Pharmacy

## Overview

PharmaCare is a full-stack UK digital pharmacy platform designed to provide online minor ailment consultations reviewed by pharmacist prescribers. It aims to meet clinical standards and GPhC compliance requirements, similar to established platforms like Pharmacy2U and MedExpress. The project encompasses a patient-facing platform for consultations and e-commerce, a pharmacist dashboard, and a mobile pharmacist app, alongside administrative functionalities. Key capabilities include condition-specific consultations, eligibility screening, patient-pharmacist messaging, order management, and prescription generation. The platform seeks to expand its catalogue of treatable conditions and integrate real-world delivery and payment solutions.

## User Preferences

I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
I like functional programming.

## System Architecture

The project is built as a monorepo using `pnpm workspaces`, targeting Node.js 24 and TypeScript 5.9.

**Frontend:**
- Developed with React and Vite.
- UI uses Tailwind CSS, shadcn/ui, and Radix UI for a modern and responsive design.
- Routing is managed by Wouter, and forms are handled with react-hook-form and Zod.
- Animations are implemented using Framer Motion.
- Features a MedExpress-style "Treatments" mega-menu for desktop and an accordion for mobile.
- Includes a `<ScrollToTop>` component for smooth navigation.
- The shop layout utilizes a horizontal scrollable pill-chip category filter and a full-width product grid, with Amazon-style `−/qty/+` steppers for cart items.

**Backend:**
- API is built with Express 5.
- Data persistence uses PostgreSQL with Drizzle ORM.
- Validation is performed using Zod and drizzle-zod.
- API codegen is handled by Orval from an OpenAPI specification.
- Features a robust pharmacist dashboard for consultation review, including structured action modals for approving, requesting more info, referring, or rejecting consultations.
- Implements patient-pharmacist messaging with a `consultation_messages` table and a `notifications` system.
- Auth resolution (`requirePatient`, `resolveAuthActor`) securely links patient accounts to their messages and notifications.
- API actions for consultation review are wrapped in Drizzle transactions to ensure atomic updates and maintain audit trail integrity.

**Mobile App (Pharmacist):**
- Developed with Expo.
- Provides access to consultation details and the same structured review modals as the web dashboard.
- Includes an "Orders" tab for fulfillment with stage-advance buttons.

**E-commerce and Admin:**
- Database tables for products, orders, order items, deliveries, and communication logs.
- Patient web shop supports guest checkout with persistent cart and one-click "Buy now" functionality.
- Pharmacist admin web provides comprehensive CRUD operations for orders and products, a conditions builder for questionnaires, and patient profile management.
- Supports soft and hard deletion for products, with FK-safe checks.
- Admin product pages are mobile-responsive, offering inline editing and image replacement.

**Consultation Flow:**
- A 5 or 6 step consultation form (`Consultation.tsx`) guides patients through safety checks, personal details, symptoms, medical background, optional photo upload, and review/submission.
- Eligibility blocking diverts unsuitable patients.
- Condition-specific questions are dynamically loaded.

**Prescription Generation:**
- A dedicated API endpoint generates branded 2-page A4 PDF prescriptions using pdfkit.
- Accessible to both patients and pharmacists, and embedded in outcome emails.

## Recent Work (May 2026)

**Repeat / follow-up consultations from order page (Task #3):**
- New nullable column `consultations.previous_consultation_id` (`lib/db/src/schema/consultations.ts`) links a follow-up consultation to its parent. Pushed via `pnpm --filter @workspace/db run push-force`.
- OpenAPI: added `previousConsultationId` to both `Consultation` (response) and `NewConsultationInput` (request); regenerated client + Zod via `pnpm --filter @workspace/api-spec run codegen`.
- Patient web `MyOrders.tsx`: outline "Request repeat / follow-up" button under each RX order card (`paymentStatus === "rx_internal"` with non-null `consultationId`). Click handler does a one-shot `GET /api/consultations/:id` to resolve the original `conditionId`, then navigates to `/consultation/<conditionId>?repeatOf=<id>`. Button is rendered outside the wrapping `<Link>` to avoid nested-anchor warnings.
- Patient web `Consultation.tsx`: reads `?repeatOf=<id>` once at mount, fetches prior consult with `useGetConsultation`, pre-fills `clinicalAnswers` (splitting `checkbox_group` answers back into arrays), `allergies`, `medications`, `medicalHistory` (treating "None" as the appropriate "no X" toggle). Shows a violet `<RotateCcw>` banner — different copy when the patient picked the same vs a different condition. Submission body sends `previousConsultationId` only when the prior consult was actually loaded client-side.
- Pharmacist web `Dashboard.tsx`: violet "Repeat" badge next to condition name when `previousConsultationId` is set (`data-testid="badge-repeat-<id>"`).
- **Authz hardening (architect-flagged):** both `POST /api/compliance/consultations` and `POST /api/consultations` now refuse the request with 403 if `previousConsultationId` either doesn't exist or its `patientEmail` doesn't match the new consultation's email (case-insensitive). Prevents forging a link to another patient's clinical record.
- **Auth-token hardening:** the shared `setAuthTokenGetter` in `main.tsx` prefers `pharmacist_token` over `patient_token`, so generated React Query hooks would attach a pharmacist token if one was seeded. The repeat prefill path in `Consultation.tsx` and `MyOrders.tsx` now uses `apiFetch(..., { auth: "patient" })` instead of `useGetConsultation`, guaranteeing the GET `/api/consultations/:id` request runs with patient auth and the server's patient-ownership check is the source of truth.


**Critical mobile auth pattern (Metro live-binding fix):**
- Metro bundler's CommonJS interop captures `import { currentToken }` at module-load time and freezes it to `null`. NEVER directly import `currentToken` from `AuthContext` — always call `getCurrentToken()` getter at request time. Migrated `app/(tabs)/orders.tsx` (3 sites) and `app/consultation/[id].tsx` `authHeaders()` helper. Without this fix, all pharmacist actions return 401 "Pharmacist authentication required" after login.

**New backend routes (`artifacts/api-server/src/routes/pharmacist-patients.ts`):**
- `GET /api/pharmacist/patients/:email/profile` — aggregates patient account, full consultation history with status counts, full order history with items + delivery, recent messages, total spend, top conditions. Used by mobile patient detail screen.
- `POST /api/pharmacist/patients/:email/email` — sends a custom email to a patient via the `sendConsultationOutcomeEmail` template; if `consultationId` provided, also logs the message into `consultation_messages` thread.

**New mobile screen (`artifacts/pharmacist-app/app/patient/[email].tsx`):**
- Tappable from `Patients` tab rows (`router.push('/patient/<encoded-email>')`)
- Hero card with avatar/name/email, action row (Email Patient + Mail App), 4-tile stats grid, tabbed sections: Overview / Consults / Orders / Messages
- Compose Email modal that calls `POST /api/pharmacist/patients/:email/email`
- Registered as `Stack.Screen name="patient/[email]"` in `app/_layout.tsx`

**Patient web — competitor parity additions (homepage + sitewide):**
- `components/PressStrip.tsx` — "As featured in" wordmark strip (BBC News, Guardian, Pulse Today, Pharm. Journal, Telegraph, C+D), inserted right after Hero on Home.
- `components/ReviewsSection.tsx` — Trustpilot-style header (4.8/5 · 12,438 reviews) + 6 verified patient testimonial cards in a 3-col grid, on Home before FAQ.
- `components/HomeFAQ.tsx` — accordion of 8 frequently-asked questions (regulator, dispatch times, paper prescriptions, declined consultations, privacy, repeats, NHS, post-arrival messaging), inserted before final Home CTA.
- `components/CookieBanner.tsx` — sticky bottom banner with "Essential only" / "Accept all" choices persisted to `localStorage` key `pharmacare:cookie-consent:v1`. Mounted globally in `App.tsx`.
- `components/LiveHelpFAB.tsx` — floating bottom-right help bubble with quick links (Track / Message / FAQ), telephone, email, and NHS-emergency safety panel. Mounted globally in `App.tsx`.
- `components/NewsletterSignup.tsx` — frontend-only email capture (no backend yet) added to `Footer.tsx` with paired call-us copy.
- `pages/WeightLoss.tsx` — new "Subscribe & save 10%" comparison card section between BMI calculator and treatment cards, showing one-off £149 vs subscription £134/month.

## External Dependencies

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Payment Gateway**: Stripe (with a demo fallback option)
- **PDF Generation**: pdfkit
- **Mobile Development**: Expo
- **UI Libraries**: shadcn/ui, Radix UI
- **Animations**: Framer Motion
- **API Specification**: OpenAPI
- **API Codegen**: Orval
- **Package Management**: pnpm
- **Build Tool**: esbuild