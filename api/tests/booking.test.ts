import { randomUUID } from "node:crypto";
import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";

const app = createApp();
const rohan = SEED_USERS.rohan.id;

function book(eventId: string, body: unknown, userId = rohan) {
  return request(app).post(`/events/${eventId}/book`).set("X-User-Id", userId).send(body as object);
}

beforeEach(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /events/:id/book", () => {
  it("books tickets, returns them with unique codes and decrements stock", async () => {
    const res = await book(SEED_EVENTS.delhiDay1.id, { quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.tickets).toHaveLength(2);
    for (const ticket of res.body.tickets) {
      expect(ticket.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
      expect(ticket.checkedInAt).toBeNull();
      expect(ticket.event.id).toBe(SEED_EVENTS.delhiDay1.id);
    }
    expect(new Set(res.body.tickets.map((t: { code: string }) => t.code)).size).toBe(2);

    const event = await prisma.event.findUniqueOrThrow({ where: { id: SEED_EVENTS.delhiDay1.id } });
    expect(event.ticketsLeft).toBe(SEED_EVENTS.delhiDay1.ticketsLeft - 2);
    expect(await prisma.ticket.count({ where: { userId: rohan } })).toBe(2);
  });

  it.each([
    ["zero", { quantity: 0 }],
    ["five", { quantity: 5 }],
    ["negative", { quantity: -1 }],
    ["a float", { quantity: 1.5 }],
    ["a numeric string", { quantity: "2" }],
    ["null", { quantity: null }],
    ["missing", {}],
    ["huge", { quantity: 1e308 }],
    ["an extra field (mass assignment)", { quantity: 1, userId: SEED_USERS.aiko.id }],
  ])("rejects quantity %s with 400 and changes nothing", async (_label, body) => {
    const res = await book(SEED_EVENTS.delhiDay1.id, body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(await prisma.ticket.count({ where: { userId: rohan } })).toBe(0);
  });

  it("rejects a malformed event id with 400", async () => {
    const res = await book("not-a-uuid", { quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown event", async () => {
    const res = await book(randomUUID(), { quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("EVENT_NOT_FOUND");
  });

  it("returns 409 NOT_ENOUGH_LEFT with the remaining count when asking for more than is left", async () => {
    const res = await book(SEED_EVENTS.delhiDay2.id, { quantity: 3 });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: "NOT_ENOUGH_LEFT", details: { ticketsLeft: 2, requested: 3 } });
  });

  it("returns 409 SOLD_OUT for a sold-out event", async () => {
    const res = await book(SEED_EVENTS.meetup.id, { quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SOLD_OUT");
  });

  it("returns 409 EVENT_STARTED for a past event", async () => {
    const res = await book(SEED_EVENTS.pastMatsuri.id, { quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EVENT_STARTED");
  });

  it("can book the last tickets exactly, then reports sold out", async () => {
    expect((await book(SEED_EVENTS.delhiDay2.id, { quantity: 2 })).status).toBe(201);
    const after = await book(SEED_EVENTS.delhiDay2.id, { quantity: 1 });
    expect(after.body.error.code).toBe("SOLD_OUT");
  });
});

// F6 from the brief: concurrent bookings must never sell more than ticketsLeft.
describe("overselling", () => {
  it("10 parallel single-ticket bookings on a 2-left event: exactly 2 succeed, stock ends at 0", async () => {
    const attempts = Array.from({ length: 10 }, () => book(SEED_EVENTS.delhiDay2.id, { quantity: 1 }));
    const results = await Promise.all(attempts);

    const statuses = results.map((res) => res.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(2);
    expect(statuses.filter((s) => s === 409)).toHaveLength(8);

    const event = await prisma.event.findUniqueOrThrow({ where: { id: SEED_EVENTS.delhiDay2.id } });
    expect(event.ticketsLeft).toBe(0);
    expect(await prisma.ticket.count({ where: { eventId: SEED_EVENTS.delhiDay2.id } })).toBe(2);
  });
});

describe("rate limit", () => {
  it("returns 429 once a client exceeds the per-minute write budget", async () => {
    const limitedApp = createApp({ writesPerMinute: 2 });
    const send = () =>
      request(limitedApp)
        .post(`/events/${SEED_EVENTS.calligraphy.id}/book`)
        .set("X-User-Id", rohan)
        .send({ quantity: 1 });

    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(201);
    const third = await send();
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
  });
});
