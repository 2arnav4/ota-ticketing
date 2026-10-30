import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyError } from "../src/utils/errorKind.ts";

// Shapes match ApiError / NetworkError in src/api/client.ts (name, status, code, details).
const api = (status, code, details = {}) => Object.assign(new Error("server text the user must not see"), { name: "ApiError", status, code, details });

test("no answer from the server is a network error, whatever its message says", () => {
  const err = Object.assign(new Error("Can't reach the server (http://192.168.1.9:4000)"), { name: "NetworkError" });
  assert.deepEqual(classifyError(err), { kind: "network" });
});

test("5xx is a server error: the UI must not show the server's message", () => {
  assert.deepEqual(classifyError(api(500, "INTERNAL")), { kind: "server" });
  assert.deepEqual(classifyError(api(503, "HTTP_503")), { kind: "server" });
});

test("4xx keeps only its code and details so screens can explain it in their own words", () => {
  assert.deepEqual(classifyError(api(409, "NOT_ENOUGH_LEFT", { ticketsLeft: 1 })), {
    kind: "known",
    code: "NOT_ENOUGH_LEFT",
    details: { ticketsLeft: 1 },
  });
});

test("anything else (TypeError, strings, null) is unknown", () => {
  assert.deepEqual(classifyError(new TypeError("x is undefined")), { kind: "unknown" });
  assert.deepEqual(classifyError("boom"), { kind: "unknown" });
  assert.deepEqual(classifyError(null), { kind: "unknown" });
});
