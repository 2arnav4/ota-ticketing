import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/createApp";
import { prisma } from "../src/db/prisma";
import { listUpcomingEvents } from "../src/services/eventService";

const app = createApp();

beforeAll(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

describe("GET /events", () => {
  it("requires X-User-Id", async () => {
    const res = await request(app).get("/events");
    expect(res.status).toBe(400);
  });

  it("lists upcoming events soonest first, hides past ones, keeps sold-out ones", async () => {
    const res = await request(app).get("/events").set("X-User-Id", SEED_USERS.rohan.id);
    expect(res.status).toBe(200);
    const names = res.body.events.map((event: { name: string }) => event.name);
    expect(names).toEqual([
      "Ōta TOKYO Delhi: Day 1",
      "Ōta TOKYO Delhi: Day 2",
      "Anime Fans Meetup",
      "Cosplay Craft Workshop",
      "Japanese Calligraphy Session",
    ]);
    expect(names).not.toContain("Ōta Summer Matsuri");
  });

  it("returns price in integer paise and the stock fields", async () => {
    const res = await request(app).get("/events").set("X-User-Id", SEED_USERS.rohan.id);
    const day2 = res.body.events.find((event: { id: string }) => event.id === SEED_EVENTS.delhiDay2.id);
    expect(day2).toEqual({
      id: SEED_EVENTS.delhiDay2.id,
      name: "Ōta TOKYO Delhi: Day 2",
      venue: "Yashobhoomi (IICC)",
      city: "New Delhi",
      startsAt: "2026-11-29T05:30:00.000Z",
      pricePaise: 34900,
      capacity: 5000,
      ticketsLeft: 2,
    });
  });
});

describe("listUpcomingEvents", () => {
  it("drops events that have started relative to the given clock", async () => {
    const events = await listUpcomingEvents(new Date("2026-12-01T00:00:00Z"));
    expect(events.map((event) => event.id)).toEqual([
      SEED_EVENTS.meetup.id,
      SEED_EVENTS.cosplay.id,
      SEED_EVENTS.calligraphy.id,
    ]);
  });
});
