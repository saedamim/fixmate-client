import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/data/services";

export const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

// An error from the API that remembers the HTTP status (for example 402 = payment not completed yet)
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: string;
  body?: object;
  forbiddenMessage?: string; // shown when the API answers 403 (wrong role)
};


// Asking for a token is a network round trip, and a dashboard makes several API calls at once. So the token is kept
// until shortly before it expires, and the calls that start together share one request.
let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;

// Forget the token when the user signs in or out, so the next call never sends someone else's
export const clearApiToken = () => {
  cachedToken = null;
  pendingToken = null;
};

// The `exp` claim of a JWT, in milliseconds (0 when it cannot be read, so the token is not reused)
const tokenExpiry = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 30_000) return cachedToken.value;

  pendingToken ??= authClient
    .token()
    .then(({ data, error }) => {
      if (error || !data?.token) throw new Error(SESSION_EXPIRED);
      cachedToken = { value: data.token, expiresAt: tokenExpiry(data.token) };
      return data.token;
    })
    .finally(() => {
      pendingToken = null;
    });
  return pendingToken;
}

export async function callApi(path: string, { method = "GET", body, forbiddenMessage }: Options = {}) {
  const send = async (token: string) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body && { "Content-Type": "application/json" }),
      },
      body: body && JSON.stringify(body),
    });

  let response = await send(await getToken());
  if (response.status === 401) {
    // The cached token may have been rejected (for example after a server restart): try once with a fresh one
    clearApiToken();
    response = await send(await getToken());
  }
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) throw new ApiError(SESSION_EXPIRED, 401);
    if (response.status === 403) throw new ApiError(forbiddenMessage ?? "You do not have access to this.", 403);
    throw new ApiError(result.message || "Something went wrong. Please try again.", response.status);
  }
  return result;
}

// fetch() throws a TypeError when the server cannot be reached
export const errorMessage = (error: unknown) =>
  error instanceof TypeError
    ? "Could not reach the server. Please try again."
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
