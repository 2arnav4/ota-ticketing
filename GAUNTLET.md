# Gauntlet: test results

Run 2026-10-30 on a MacBook Air (Apple M2), Node 24.18.1, MySQL 8.4 in Docker. **Local and test databases
only**, never a deployed URL. Findings are reported here, not fixed (fixes are a separate decision).

| Pass | Result |
|---|---|
| Unit + integration (API) | **84 / 84 pass**: real HTTP (supertest) → routes → services → MySQL `ota_test`, no mocks |
| Unit (app) | **7 / 7 pass**: formatters (run under `TZ=America/New_York` to prove IST rendering), EN/JA key parity |
| Concurrency | **6 / 6 pass**: no oversell, no double check-in (details below) |
| Load (autocannon, 1,000 users per scenario) | **Invariants hold, 0 × 5xx** (details below) |
| Break it (fresh-context security review) | 0 critical. 1 high (the documented no-auth gap), 1 medium, 2 low, 1 info. All re-verified |
| Browser smoke (headless Chrome, web build) | **7 / 7 steps pass**: list, book, sold out, fan has no Scan tab, scan twice, 日本語, persistence |

Re-run: `cd api && npm test` · `cd app && npm test` · load test: see bottom.

## Concurrency (`api/tests/concurrency.test.ts`)

| Test | Result |
|---|---|
| 50 parallel 1-ticket bookings, event with 2 left | 2 × 201, 48 × 409 `SOLD_OUT`; `ticketsLeft` 0; 2 ticket rows |
| 40 bookings of 1-4 tickets (100 requested) for 18 seats | No oversell; `ticketsLeft + ticketRows = 18`; leftover < smallest refused request |
| 10 + 10 parallel bookings on two events | All 20 succeed; both events' stock and rows exact |
| 25 × 4-ticket burst | 100 codes, 100 unique |
| 20 parallel scans of one code | 1 × 200, 19 × 409, all 19 report the same original `checkedInAt` |
| 4 different codes scanned in parallel | 4 × 200 |

## Load test (`api/loadtest/run.ts`, autocannon 8.0.0)

Target: one local API process (`RATE_LIMIT_PER_MINUTE` raised, so the app, not the limiter, is measured),
database `ota_load`. Each storm is 1,000 users.

**Run A: 200 concurrent connections**

| Scenario | Requests | Req/s | p50 | p99 | max | Status codes | Socket errors |
|---|---|---|---|---|---|---|---|
| GET /events, 20 s | 57,040 | 2,853 | 65 ms | 134 ms | 205 ms | 200: 57,040 | 0 |
| Book 1 ticket × 1,000 on the 2-left event | 1,000 | 1,000 | 160 ms | 196 ms | 203 ms | 201: 2, 409: 998 | 0 |
| Book 1 ticket, 15 s, Day 1 (4,120 left) | 9,380 | 625 | 232 ms | 595 ms | 614 ms | 201: 4,120, 409: 5,260 | 0 |
| Check in one code × 1,000 | 1,000 | 1,000 | 165 ms | 185 ms | 186 ms | 200: 1, 409: 999 | 0 |

Invariants after the run (checked through the API): 2-left storm sold exactly 2; Day 1 stock fell by exactly
4,120 = 201 responses = Rohan's new tickets (sold out, never negative); one code checked in exactly once.

**Run B: 1,000 concurrent connections (all users open sockets at once)**

| Scenario | Requests answered | Status codes | Socket errors | Error rate |
|---|---|---|---|---|
| GET /events, 20 s | 50,034 | 200: 50,034 | 2,628 | 5.0% |
| Book × 1,000 on the 2-left event | 533 | 201: 2, 409: 531 | 467 | 46.7% |
| Book, 15 s, Day 1 | 6,783 | 201: 4,120, 409: 2,663 | 1,082 | 13.8% |
| Check in × 1,000 | 561 | 200: 1, 409: 560 | 439 | 43.9% |

