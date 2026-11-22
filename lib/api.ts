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


export async function callApi(path: string, { method = "GET", body, forbiddenMessage }: Options = {}) {
  const { data, error } = await authClient.token();
  if (error || !data?.token) throw new Error(SESSION_EXPIRED);

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${data.token}`,
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
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
