import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Register auth token getter for orval-generated hooks (customFetch).
// Pharmacist portal pages (e.g. ReviewConsultation) call useReviewConsultation
// which uses customFetch — without this, no Authorization header is attached
// and the API returns 401 for approve/reject/refer/more-info.
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
