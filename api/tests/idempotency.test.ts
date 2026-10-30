import { randomUUID } from "node:crypto";
import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/createApp";
import { prisma } from "../src/db/prisma";

// The app resends a queued booking after a dropped connection with the same Idempotency-Key. These tests prove a
// resend can never book twice, whatever happened to the first attempt.
const app = createApp();
const rohan = SEED_USERS.rohan.id;

function book(eventId: string, quantity: number, key?: string, userId: string = rohan) {
  const req = request(app).post(`/events/${eventId}/book`).set("X-User-Id", userId).send({ quantity });
  return key ? req.set("Idempotency-Key", key) : req;
}

async function stock(eventId: string): Promise<{ left: number; tickets: number }> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  return { left: event.ticketsLeft, tickets: await prisma.ticket.count({ where: { eventId, userId: rohan } }) };
}

beforeEach(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

describe("Idempotency-Key on POST /events/:id/book", () => {
  it("a resend with the same key returns the same tickets and books nothing new", async () => {
    const key = randomUUID();
    const first = await book(SEED_EVENTS.delhiDay1.id, 2, key);
    const resend = await book(SEED_EVENTS.delhiDay1.id, 2, key);

    expect(first.status).toBe(201);
    expect(resend.status).toBe(201);
    expect(resend.headers["idempotent-replayed"]).toBe("true");
    expect(first.headers["idempotent-replayed"]).toBeUndefined();
    expect(resend.body.tickets.map((t: { code: string }) => t.code)).toEqual(
      first.body.tickets.map((t: { code: string }) => t.code),
    );
    expect(await stock(SEED_EVENTS.delhiDay1.id)).toEqual({ left: SEED_EVENTS.delhiDay1.ticketsLeft - 2, tickets: 2 });
  });

  it("10 simultaneous copies of one booking (same key) book exactly once", async () => {
    const key = randomUUID();
    const results = await Promise.all(Array.from({ length: 10 }, () => book(SEED_EVENTS.cosplay.id, 3, key)));

    expect(results.every((r) => r.status === 201)).toBe(true);
    const codeSets = new Set(results.map((r) => r.body.tickets.map((t: { code: string }) => t.code).join(",")));
    expect(codeSets.size).toBe(1); // every copy got the same 3 tickets
    expect(await stock(SEED_EVENTS.cosplay.id)).toEqual({ left: SEED_EVENTS.cosplay.ticketsLeft - 3, tickets: 3 });
    expect(await prisma.bookingRequest.count()).toBe(1);
  });

  it("a refused booking keeps nothing, so the same key can be retried", async () => {
    const key = randomUUID();
    const refused = await book(SEED_EVENTS.delhiDay2.id, 3, key); // only 2 left
    expect(refused.status).toBe(409);
    expect(await prisma.bookingRequest.count()).toBe(0);

    await prisma.event.update({ where: { id: SEED_EVENTS.delhiDay2.id }, data: { ticketsLeft: 5 } });
    const retried = await book(SEED_EVENTS.delhiDay2.id, 3, key);
    expect(retried.status).toBe(201);
    expect(retried.headers["idempotent-replayed"]).toBeUndefined();
  });

  it("reusing a key for a different booking is refused with 422 and changes nothing", async () => {
    const key = randomUUID();
    await book(SEED_EVENTS.delhiDay1.id, 1, key);
    const otherQuantity = await book(SEED_EVENTS.delhiDay1.id, 2, key);
    const otherEvent = await book(SEED_EVENTS.calligraphy.id, 1, key);

    for (const res of [otherQuantity, otherEvent]) {
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
    }
    expect(await stock(SEED_EVENTS.delhiDay1.id)).toEqual({ left: SEED_EVENTS.delhiDay1.ticketsLeft - 1, tickets: 1 });
  });

  it("keys are per user: another user's key value doesn't replay their booking", async () => {
    const key = randomUUID();
    const aiko = await book(SEED_EVENTS.calligraphy.id, 1, key, SEED_USERS.aiko.id);
    const rohanSameKey = await book(SEED_EVENTS.calligraphy.id, 1, key);

    expect(rohanSameKey.status).toBe(201);
    expect(rohanSameKey.headers["idempotent-replayed"]).toBeUndefined();
    expect(rohanSameKey.body.tickets[0].code).not.toBe(aiko.body.tickets[0].code);
  });

  it("rejects a key that isn't a UUID with 400", async () => {
    const res = await book(SEED_EVENTS.delhiDay1.id, 1, "not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("without a key, every request is a new booking (unchanged behaviour)", async () => {
    await book(SEED_EVENTS.delhiDay1.id, 1);
    await book(SEED_EVENTS.delhiDay1.id, 1);
    expect(await stock(SEED_EVENTS.delhiDay1.id)).toEqual({ left: SEED_EVENTS.delhiDay1.ticketsLeft - 2, tickets: 2 });
  });

  it("the seed reset clears idempotency records", async () => {
    await book(SEED_EVENTS.delhiDay1.id, 1, randomUUID());
    await seedDemoData(prisma);
    expect(await prisma.bookingRequest.count()).toBe(0);
  });
});

describe("CORS for the Idempotency-Key header", () => {
  it("allows the header in a preflight from the web app", async () => {
    const res = await request(app)
      .options(`/events/${SEED_EVENTS.delhiDay1.id}/book`)
      .set("Origin", "http://localhost:8081")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,x-user-id,idempotency-key");
    expect(res.headers["access-control-allow-headers"]).toMatch(/Idempotency-Key/i);
  });
});
