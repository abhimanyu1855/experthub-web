import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

if (import.meta.env.DEV && API_URL.includes(":3000")) {
  console.warn(
    "[ExpertHub] VITE_API_URL still points to port 3000. Stop and restart the Vite dev server so it picks up .env (expected: http://localhost:3001)."
  );
}

// Helper to get subdomain for multi-tenant mapping.
// Works for localhost, *.localhost, plain domains AND multi-part domains like nip.io.
export function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // --- 1. Use VITE_APP_DOMAIN when available (production / nip.io) ---
  const appDomain = import.meta.env.VITE_APP_DOMAIN as string | undefined;
  if (appDomain && appDomain.length > 0) {
    // Root domain: hostname === appDomain  → no tenant
    if (hostname === appDomain) return null;
    // Tenant subdomain: hostname ends with ".<appDomain>"
    const suffix = "." + appDomain;
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, hostname.length - suffix.length);
      if (sub && sub !== "www") return sub;
    }
    // Unrecognised host — treat as root
    return null;
  }

  // --- 2. Localhost fallback (development) ---
  const parts = hostname.split(".");
  if (parts.length <= 1) return null;             // plain "localhost"
  const first = parts[0];
  if (first === "www" || first === "experthub" || first === "localhost") return null;
  // acme.localhost or acme.experthub.localhost
  return first;
}

function readJsonFromStorage<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function getStoredUser<T = any>(): T | null {
  return readJsonFromStorage<T>("user");
}

export function getStoredMembership<T = any>(): T | null {
  return readJsonFromStorage<T>("membership");
}

export const AUTH_CLEARED_EVENT = "experthub:auth-cleared";

/** Drop cached profile data when there is no active token. */
export function syncAuthSession(): boolean {
  const token = localStorage.getItem("token");
  if (!token) {
    localStorage.removeItem("user");
    localStorage.removeItem("membership");
    return false;
  }
  return true;
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("membership");
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request(method: string, path: string, options: RequestOptions = {}) {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  // Auth Header
  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Tenant Header
  const tenant = getSubdomain();
  if (tenant) {
    headers.set("X-Tenant-Id", tenant);
  }

  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    // When using FormData, let the browser set the Content-Type automatically (including boundary)
    headers.delete("Content-Type");
    fetchOptions.body = options.body;
  }

  const response = await fetch(url, fetchOptions);

  // Read auth token from headers (Devise JWT might return it in Authorization header on sign in / sign up)
  const authHeader = response.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const newToken = authHeader.substring(7);
    localStorage.setItem("token", newToken);
  }

  if (response.status === 401) {
    clearAuthSession();
    throw new Error("Unauthorized");
  }

  if (response.status === 402) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    if (errorData?.upgrade_required) {
      toast.error("This feature requires a higher plan.", {
        action: {
          label: "Upgrade →",
          onClick: () => { window.location.href = "/pricing"; },
        },
        duration: 6000,
      });
    }
    throw new Error(errorData?.error || "Payment required");
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error || errorData?.status?.message || errorData?.message || errorMessage;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  // Some endpoints might return empty response
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  get: (path: string, options?: RequestOptions) => request("GET", path, options),
  post: (path: string, body?: any, options?: RequestOptions) => request("POST", path, { ...options, body }),
  put: (path: string, body?: any, options?: RequestOptions) => request("PUT", path, { ...options, body }),
  patch: (path: string, body?: any, options?: RequestOptions) => request("PATCH", path, { ...options, body }),
  delete: (path: string, options?: RequestOptions) => request("DELETE", path, options),
  
  setToken: (token: string) => localStorage.setItem("token", token),
  getToken: () => localStorage.getItem("token"),
  clearToken: () => localStorage.removeItem("token"),
  
  logout: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch {
        // Server unavailable — proceed with local cleanup regardless
      }
    }
    clearAuthSession();
  }
};
