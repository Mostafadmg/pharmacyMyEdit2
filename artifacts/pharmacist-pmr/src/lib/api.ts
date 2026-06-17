/** Dev: same-origin `/api` via Vite proxy. Prod: explicit base or same-origin. */
function resolveApiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env !== undefined && env !== "") {
    return env.replace(/\/$/, "");
  }
  return "";
}

export const API_BASE = resolveApiBase();

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return normalized;
  return `${API_BASE}${normalized}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("pharmacist_token")
      : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  const rawText = await res.text().catch(() => "");
  let json: Record<string, unknown> = {};
  if (rawText) {
    try {
      json = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      /* non-JSON */
    }
  }
  if (!res.ok) {
    const apiError =
      typeof json.error === "string" ? json.error : undefined;
    throw new Error(apiError ?? `Request failed: ${res.status}`);
  }
  return json as T;
}
