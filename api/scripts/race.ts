/**
 * Race-condition demo: fires N bookings at the same instant at one event and checks nothing was oversold.
 * LOCAL ONLY (refuses non-localhost targets). Watch `npm run dev:logs` in another terminal while it runs.
 *
 *   npm run race                       # 20 one-ticket bookings at "Ōta TOKYO Delhi: Day 2"
 *   npm run race -- --attempts 50 --event cosplay --quantity 3
 *   npm run db:seed                    # put the demo back afterwards
 */
import { parseArgs } from "node:util";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";

const { values } = parseArgs({
  options: {
    target: { type: "string", default: process.env.API_URL ?? "http://localhost:4000" },
    event: { type: "string", default: "delhiDay2" },
    attempts: { type: "string", default: "20" },
    quantity: { type: "string", default: "1" },
  },
});

const target = values.target;
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(target)) {
  throw new Error(`Refusing to race ${target}: local targets only`);
}
const aliases = SEED_EVENTS as Record<string, { id: string; name: string }>;
const event = aliases[values.event] ?? Object.values(SEED_EVENTS).find((e) => e.id === values.event);
if (!event) {
  throw new Error(`Unknown event "${values.event}". Use one of: ${Object.keys(SEED_EVENTS).join(", ")}`);
}
const attempts = Number(values.attempts);
const quantity = Number(values.quantity);
const buyers = [SEED_USERS.aiko, SEED_USERS.rohan];

async function ticketsLeft(): Promise<number> {
  const res = await fetch(`${target}/events`, { headers: { "X-User-Id": SEED_USERS.rohan.id } });
  const { events } = (await res.json()) as { events: { id: string; ticketsLeft: number }[] };
  const found = events.find((e) => e.id === event!.id);
  if (!found) throw new Error(`${event!.name} is not an upcoming event (it may have started)`);
  return found.ticketsLeft;
}

async function main() {
  const before = await ticketsLeft();
  console.log(`\n${event!.name}: ${before} left. Firing ${attempts} bookings of ${quantity} at once...\n`);

  // Build every request first, then release them together so they genuinely overlap at the server.
  const started = performance.now();
  const results = await Promise.all(
    Array.from({ length: attempts }, async (_, i) => {
      const buyer = buyers[i % buyers.length]!;
      const res = await fetch(`${target}/events/${event!.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": buyer.id },
        body: JSON.stringify({ quantity }),
      });
      const body = (await res.json()) as { tickets?: { code: string }[]; error?: { code: string } };
      return { i, buyer: buyer.name, status: res.status, detail: body.tickets?.map((t) => t.code).join(", ") ?? body.error?.code };
    }),
  );
  const elapsed = Math.round(performance.now() - started);

  for (const r of results) {
    console.log(`#${String(r.i + 1).padStart(2)}  ${r.buyer.padEnd(12)} ${r.status}  ${r.detail}`);
  }

  const after = await ticketsLeft();
  const won = results.filter((r) => r.status === 201).length;
  const lost = results.filter((r) => r.status === 409).length;
  const other = results.length - won - lost;
  const sold = won * quantity;
  const expectedWins = Math.min(attempts, Math.floor(before / quantity));
  const ok = after >= 0 && before - after === sold && won === expectedWins && other === 0;

  console.log(`\nAll ${attempts} requests finished in ${elapsed} ms.`);
  console.log(`Booked: ${won} (expected ${expectedWins}) · Refused 409: ${lost} · Other: ${other}`);
  console.log(`Stock: ${before} → ${after} (sold ${sold}, never below 0)`);
  console.log(ok ? "\nPASS: no overselling." : "\nFAIL: invariant broken, see above.");
  process.exitCode = ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
