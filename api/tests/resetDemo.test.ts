import request from "supertest";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { prisma } from "../src/db/prisma";

const SECRET = "test-cron-secret-0123456789";

// env.ts is parsed once at import, so each case loads a fresh module graph with its own CRON_SECRET.
function appWithSecret(secret: string | undefined) {
  jest.resetModules();
  if (secret) process.env.CRON_SECRET = secret;
  else delete process.env.CRON_SECRET;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createApp } = require("../src/createApp") as typeof import("../src/createApp");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("../src/db/prisma") as typeof import("../src/db/prisma");
  return { app: createApp(), db: db.prisma };
}

afterAll(() => prisma.$disconnect());

describe("GET /internal/reset-demo", () => {
  it("does not exist when CRON_SECRET is unset", async () => {
    const { app, db } = appWithSecret(undefined);
    const res = await request(app).get("/internal/reset-demo").set("Authorization", "Bearer anything");
    expect(res.status).toBe(404);
    await db.$disconnect();
  });

  it.each([
    ["missing", undefined],
    ["wrong", "Bearer wrong-secret-0123456789"],
    ["without Bearer", SECRET],
  ])("rejects a %s Authorization header with 401", async (_label, header) => {
    const { app, db } = appWithSecret(SECRET);
    const req = request(app).get("/internal/reset-demo");
    const res = await (header ? req.set("Authorization", header) : req);
    expect(res.status).toBe(401);
    await db.$disconnect();
  });

  it("resets demo state with the right secret", async () => {
    const { app, db } = appWithSecret(SECRET);
    await request(app)
      .post(`/events/${SEED_EVENTS.delhiDay2.id}/book`)
      .set("X-User-Id", SEED_USERS.rohan.id)
      .send({ quantity: 2 });

    const res = await request(app).get("/internal/reset-demo").set("Authorization", `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    const day2 = await db.event.findUniqueOrThrow({ where: { id: SEED_EVENTS.delhiDay2.id } });
    expect(day2.ticketsLeft).toBe(2);
    expect(await db.ticket.count({ where: { userId: SEED_USERS.rohan.id } })).toBe(0);
    await db.$disconnect();
    delete process.env.CRON_SECRET;
  });
});
