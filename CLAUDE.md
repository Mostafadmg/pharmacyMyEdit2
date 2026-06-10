# Claude Project Instructions — EveryDayMeds Rx Portal Rebuild

## Who This Is For
This file is for Claude. Read this at the start of every conversation about this project.

---

## Project Paths

### PC
- **Reference codebase:** `C:/Users/Owner/OneDrive/Desktop/pharmacyMyEdit`
- **Build folder:** `C:/Users/Owner/OneDrive/Desktop/myOwnPharmacy`

### Laptop
- **Reference codebase:** `C:\Users\mosta\Desktop\pharmacyMyEdit`
- **Build folder:** `C:\Users\mosta\myOwnPharmacy`

Always ask Moe which machine he is on if unsure. Use MCP Desktop Commander to read files directly.

---

## Goal
Rebuild the Rx Prescriber Portal (`artifacts/pharmacist-rx`) from scratch in `myOwnPharmacy`, exactly matching the reference, built the way a professional developer would build it.

---

## Who You Are Teaching
**Moe** (Mostafa Damghani) — Pharmacist Independent Prescriber, learning to code seriously with a goal of transitioning into tech/healthtech.

### What Moe Already Knows
- HTML, CSS, Tailwind, SCSS
- JavaScript (intermediate)
- React: useState, useReducer, useContext, navigate, Link
- Basic PostgreSQL: CREATE TABLE, SELECT, JOIN
- TypeScript basics: type annotations, interfaces, optional params, generics basics, `typeof`
- Wouter routing: Route, Switch, Link, useLocation
- shadcn/ui: how it works, cn(), cva, variants
- Lucide React icons
- Environment variables and .env files
- Git + GitHub CLI workflow

### Topics Still to Cover
- **React Query** (`@tanstack/react-query`) — crash course when hit
- **useMemo** — crash course when hit
- **Custom hooks** — crash course when hit
- **useRef** — crash course when hit

When any new topic appears, **stop the build**, run a focused crash course with mini projects, then resume.

---

## Teaching Rules (Always Follow These)

1. **Explain WHY before HOW.** Every decision needs a reason.
2. **Hints only — no full code unless Moe explicitly asks.**
3. **Crash course + mini projects for new topics** before continuing the build.
4. **Build in professional order** — tooling → architecture → routing → layout → pages → data.
5. **Match the reference exactly.** Always read the reference file before guiding.
6. **One concept at a time.** Never stack multiple new things in one step.
7. **Direct communication.** No Socratic games. Explain things straight.
8. **Full code only when explicitly asked.**

---

## Current Build Status

### ✅ COMPLETED

#### Phase 1 — Setup & Tooling
- Vite + React + TypeScript scaffolded
- Tailwind CSS v4 installed and wired via Vite plugin
- Path aliases configured (`@/` → `src/`) in both `vite.config.ts` and `tsconfig.app.json` and `tsconfig.json`
- Folder structure: `src/components`, `src/pages`, `src/lib`, `src/hooks`, `src/context`
- Git + GitHub repo: `https://github.com/Mostafadmg/myOwnPharmacy`
- shadcn/ui initialised (version 4.7.0), components: Button, Input, Label in `src/components/ui/`
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `.env` file created with `VITE_PATIENT_APP_URL` and `VITE_RX_PORTAL_URL`

#### Phase 2 — Routing & Auth
- Wouter installed and configured in `App.tsx`
- `RequireAuth` component — reads token from localStorage, redirects to `/login` if missing
- `AuthenticatedRoutes` function — inner Switch with protected routes wrapped in RequireAuth + RxLayout
- `pharmacistSession.ts` — `getPharmacistToken()`, `getPharmacistName()`, `clearPharmacistSession()`
- `portalLinks.ts` — `patientAppUrl()`, `rxPortalUrl()` reading from `.env` with fallbacks

#### Phase 3 — Pages Started
- `PharmacistLogin.tsx` — full login page with mock auth (username: `pharmacist`, password: `pharmacare2024`)
  - Stores `mock_token` and username in localStorage on success
  - Eye toggle for password show/hide
  - Controlled inputs with useState
  - handleSubmit with e.preventDefault(), validation, localStorage, navigate
- `Home.tsx` — placeholder "HOME PAGE!"
- `NotFound.tsx` — 404 page

#### Phase 4 — RxLayout (IN PROGRESS)
File: `src/components/RxLayout.tsx`

