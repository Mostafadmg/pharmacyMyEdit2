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

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
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
  const rawText = await res.text().catch(() => "");
  let json: Record<string, unknown> = {};
  if (rawText) {
    try {
      json = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      /* non-JSON body (e.g. Express HTML 404 page) */
    }
  }
  if (!res.ok) {
    const apiError =
      typeof json.error === "string" ? json.error : undefined;
    let message = apiError ?? `Request failed: ${res.status}`;
    if (
      !apiError &&
      res.status === 404 &&
      import.meta.env.DEV &&
      rawText.includes("Cannot ")
    ) {
      message +=
        " The API on port 5000 may be out of date — rebuild and restart api-server (pnpm run build && pnpm run start in artifacts/api-server).";
    }
    throw new Error(message);
  }
  return json as T;
}
