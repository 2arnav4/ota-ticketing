/**
 * Gauntlet load test. LOCAL ONLY: refuses any target that isn't localhost.
 * Simulates 1,000 concurrent users with autocannon, then checks the database-level invariants through the API.
 *
 *   PORT=4001 RATE_LIMIT_PER_MINUTE=1000000 LOG_LEVEL=warn DATABASE_URL=.../ota_load npx tsx src/index.ts
 *   LOAD_TARGET=http://localhost:4001 npx tsx loadtest/run.ts
 *
 * The target must run with a high RATE_LIMIT_PER_MINUTE, or the limiter (not the app) is what gets measured.
 */
import autocannon from "autocannon";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";

const TARGET = process.env.LOAD_TARGET ?? "http://localhost:4001";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(TARGET)) {
  throw new Error(`Refusing to load-test ${TARGET}: local targets only`);
}

const USERS = 1000;
// Sockets opened at once. 1,000 overflows macOS's TCP accept queue (kern.ipc.somaxconn = 128) on one local process
// and shows up as ECONNRESET "socket errors" that never reach the app. LOAD_CONNECTIONS=200 sends the same
// 1,000 users' requests over fewer sockets to separate OS limits from application behaviour.
const CONNECTIONS = Number(process.env.LOAD_CONNECTIONS ?? USERS);
const json = { "content-type": "application/json" };

type Summary = { name: string; requests: number; rps: number; p50: number; p97_5: number; p99: number; max: number; statuses: Record<string, number>; errors: number; timeouts: number };

function run(name: string, opts: Omit<autocannon.Options, "url">): Promise<Summary> {
  return new Promise((resolve, reject) => {
    const statuses: Record<string, number> = {};
    const instance = autocannon({ connections: CONNECTIONS, timeout: 30, ...opts, url: TARGET }, (err, result) => {
      if (err) return reject(err);
      resolve({
        name,
        requests: result.requests.total,
        rps: Math.round(result.requests.average),
        p50: result.latency.p50,
        p97_5: result.latency.p97_5,
        p99: result.latency.p99,
        max: result.latency.max,
        statuses,
        errors: result.errors,
        timeouts: result.timeouts,
      });
    });
    instance.on("response", (_client, statusCode) => {
      statuses[statusCode] = (statuses[statusCode] ?? 0) + 1;
    });
  });
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${TARGET}${path}`, init);
  return (await res.json()) as T;
}

async function event(id: string): Promise<{ ticketsLeft: number } | undefined> {
  const { events } = await api<{ events: { id: string; ticketsLeft: number }[] }>("/events", {
    headers: { "X-User-Id": SEED_USERS.rohan.id },
  });
  return events.find((e) => e.id === id);
}

async function main() {
  const reset = await fetch(`${TARGET}/health`);
  if (!reset.ok) throw new Error("target not healthy");

  const results: Summary[] = [];
  const checks: string[] = [];

  // 1. Reads: 1,000 users hammering the event list for 20 s.
  results.push(
    await run(`GET /events, ${CONNECTIONS} conns, 20s`, {
      duration: 20,
      headers: { "X-User-Id": SEED_USERS.rohan.id },
      requests: [{ method: "GET", path: "/events" }],
    }),
  );

  // 2. Oversell storm: 1,000 users each try to book 1 ticket on the 2-left event at once.
  const day2Before = (await event(SEED_EVENTS.delhiDay2.id))?.ticketsLeft;
  const storm = await run("POST book x1000 on 2-left event", {
    amount: USERS,
    headers: { ...json, "X-User-Id": SEED_USERS.aiko.id },
    requests: [{ method: "POST", path: `/events/${SEED_EVENTS.delhiDay2.id}/book`, body: JSON.stringify({ quantity: 1 }) }],
  });
  results.push(storm);
  const day2After = (await event(SEED_EVENTS.delhiDay2.id))?.ticketsLeft;
  checks.push(
    `2-left storm: ${storm.statuses["201"] ?? 0} booked (expected ${day2Before}), ticketsLeft ${day2Before} → ${day2After} (expected 0)`,
  );

  // 3. Sustained booking: 1,000 users booking 1 ticket on Day 1 (4,120 left) for 15 s.
  const day1Before = (await event(SEED_EVENTS.delhiDay1.id))?.ticketsLeft ?? 0;
  const sustained = await run(`POST book, ${CONNECTIONS} conns, 15s, Day 1`, {
    duration: 15,
    headers: { ...json, "X-User-Id": SEED_USERS.rohan.id },
    requests: [{ method: "POST", path: `/events/${SEED_EVENTS.delhiDay1.id}/book`, body: JSON.stringify({ quantity: 1 }) }],
  });
  results.push(sustained);
  const day1After = (await event(SEED_EVENTS.delhiDay1.id))?.ticketsLeft ?? 0;
  const { tickets } = await api<{ tickets: { event: { id: string } }[] }>("/me/tickets", {
    headers: { "X-User-Id": SEED_USERS.rohan.id },
  });
  const rohanDay1 = tickets.filter((t) => t.event.id === SEED_EVENTS.delhiDay1.id).length;
  checks.push(
    `Sustained: 201s=${sustained.statuses["201"] ?? 0}, stock dropped ${day1Before - day1After}, Rohan's Day 1 tickets=${rohanDay1} (all three must match)`,
  );

  // 4. Gate storm: 1,000 scans of one code at once.
  const gate = await run("POST /checkins x1000, same code", {
    amount: USERS,
    headers: { ...json, "X-User-Id": SEED_USERS.staff.id },
    requests: [{ method: "POST", path: "/checkins", body: JSON.stringify({ code: "P8W2H6TJ5NC1" }) }],
  });
  results.push(gate);
  checks.push(`Gate storm: 200s=${gate.statuses["200"] ?? 0} (expected 1), 409s=${gate.statuses["409"] ?? 0}`);

  console.log(`\nTarget ${TARGET}, ${CONNECTIONS} concurrent connections, ${USERS} users per storm.`);
  console.log("\n| Scenario | Requests | Req/s | p50 ms | p97.5 ms | p99 ms | max ms | Status codes | Socket errors | Timeouts |");
  console.log("|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const codes = Object.entries(r.statuses).map(([code, n]) => `${code}: ${n}`).join(", ");
    console.log(`| ${r.name} | ${r.requests} | ${r.rps} | ${r.p50} | ${r.p97_5} | ${r.p99} | ${r.max} | ${codes} | ${r.errors} | ${r.timeouts} |`);
  }
  console.log("\nInvariants:");
  for (const line of checks) console.log(`- ${line}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