**COMPLETED inside RxLayout:**
- Full layout shell: h-screen, flex-col, overflow-hidden — sidebar fixed, main scrolls
- `Header` — logo (EveryDayMeds Rx with Leaf icon), search bar (hidden on mobile), MenuButton (mobile only), theme toggle, profile avatar
- `Theme` — dark/light toggle with useEffect wiring to `document.documentElement.classList`, persists to localStorage key `pharmacare:rx-theme`
- `Profile` — reads real pharmacist name from localStorage via `getPharmacistName()`, shows initials
- `Sidebar` — collapsible (w-57 expanded / w-15 collapsed), nav links from NAV array, active state with useLocation + cn(), green left border on active, portals section pinned at bottom
- `NAV` array — 8 items: Dashboard, Orders, Patient Messages, Patients, Prescriptions, Shop, Profile, Dispensing Labels
- `NavItem` type with `typeof LayoutDashboard` for icon typing
- Portals section — Rx Portal + Back to website links with ExternalLink icons, hide labels when collapsed
- Collapse button with ChevronLeft + rotate-180 when collapsed

**IN PROGRESS — Mobile Menu (`MobileMenu` component):**
- State: `mobileOpen` lives in `RxLayout`, passed to `Header` as prop
- `Header` passes `setMobileOpen` down to `MenuButton`
- `MenuButton` calls `setMobileOpen(true)` on click
- `MobileMenu` component started but has bugs — needs fixing:
  1. Still placed inside `Header` — should be inside `RxLayout` rendered conditionally: `{mobileOpen && <MobileMenu setMobileOpen={setMobileOpen} />}`
  2. Uses `class` instead of `className` — JSX always uses className
  3. Uses `collapsed` variable which doesn't exist in MobileMenu scope — remove, always show labels
  4. Uses `location` without calling `useLocation()` — add `const [location] = useLocation()` at top
  5. Close button missing `onClick={() => setMobileOpen(false)}`
  6. Nav links need `onClick={() => setMobileOpen(false)}` to close drawer on navigation
  7. Backdrop button missing `onClick={() => setMobileOpen(false)}`

**STILL TO BUILD in RxLayout:**
- Floating "Message Patient" button
- Floating "Contraindications" button
- Settings dialog (can skip for now)
- Keyboard shortcut ⌘K for search (wire up when Queue exists)

---

## Pages Still to Build (in order)
- [ ] Dashboard
- [ ] Queue (most complex — filters, table, status tags, badges)
- [ ] Order Detail (tabs: clinical, documents, counselling, messages)
- [ ] Patients list
- [ ] Patient detail
- [ ] Prescriptions
- [ ] Profile
- [ ] Shop admin
- [ ] Dispensing Labels

---

## Architecture Decisions Made

### App.tsx structure
```tsx
<Router>
  <Switch>
    <Route path="/login" component={PharmacistLogin} />
    <Route component={AuthenticatedRoutes} />
  </Switch>
</Router>

function AuthenticatedRoutes() {
  return (
    <RequireAuth>
      <RxLayout>
        <Switch>
          <Route path="/" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </RxLayout>
    </RequireAuth>
  )
}
```

### Why two Switch levels
Outer Switch handles public vs protected routes. Inner Switch handles which page renders inside the layout. This prevents Switch from seeing non-Route children.

### Layout locking
`h-screen overflow-hidden` on root div + `flex flex-1 overflow-hidden` on inner div locks the entire layout to viewport. Only `<main className="flex-1 overflow-y-auto">` scrolls. Sidebar stays fixed height always.

### Data-driven NAV array
Nav links stored as `NavItem[]` array, mapped to JSX. Single source of truth — add/remove/reorder by changing data, not JSX.

### Active state logic
```tsx
const active = item.path === "/"
  ? location === "/"                    // exact match for home only
  : location.startsWith(item.path)      // prefix match for sections
```
Dashboard uses exact match because every URL starts with `/`.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/App.tsx` | Routing, RequireAuth, AuthenticatedRoutes |
| `src/components/RxLayout.tsx` | Layout shell — header, sidebar, main |
| `src/pages/PharmacistLogin.tsx` | Login page with mock auth |
| `src/pages/Home.tsx` | Placeholder dashboard |
| `src/pages/NotFound.tsx` | 404 page |
| `src/lib/pharmacistSession.ts` | localStorage helpers for auth |
| `src/lib/portalLinks.ts` | URL helpers reading from .env |
| `src/lib/utils.ts` | cn() helper |
| `src/components/ui/` | shadcn components |

---

## Communication Style
- Direct. No fluff.
- Explain reasoning clearly before implementation.
- No full code unless Moe explicitly asks "give me the code."
- When something is industry standard, say so and explain why.
- Moe prefers straight explanations over Socratic questioning.
- Always explain new TypeScript syntax when it appears.

---

## How to Start Each Session
1. Ask which machine Moe is on (PC or laptop)
2. Read the relevant files via MCP to see current state
3. Continue from where this file says IN PROGRESS
4. Build one thing, test it, commit it, move to next
