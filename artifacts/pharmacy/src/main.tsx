import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const DEMO_ID = "pharm-001";
const DEMO_NAME = "Dr. Sarah Mitchell";
const DEMO_ROLE = "Pharmacist Prescriber (GPhC)";

function ensurePharmacistSession() {
  try {
    if (!localStorage.getItem("pharmacist_token")) {
      const token = btoa(`${DEMO_ID}:${Date.now()}`);
      localStorage.setItem("pharmacist_token", token);
      localStorage.setItem("pharmacist_name", DEMO_NAME);
      localStorage.setItem("pharmacist_role", DEMO_ROLE);
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

ensurePharmacistSession();

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
