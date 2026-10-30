// Sorts any thrown value into what the UI is allowed to say about it. Users never see a URL, a stack, or the
// server's own English message: only these categories, each mapped to a translated sentence by the screen.
// Duck-typed on `name` (set by ApiError / NetworkError) so this file has no React Native imports and is unit-testable.
export type ErrorKind =
  | { kind: "network" } // no answer: offline, server down, timeout
  | { kind: "server" } // 5xx: our fault, nothing the user can fix
  | { kind: "known"; code: string; details: Record<string, unknown> } // 4xx with a code the screen may explain
  | { kind: "unknown" };

export function classifyError(error: unknown): ErrorKind {
  const e = error as { name?: string; status?: number; code?: string; details?: Record<string, unknown> } | null;
  if (e?.name === "NetworkError") return { kind: "network" };
  if (e?.name === "ApiError" && typeof e.status === "number") {
    if (e.status >= 500) return { kind: "server" };
    return { kind: "known", code: e.code ?? "", details: e.details ?? {} };
  }
  return { kind: "unknown" };
}

// Technical detail stays available to developers (Metro / browser console), never on screen.
export function logForDevelopers(error: unknown): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn("[ota] request failed:", error);
  }
}
