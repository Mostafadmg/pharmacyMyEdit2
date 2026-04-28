export const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit & { auth?: "patient" | "pharmacist" }): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (init?.auth === "patient") {
    const t = localStorage.getItem("patient_token");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  } else if (init?.auth === "pharmacist") {
    const t = localStorage.getItem("pharmacist_token");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  } else {
    const pt = localStorage.getItem("patient_token");
    const ph = localStorage.getItem("pharmacist_token");
    if (pt) headers["Authorization"] = `Bearer ${pt}`;
    else if (ph) headers["Authorization"] = `Bearer ${ph}`;
  }

  const res = await fetch(apiUrl(path), { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as { error?: string }).error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}
