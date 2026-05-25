import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const DEMO_ID = "pharm-001";
const DEMO_NAME = "Dr. Sarah Mitchell";
const DEMO_ROLE = "Pharmacist Prescriber (GPhC 2087541)";

function ensurePharmacistSession() {
  try {
    if (!localStorage.getItem("pharmacist_token")) {
      const token = btoa(`${DEMO_ID}:${Date.now()}`);
      localStorage.setItem("pharmacist_token", token);
      localStorage.setItem("pharmacist_name", DEMO_NAME);
      localStorage.setItem("pharmacist_role", DEMO_ROLE);
    }
  } catch {
    /* localStorage unavailable */
  }
}

ensurePharmacistSession();

// Empty VITE_API_BASE_URL → same-origin /api (Vite proxy in dev, nginx in production).
const apiBase = import.meta.env.VITE_API_BASE_URL;
setBaseUrl(
  apiBase === "" || apiBase === undefined ? null : apiBase.replace(/\/$/, ""),
);

setAuthTokenGetter(() => {
  try {
    return (
      localStorage.getItem("pharmacist_token") ||
      localStorage.getItem("patient_token") ||
      null
    );
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
