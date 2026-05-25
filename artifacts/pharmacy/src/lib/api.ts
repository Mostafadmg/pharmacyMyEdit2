function resolveApiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env !== undefined && env !== "") {
    return env.replace(/\/$/, "");
  }
  return "";
}

export const API_BASE = resolveApiBase();

/** Never show raw SQL / Drizzle errors to patients. */
export function sanitizeApiError(message: string): string {
  if (
    message.includes("Failed query") ||
    message.includes("insert into") ||
    message.includes("DrizzleQueryError")
  ) {
    return "We could not save your consultation. Please wait a moment and try again. If this continues, refresh the page and ensure the pharmacy server is running.";
  }
  if (message.length > 280) {
    return `${message.slice(0, 280)}…`;
  }
  return message;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return normalized;
  return `${API_BASE}${normalized}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { auth?: "patient" | "pharmacist" },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  if (init?.auth === "patient") {
    const t = localStorage.getItem("patient_token");
    if (t) headers.Authorization = `Bearer ${t}`;
  } else if (init?.auth === "pharmacist") {
    const t = localStorage.getItem("pharmacist_token");
    if (t) headers.Authorization = `Bearer ${t}`;
  } else {
    const pt = localStorage.getItem("patient_token");
    const ph = localStorage.getItem("pharmacist_token");
    if (pt) headers.Authorization = `Bearer ${pt}`;
    else if (ph) headers.Authorization = `Bearer ${ph}`;
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch (err) {
    const hint =
      import.meta.env.DEV && !API_BASE
        ? " Start the API on port 5000 (Vite proxies /api → localhost:5000)."
        : " Check that the API server is running on port 5000.";
    throw new Error(
      err instanceof TypeError && err.message === "Failed to fetch"
        ? `Cannot reach the API.${hint}`
        : err instanceof Error
          ? err.message
          : "Network error",
    );
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw =
      (json as { error?: string }).error || `Request failed: ${res.status}`;
    const message = sanitizeApiError(raw);
    throw new Error(message);
  }
  return json as T;
}
