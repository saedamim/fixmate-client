import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/data/services";

export const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

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
    if (response.status === 401) throw new Error(SESSION_EXPIRED);
    if (response.status === 403) throw new Error(forbiddenMessage ?? "You do not have access to this.");
    throw new Error(result.message || "Something went wrong. Please try again.");
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
