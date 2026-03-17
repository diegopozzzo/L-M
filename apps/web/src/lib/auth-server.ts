import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  type SessionUser,
} from "./auth";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type BackendSessionResponse = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: {
    tokenType: "Bearer";
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    usuario: SessionUser;
  };
};

type BackendMeResponse = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: SessionUser;
};

const ACCESS_COOKIE_MAX_AGE = 60 * 15;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getApiBaseUrl() {
  const apiUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000/api";

  return apiUrl.replace(/\/+$/, "");
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function getErrorMessage(
  payload: { mensaje?: string } | null,
  fallback: string,
) {
  return payload?.mensaje ?? fallback;
}

async function parseJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function resolveHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const body = init?.body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (!headers.has("Content-Type") && typeof body === "string" && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function apiRequest(path: string, init?: RequestInit) {
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: resolveHeaders(init),
    cache: "no-store",
  });
}

function buildAuthorizedInit(token: string, init?: RequestInit): RequestInit {
  const headers = resolveHeaders(init);
  headers.set("Authorization", `Bearer ${token}`);

  return {
    ...init,
    headers,
    cache: "no-store",
  };
}

function persistSessionCookies(
  cookieStore: CookieStore,
  accessToken: string,
  refreshToken: string,
) {
  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    getCookieOptions(ACCESS_COOKIE_MAX_AGE),
  );
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getCookieOptions(REFRESH_COOKIE_MAX_AGE),
  );
}

export function clearSessionCookies(cookieStore: CookieStore) {
  cookieStore.set(ACCESS_TOKEN_COOKIE, "", getCookieOptions(0));
  cookieStore.set(REFRESH_TOKEN_COOKIE, "", getCookieOptions(0));
}

export async function createSessionFromCredentials(
  cookieStore: CookieStore,
  email: string,
  password: string,
) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const payload = await parseJson<BackendSessionResponse>(response);

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(
      getErrorMessage(payload, "No fue posible iniciar sesion en este momento."),
    );
  }

  persistSessionCookies(
    cookieStore,
    payload.data.accessToken,
    payload.data.refreshToken,
  );

  return payload.data.usuario;
}

export async function getSessionUser(cookieStore: CookieStore) {
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (accessToken) {
    const meResponse = await apiRequest("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const mePayload = await parseJson<BackendMeResponse>(meResponse);

    if (meResponse.ok && mePayload?.ok && mePayload.data) {
      return mePayload.data;
    }
  }

  if (!refreshToken) {
    clearSessionCookies(cookieStore);
    return null;
  }

  const refreshResponse = await apiRequest("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  const refreshPayload = await parseJson<BackendSessionResponse>(refreshResponse);

  if (!refreshResponse.ok || !refreshPayload?.ok || !refreshPayload.data) {
    clearSessionCookies(cookieStore);
    return null;
  }

  persistSessionCookies(
    cookieStore,
    refreshPayload.data.accessToken,
    refreshPayload.data.refreshToken,
  );

  return refreshPayload.data.usuario;
}

export async function apiRequestWithSession(
  cookieStore: CookieStore,
  path: string,
  init?: RequestInit,
) {
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (accessToken) {
    const directResponse = await apiRequest(
      path,
      buildAuthorizedInit(accessToken, init),
    );

    if (directResponse.status !== 401) {
      return directResponse;
    }
  }

  if (!refreshToken) {
    clearSessionCookies(cookieStore);
    return null;
  }

  const refreshResponse = await apiRequest("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  const refreshPayload = await parseJson<BackendSessionResponse>(refreshResponse);

  if (!refreshResponse.ok || !refreshPayload?.ok || !refreshPayload.data) {
    clearSessionCookies(cookieStore);
    return null;
  }

  persistSessionCookies(
    cookieStore,
    refreshPayload.data.accessToken,
    refreshPayload.data.refreshToken,
  );

  return apiRequest(
    path,
    buildAuthorizedInit(refreshPayload.data.accessToken, init),
  );
}

export async function destroySession(cookieStore: CookieStore) {
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // El cierre local de cookies no debe depender de la red.
    }
  }

  clearSessionCookies(cookieStore);
}
