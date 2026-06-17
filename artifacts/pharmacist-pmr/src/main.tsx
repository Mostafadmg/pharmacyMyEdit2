import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

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
