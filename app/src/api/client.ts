import { API_URL } from "@/config/api";

const REQUEST_TIMEOUT_MS = 10_000;

/** The server answered with its standard error body. `code` is what the UI branches on. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** No answer at all: server down, wrong URL, phone on another network, or timeout. */
export class NetworkError extends Error {
  constructor(readonly url: string) {
    super(`Can't reach the server (${url})`);
    this.name = "NetworkError";
  }
}

type RequestOptions = {
  userId: string;
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, { userId, method = "GET", body, signal }: RequestOptions): Promise<T> {
  // Own controller so a hung server times out; also follows React Query's signal when a query is cancelled.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        "X-User-Id": userId,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    throw new NetworkError(API_URL);
  } finally {
    clearTimeout(timeout);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; details?: Record<string, unknown> } } | null)
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? `HTTP_${response.status}`,
      error?.message ?? `Request failed (${response.status})`,
      error?.details ?? {},
    );
  }
  return payload as T;
}
