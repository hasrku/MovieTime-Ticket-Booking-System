const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

let isRefreshing = false;
let refreshPromise = null;

export function getStoredAuth() {
  try {
    const accessToken = localStorage.getItem("movietime_access");
    const refreshToken = localStorage.getItem("movietime_refresh");
    const userRaw = localStorage.getItem("movietime_user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { accessToken, refreshToken, user };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export function setStoredAuth({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem("movietime_access", accessToken);
  if (refreshToken) localStorage.setItem("movietime_refresh", refreshToken);
  if (user) localStorage.setItem("movietime_user", JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem("movietime_access");
  localStorage.removeItem("movietime_refresh");
  localStorage.removeItem("movietime_user");
}

async function tryRefreshToken() {
  const { refreshToken } = getStoredAuth();
  if (!refreshToken) return null;

  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const data = await res.json();
        setStoredAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        return data.accessToken;
      })
      .catch(() => {
        clearStoredAuth();
        return null;
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const { accessToken } = getStoredAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !options._retry && !path.startsWith("/api/auth/")) {
    const newAccessToken = await tryRefreshToken();
    if (newAccessToken) {
      headers["Authorization"] = `Bearer ${newAccessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        _retry: true,
      });
    }
  }

  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      // ignore json parse errors
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}