The socket errors are `ECONNRESET` from the **operating system**, not the app: macOS caps the TCP accept queue at
`kern.ipc.somaxconn = 128`, so a single process can't accept 1,000 brand-new sockets at the same instant. Proof:
the same probe against `/health` (one `SELECT 1`) gives 0 errors at 100, 128 and 200 connections, 68 at 500 and
252 at 1,000. In Run B every request that reached the app got a correct answer, and the invariants still held
(exactly 2 sold on the 2-left event, exactly 1 check-in). On Vercel, connections are spread across instances by
the platform, so this local limit doesn't carry over.

Not measured here: behaviour against the hosted Aiven free tier (its connection cap and latency) and Vercel cold
starts. The API's pool is 5 connections per instance with a 10 s wait for a transaction slot.

## Break it (security review)

Run by a separate agent with no access to this build's reasoning, against a local API (`:4002`, normal rate
limit, cron route enabled). Every finding below was reproduced again by the main session before being listed.

| ID | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| F-1 | High (accepted) | `X-User-Id` is spoofable, including fan → staff: anyone who knows the staff UUID can check tickets in | `POST /checkins` with the staff UUID → 200; with a fan UUID → 403 | **Known, documented.** The brief excludes login. Fix = real auth (session/JWT); role from a verified principal |
| F-2 | Medium | Request logs include all headers, so `Authorization: Bearer <CRON_SECRET>` (and `X-User-Id`) are written to logs in plain text | Throwaway API with `CRON_SECRET=verify-secret-…`: one cron call → secret appears in 2 log lines | **Open.** Suggested fix: pino `redact` for `req.headers.authorization` (and `x-user-id`). On Vercel, anyone with log access would see the secret |
| F-3 | Low | Rate limit bypass by sending a fake `X-Forwarded-For` (`trust proxy = 1` trusts it) | Limit 2/min: plain requests `201 201 429`; with `X-Forwarded-For: 11.11.11.11` → passes the limiter | **Local only.** Vercel overwrites `X-Forwarded-For` to prevent spoofing ([docs](https://vercel.com/docs/headers/request-headers)), so production is not affected. The per-instance limit itself is a documented gap |
| F-4 | Low | A successful check-in returns the holder's name | `"holderName": "Aiko Sharma"` | Intended for gate staff; exposure only via F-1 |
| F-5 | Info | Check-in answers differ for unknown (404), unused (200) and used (409) codes | Observed | Staff-only, and codes are 60-bit random, so enumeration is infeasible. No action |

**Attacks that held:** mass assignment (`{"quantity":1,"ticketsLeft":9999}` → 400), prototype pollution
(`__proto__`, `constructor` → 400), quantity as `"2"` / `2.5` / `-1` / `999999999` / `[1]` / `{}` / `Infinity` →
400, SQL injection in path / header / body → 400 (zod validation, Prisma parameterises anyway), 50 parallel
bookings on 2 left → exactly 2, 50 parallel check-ins → exactly 1, body > 10 kB → 413, non-JSON / top-level array /
deeply nested JSON → 400 without a crash, CORS from other origins and `Origin: null` → not allowed, cron route
without or with a wrong secret → 401 (constant-time compare; 404 when unset), wrong methods and `../` paths → 404,
error bodies never contain stack traces, SQL or Prisma messages, helmet headers present, `x-powered-by` off.

## How to re-run the load test

```bash
docker exec ota-mysql mysql -uota -pota_local -e "CREATE DATABASE IF NOT EXISTS ota_load"
cd api
export LOAD_DB=mysql://ota:ota_local@localhost:3306/ota_load
DATABASE_URL=$LOAD_DB npx prisma migrate deploy && DATABASE_URL=$LOAD_DB npm run db:seed
ulimit -n 10240
PORT=4001 RATE_LIMIT_PER_MINUTE=1000000 LOG_LEVEL=warn DATABASE_URL=$LOAD_DB npx tsx src/index.ts &   # terminal 1
LOAD_TARGET=http://localhost:4001 LOAD_CONNECTIONS=200 npm run loadtest                              # terminal 2
```

The script refuses any target that isn't `localhost`. Re-seed `ota_load` before each run.
