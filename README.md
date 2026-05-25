# PharmaCare Digital Pharmacy Platform

PharmaCare is a full-stack digital pharmacy system built as a `pnpm` monorepo. It includes a patient-facing pharmacy website, an Rx prescriber portal, a pharmacist mobile app, a shared Express API, and a PostgreSQL database schema powered by Drizzle ORM.

The project is designed for online consultations, prescription review workflows, patient messaging, document checks, order handling, and pharmacist-led clinical decisions.

## Apps In This Repository

| App | Folder | Purpose | Default URL |
| --- | --- | --- | --- |
| Patient Pharmacy Website | `artifacts/pharmacy` | Patient shop, consultations, checkout, orders, and messages | `http://localhost:5173` |
| Rx Prescriber Portal | `artifacts/pharmacist-rx` | Pharmacist/prescriber dashboard for reviewing consultations and prescriptions | `http://localhost:5174` |
| Pharmacist Mobile App | `artifacts/pharmacist-app` | Expo mobile app for pharmacist review, orders, inbox, and patient records | Expo on `8081` |
| API Server | `artifacts/api-server` | Express API for auth, consultations, orders, messages, prescriptions, and pharmacist tools | `http://localhost:5000` |
| Database Library | `lib/db` | Drizzle schema and database connection | PostgreSQL |

## Main Features

- Patient consultation journeys for pharmacy treatments.
- Pharmacist Rx portal with clinical review, consultation answers, documents, order history, patient counselling, monitoring, notes, and activity log.
- Document review workflow with View, Verify, Reject, and checklist completion.
- Patient counselling templates with full-width secure message composer.
- Clinical BMI history cards with clear measurement tiles.
- Pharmacist action panel for approve, hold, reject, urgent flag, contact logging, and checklist status.
- Patient messaging and notification support.
- Prescription PDF generation from the backend.
- Expo pharmacist mobile app for on-the-go review workflows.
- Shared OpenAPI-driven client and validation packages.

## Tech Stack

- Package manager: `pnpm` workspaces
- Web apps: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Wouter
- Mobile app: Expo, React Native, expo-router
- API: Express 5, TypeScript, Zod
- Database: PostgreSQL, Drizzle ORM
- API contracts: OpenAPI, Orval-generated React Query hooks and Zod validators
- PDF generation: pdfkit

## Prerequisites

Install these before running the system locally:

- Node.js 24 or newer
- pnpm
- PostgreSQL
- Git
- Expo tooling if running the mobile app

Install pnpm if needed:

```bash
npm install -g pnpm
```

## First-Time Setup

Clone the repository:

```bash
git clone https://github.com/Mostafadmg/pharmacyMyEdit.git
cd pharmacyMyEdit
```

Install dependencies:

```bash
pnpm install
```

Create a local `.env` file in the repo root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pharmacare
PORT=5000
```

The `.env` file is ignored by git and should not be committed.

Create the local database if it does not exist:

```bash
createdb pharmacare
```

Push the Drizzle schema:

```bash
pnpm --filter @workspace/db run push-force
```

## Running The Apps

Run the API first because both web apps depend on it:

```bash
pnpm --filter @workspace/api-server run dev
```

Run the patient pharmacy website:

```bash
pnpm --filter @workspace/pharmacy run dev
```

Open:

```text
http://localhost:5173
```

Run the Rx prescriber portal:

```bash
pnpm --filter @workspace/pharmacist-rx run dev
```

Open:

```text
http://localhost:5174
```

Useful Rx portal routes:

```text
http://localhost:5174/dashboard
http://localhost:5174/queue
http://localhost:5174/orders/demo-007?tab=clinical
http://localhost:5174/orders/demo-007?tab=documents
http://localhost:5174/orders/demo-007?tab=counselling
```

Run the pharmacist mobile app:

```bash
pnpm --filter @workspace/pharmacist-app run dev
```

Then use the Expo CLI output to open the app on iOS, Android, or web.

## Build Commands

Build the Rx portal:

```bash
pnpm --filter @workspace/pharmacist-rx run build
```

Build the patient website:

```bash
pnpm --filter @workspace/pharmacy run build
```

Build the API:

```bash
pnpm --filter @workspace/api-server run build
```

Build the mobile app bundle:

```bash
pnpm --filter @workspace/pharmacist-app run build
```

Run the workspace build:

```bash
pnpm run build
```

## Type Checking

Run all type checks:

```bash
pnpm run typecheck
```

Run an app-specific typecheck:

```bash
pnpm --filter @workspace/pharmacist-rx run typecheck
pnpm --filter @workspace/pharmacy run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/pharmacist-app run typecheck
```

## Workspace Layout

```text
artifacts/
  api-server/       Express API
  pharmacy/         Patient website
  pharmacist-rx/    Rx prescriber portal
  pharmacist-app/   Expo pharmacist mobile app
  mockup-sandbox/   Internal UI sandbox

lib/
  db/               Drizzle schema and database utilities
  api-spec/         OpenAPI source
  api-zod/          Generated Zod validators
  api-client-react/ Generated React Query client hooks

scripts/            Utility scripts and seed helpers
```

## API And Code Generation

The OpenAPI contract lives in:

```text
lib/api-spec
```

After editing the API spec, regenerate the API client and validators:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Then update backend routes in:

```text
artifacts/api-server/src/routes
```

## Database Workflow

Database schema files live in:

```text
lib/db/src/schema
```

For local development, push schema changes with:

```bash
pnpm --filter @workspace/db run push-force
```

Use migrations for production deployments.

## Environment Variables

Common variables:

| Name | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/pharmacare` |
| `PORT` | API or app port override | `5000`, `5173`, `5174` |
| `BASE_PATH` | Optional Vite base path | `/` |
| `VITE_API_BASE_URL` | Optional API base URL for frontend apps | `http://localhost:5000` |

Do not commit local secrets. Keep `.env` local.

## Deploy Rx Portal (Docker)

To run **PostgreSQL + API + Rx portal** on one machine (e.g. a VPS or local Docker Desktop):

```bash
pnpm run deploy:rx:up
pnpm run deploy:rx:init   # first time: schema + demo data
```

- Rx portal: `http://localhost:5174`
- API: `http://localhost:5000`

See [deploy/rx/README.md](deploy/rx/README.md) for ports, env vars, and production notes.

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose).

## Development Notes

- Start the API before using the web apps.
- The patient website runs on port `5173` by default.
- The Rx portal runs on port `5174` by default.
- The API runs on port `5000` by default.
- The Vite apps proxy `/api` to `http://localhost:5000`.
- The Rx portal seeds a demo pharmacist session in local storage for development.

## GitHub

Target repository:

```text
https://github.com/Mostafadmg/pharmacyMyEdit
```

Typical push flow:

```bash
git add .
git commit -m "Update PharmaCare app and documentation"
git push origin main
```

If using a different remote name:

```bash
git remote add pharmacyMyEdit https://github.com/Mostafadmg/pharmacyMyEdit.git
git push pharmacyMyEdit main
```

## License

This repository is currently private application code for the PharmaCare platform.
