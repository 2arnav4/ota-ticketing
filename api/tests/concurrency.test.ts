// Gauntlet: concurrency. Real HTTP through supertest into one app, real MySQL, no mocks.
// Every test asserts the conservation law: tickets that exist == capacity sold, and ticketsLeft never < 0.
import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/createApp";
import { prisma } from "../src/db/prisma";

const app = createApp();
const FANS = [SEED_USERS.aiko.id, SEED_USERS.rohan.id];

function book(eventId: string, quantity: number, userId: string) {
  return request(app).post(`/events/${eventId}/book`).set("X-User-Id", userId).send({ quantity });
}

async function soldFor(eventId: string): Promise<{ ticketsLeft: number; ticketRows: number }> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  const ticketRows = await prisma.ticket.count({ where: { eventId } });
  return { ticketsLeft: event.ticketsLeft, ticketRows };
}

beforeEach(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

jest.setTimeout(60_000);

describe("Gauntlet: concurrent bookings", () => {
  it("50 parallel 1-ticket bookings on a 2-left event: exactly 2 succeed, 48 get 409", async () => {
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) => book(SEED_EVENTS.delhiDay2.id, 1, FANS[i % 2]!)),
    );
    const created = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(created).toHaveLength(2);
    expect(conflicts).toHaveLength(48);
    expect(new Set(conflicts.map((r) => r.body.error.code))).toEqual(new Set(["SOLD_OUT"]));
    expect(await soldFor(SEED_EVENTS.delhiDay2.id)).toEqual({ ticketsLeft: 0, ticketRows: 2 });
  });

  it("mixed quantities 1-4 racing for 18 seats never oversell and stock matches tickets exactly", async () => {
    const quantities = Array.from({ length: 40 }, (_, i) => (i % 4) + 1); // 100 seats requested for 18
    const results = await Promise.all(quantities.map((q, i) => book(SEED_EVENTS.cosplay.id, q, FANS[i % 2]!)));

    const soldViaApi = results
      .filter((r) => r.status === 201)
      .reduce((sum, r) => sum + (r.body.tickets as unknown[]).length, 0);
    const { ticketsLeft, ticketRows } = await soldFor(SEED_EVENTS.cosplay.id);

    expect(results.every((r) => r.status === 201 || r.status === 409)).toBe(true);
    expect(ticketsLeft).toBeGreaterThanOrEqual(0);
    expect(soldViaApi).toBe(ticketRows);
    expect(ticketsLeft + ticketRows).toBe(SEED_EVENTS.cosplay.ticketsLeft);
    // Whatever is left must be smaller than the smallest request that was refused for lack of stock.
    const refused = results.filter((r) => r.body?.error?.code === "NOT_ENOUGH_LEFT").map((r) => r.body.error.details.requested);
    if (refused.length > 0) expect(ticketsLeft).toBeLessThan(Math.min(...refused));
  });

  it("parallel bookings on different events don't block or corrupt each other", async () => {
    const plan = [
      ...Array.from({ length: 10 }, () => [SEED_EVENTS.delhiDay1.id, 2] as const),
      ...Array.from({ length: 10 }, () => [SEED_EVENTS.calligraphy.id, 3] as const),
    ];
    const results = await Promise.all(plan.map(([id, q], i) => book(id, q, FANS[i % 2]!)));

    expect(results.filter((r) => r.status === 201)).toHaveLength(20);
    expect(await soldFor(SEED_EVENTS.delhiDay1.id)).toEqual({
      ticketsLeft: SEED_EVENTS.delhiDay1.ticketsLeft - 20,
      ticketRows: 2 + 20, // 2 seed tickets
    });
    expect(await soldFor(SEED_EVENTS.calligraphy.id)).toEqual({ ticketsLeft: 0, ticketRows: 30 });
  });

  it("all generated codes across a burst are unique", async () => {
    const results = await Promise.all(Array.from({ length: 25 }, (_, i) => book(SEED_EVENTS.delhiDay1.id, 4, FANS[i % 2]!)));
    const codes = results.flatMap((r) => (r.body.tickets as { code: string }[]).map((t) => t.code));
    expect(codes).toHaveLength(100);
    expect(new Set(codes).size).toBe(100);
  });
});

describe("Gauntlet: concurrent check-ins", () => {
  it("20 parallel scans of one code: exactly 1 succeeds, 19 get 409 with the same original time", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app).post("/checkins").set("X-User-Id", SEED_USERS.staff.id).send({ code: "P8W2H6TJ5NC1" }),
      ),
    );
    const ok = results.filter((r) => r.status === 200);
    const conflicts = results.filter((r) => r.status === 409);
    expect(ok).toHaveLength(1);
    expect(conflicts).toHaveLength(19);
    const times = new Set(conflicts.map((r) => r.body.error.details.checkedInAt));
    expect(times).toEqual(new Set([ok[0]!.body.ticket.checkedInAt]));
  });

  it("parallel scans of different codes all succeed", async () => {
    const booked = await book(SEED_EVENTS.delhiDay1.id, 4, SEED_USERS.rohan.id);
    const codes: string[] = booked.body.tickets.map((t: { code: string }) => t.code);
    const results = await Promise.all(
      codes.map((code) => request(app).post("/checkins").set("X-User-Id", SEED_USERS.staff.id).send({ code })),
    );
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);
  });
});
