/** Patient-facing shop (default dev port 5173). */
export function patientAppUrl(): string {
  const env = import.meta.env.VITE_PATIENT_APP_URL;
  if (env && String(env).trim()) return String(env).replace(/\/$/, "");
  return "http://localhost:5173";
}

/** Rx prescriber portal (default dev port 5174). */
export function rxPortalUrl(): string {
  const env = import.meta.env.VITE_RX_PORTAL_URL;
  if (env && String(env).trim()) return String(env).replace(/\/$/, "");
  return "http://localhost:5174";
}

/** PMR dispensing system (default dev port 5175). */
export function pmrPortalUrl(): string {
  const env = import.meta.env.VITE_PMR_PORTAL_URL;
  if (env && String(env).trim()) return String(env).replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    return `${window.location.origin}${base}`;
  }
  return "http://localhost:5175";
}
