import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** -------- base URL helper (prod = same-origin, dev = localhost:5000) -------- */
const API_BASE =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith("railway.app")
    ? "" // production: same origin
    : "http://localhost:5000";

/** Normalizes any path into a full URL and ensures `/api` prefix */
function buildUrl(input: string): string {
  if (input.startsWith("http")) return input;

  const path = input.startsWith("/api")
    ? input
    : input.startsWith("api/")
      ? `/${input}`
      : `/api/${input.replace(/^\/+/, "")}`;

  return `${API_BASE}${path}`;
}

/** -------------------- shared fetch helpers -------------------- */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  urlOrPath: string,
  data?: unknown
): Promise<Response> {
  const url = buildUrl(urlOrPath);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // <-- sends sessionId cookie
  });

  await throwIfResNotOk(res);
  return res;
}

/** -------------------- react-query defaults -------------------- */
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Allow keys like ["dashboard"] or ["/api/dashboard", {q:'x'}]
    const [path, params] = queryKey as [string, Record<string, any>?];
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    const url = buildUrl(path) + qs;

    const res = await fetch(url, { credentials: "include" });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Let pages that tolerate 401 handle it gracefully
      return null as unknown as T;
    }

    await throwIfResNotOk(res);
    const ct = res.headers.get("content-type") || "";
    return (ct.includes("application/json") ? res.json() : res.text()) as Promise<T>;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});

