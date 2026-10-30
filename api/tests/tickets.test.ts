import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";

const app = createApp();

beforeEach(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

function myTickets(userId: string) {
  return request(app).get("/me/tickets").set("X-User-Id", userId);
}

describe("GET /me/tickets", () => {
  it("requires X-User-Id", async () => {
    expect((await request(app).get("/me/tickets")).status).toBe(400);
  });

  it("returns the user's tickets with event details and check-in status", async () => {
    const res = await myTickets(SEED_USERS.aiko.id);
    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(3);

    const used = res.body.tickets.find((t: { code: string }) => t.code === "Z4R7E2KM9VB3");
    expect(used.checkedInAt).toBe("2026-08-15T07:12:00.000Z");
    expect(used.event).toEqual({
      id: SEED_EVENTS.pastMatsuri.id,
      name: "Ōta Summer Matsuri",
      venue: "Phoenix Marketcity",
      city: "Pune",
      startsAt: "2026-08-15T06:30:00.000Z",
    });
  });

  it("orders by event date, so the past event comes first", async () => {
    const res = await myTickets(SEED_USERS.aiko.id);
    expect(res.body.tickets.map((t: { event: { id: string } }) => t.event.id)).toEqual([
      SEED_EVENTS.pastMatsuri.id,
      SEED_EVENTS.delhiDay1.id,
      SEED_EVENTS.delhiDay1.id,
    ]);
  });

  it("returns an empty list for a user with no tickets", async () => {
    const res = await myTickets(SEED_USERS.rohan.id);
    expect(res.body.tickets).toEqual([]);
  });

  it("never shows another user's tickets", async () => {
    await request(app)
      .post(`/events/${SEED_EVENTS.cosplay.id}/book`)
      .set("X-User-Id", SEED_USERS.rohan.id)
      .send({ quantity: 2 });

    const aiko = await myTickets(SEED_USERS.aiko.id);
    const rohan = await myTickets(SEED_USERS.rohan.id);
    expect(aiko.body.tickets).toHaveLength(3);
    expect(rohan.body.tickets).toHaveLength(2);
    const aikoCodes = new Set(aiko.body.tickets.map((t: { code: string }) => t.code));
    for (const ticket of rohan.body.tickets) {
      expect(aikoCodes.has(ticket.code)).toBe(false);
    }
  });
});
