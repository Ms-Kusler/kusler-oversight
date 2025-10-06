// client/src/lib/api.ts
export const API_BASE =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith("railway.app")
    ? "" // production: same origin
    : "http://localhost:5000"; // local dev

type Options = RequestInit & { json?: unknown };

export async function apiFetch(path: string, opts: Options = {}) {
  const url =
    path.startsWith("http")
      ? path
      : path.startsWith("/api")
        ? `${API_BASE}${path}`
        : `${API_BASE}/api/${path}`;

  const { json, headers, ...rest } = opts;

  const init: RequestInit = {
    credentials: "include",               // send session cookie
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...rest,
    body: json ? JSON.stringify(json) : rest.body,
  };

  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} – ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// optional helpers
export const getMe  = () => apiFetch("/api/auth/me");
export const login  = (username: string, password: string) =>
  apiFetch("/api/auth/login", { method: "POST", json: { username, password } });
export const logout = () => apiFetch("/api/auth/logout", { method: "POST" });
