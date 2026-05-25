import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Empty VITE_API_BASE_URL → same-origin /api (Vite proxy in dev, nginx in production).
const apiBase = import.meta.env.VITE_API_BASE_URL;
setBaseUrl(
  apiBase === "" || apiBase === undefined ? null : apiBase.replace(/\/$/, ""),
);

setAuthTokenGetter(() => {
  try {
    return localStorage.getItem("pharmacist_token");
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
