import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/createApp";
import { prisma } from "../src/db/prisma";

const app = createApp();
const staff = SEED_USERS.staff.id;
const UNUSED_CODE = "7K3M9QX2RB4D";
const USED_CODE = "Z4R7E2KM9VB3";

function checkIn(body: unknown, userId: string = staff) {
  return request(app).post("/checkins").set("X-User-Id", userId).send(body as object);
}

beforeEach(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /checkins", () => {
  it("checks a ticket in once and returns it with the holder's name", async () => {
    const res = await checkIn({ code: UNUSED_CODE });
    expect(res.status).toBe(200);
    expect(res.body.ticket).toMatchObject({
      code: UNUSED_CODE,
      holderName: "Aiko Sharma",
      event: { id: SEED_EVENTS.delhiDay1.id },
    });
    expect(Date.parse(res.body.ticket.checkedInAt)).not.toBeNaN();
  });

  it("refuses a second scan with 409 and the original check-in time", async () => {
    const first = await checkIn({ code: UNUSED_CODE });
    const second = await checkIn({ code: UNUSED_CODE });
    expect(second.status).toBe(409);
    expect(second.body.error).toMatchObject({
      code: "ALREADY_CHECKED_IN",
      details: { checkedInAt: first.body.ticket.checkedInAt },
    });
  });

  it("reports the seeded used ticket's original time", async () => {
    const res = await checkIn({ code: USED_CODE });
    expect(res.status).toBe(409);
    expect(res.body.error.details.checkedInAt).toBe("2026-08-15T07:12:00.000Z");
  });

  it("accepts a typed code with dashes and lowercase", async () => {
    const res = await checkIn({ code: "7k3m-9qx2-rb4d" });
    expect(res.status).toBe(200);
  });

  it("returns 404 for a well-formed code that doesn't exist", async () => {
    const res = await checkIn({ code: "0000-0000-0000" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TICKET_NOT_FOUND");
  });

  it.each([
    ["missing", {}],
    ["too short", { code: "ABC" }],
    ["a number", { code: 123456789012 }],
    ["SQL", { code: "' OR 1=1 --" }],
    ["very long", { code: "A".repeat(500) }],
    ["an extra field", { code: UNUSED_CODE, checkedInAt: null }],
  ])("rejects a %s code with 400", async (_label, body) => {
    const res = await checkIn(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("forbids fans with 403 and leaves the ticket unused", async () => {
    const res = await checkIn({ code: UNUSED_CODE }, SEED_USERS.aiko.id);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { code: UNUSED_CODE } });
    expect(ticket.checkedInAt).toBeNull();
  });

  it("answers 403 before validating the body, so fans learn nothing about codes", async () => {
    const res = await checkIn({ code: "garbage" }, SEED_USERS.rohan.id);
    expect(res.status).toBe(403);
  });

  it("shows the check-in on the owner's My Tickets", async () => {
    await checkIn({ code: UNUSED_CODE });
    const res = await request(app).get("/me/tickets").set("X-User-Id", SEED_USERS.aiko.id);
    const ticket = res.body.tickets.find((t: { code: string }) => t.code === UNUSED_CODE);
    expect(ticket.checkedInAt).not.toBeNull();
  });
});

describe("check-in race", () => {
  it("5 parallel scans of one code: exactly 1 succeeds, 4 get 409", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => checkIn({ code: UNUSED_CODE })));
    const statuses = results.map((res) => res.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
  });
});
