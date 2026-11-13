import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import net from "node:net";
import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS, SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/createApp";
import { prisma } from "../src/db/prisma";

type App = ReturnType<typeof createApp>;
const { rohan, aiko, staff } = SEED_USERS;

beforeEach(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

type BookOptions = { quantity?: number; eventId?: string; ip?: string; key?: string };
const bookAs = (app: App, userId: string, { quantity = 1, eventId = SEED_EVENTS.calligraphy.id, ip, key }: BookOptions = {}) => {
  let req = request(app).post(`/events/${eventId}/book`).set("X-User-Id", userId);
  if (ip) req = req.set("X-Forwarded-For", ip);
  if (key) req = req.set("Idempotency-Key", key);
  return req.send({ quantity });
};
// "garbage" fails validation (400), so a 400 means "not throttled" and nothing is written.
const checkIn = (app: App, ip?: string) => {
  const req = request(app).post("/checkins").set("X-User-Id", staff.id);
  return (ip ? req.set("X-Forwarded-For", ip) : req).send({ code: "garbage" });
};
// Simulates requests from different networks with the same setting production uses on Vercel (one trusted hop).
// createApp only sets it when VERCEL is defined; tests opt in here.
const behindProxy = (app: App) => app.set("trust proxy", 1);

describe("booking limit (per fan)", () => {
  it("returns 429 once a fan uses up their booking budget for the minute", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 2 } });

    expect((await bookAs(app, rohan.id)).status).toBe(201);
    expect((await bookAs(app, rohan.id)).status).toBe(201);
    const third = await bookAs(app, rohan.id);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
  });

  it("refunds invalid input, so junk sent under a fan's id can't use up their budget", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 1 } });

    for (let i = 0; i < 5; i++) expect((await bookAs(app, aiko.id, { quantity: 0 })).status).toBe(400);
    expect((await bookAs(app, aiko.id)).status).toBe(201);
    expect((await bookAs(app, aiko.id)).status).toBe(429);
  });

  it("counts sold-out attempts, since each one locks the event row", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 2 } });
    const soldOut = { eventId: SEED_EVENTS.meetup.id };

    expect((await bookAs(app, aiko.id, soldOut)).status).toBe(409);
    expect((await bookAs(app, aiko.id, soldOut)).status).toBe(409);
    expect((await bookAs(app, aiko.id, soldOut)).status).toBe(429);
  });

  // Limit: a replay is refunded after it runs, so one arriving when the budget is already spent still gets 429.
  // Avoiding that would need a DB lookup before every limit check, which is the cost the limiter exists to avoid.
  it("refunds idempotent replays, so offline resends don't use up a fan's budget", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 2 } });
    const key = randomUUID();

    expect((await bookAs(app, aiko.id, { key })).status).toBe(201);
    for (let i = 0; i < 3; i++) {
      const replay = await bookAs(app, aiko.id, { key });
      expect(replay.status).toBe(201);
      expect(replay.headers["idempotent-replayed"]).toBe("true");
    }
    expect((await bookAs(app, aiko.id, { key: randomUUID() })).status).toBe(201); // replays left room for this
    expect((await bookAs(app, aiko.id, { key: randomUUID() })).status).toBe(429);
  });

  // Review 3: the library's own refund (skipFailedRequests) also refunded requests whose connection closed early, even
  // though the booking still committed, so closing sockets mid-request booked past the limit.
  it("keeps counting a booking whose client hangs up before the reply", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 2 } });
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    const eventId = SEED_EVENTS.calligraphy.id;
    const body = JSON.stringify({ quantity: 1 });
    const raw =
      `POST /events/${eventId}/book HTTP/1.1\r\nHost: localhost\r\nX-User-Id: ${rohan.id}\r\n` +
      `Content-Type: application/json\r\nContent-Length: ${body.length}\r\n\r\n${body}`;

    // Hold the event row so each booking stalls inside its transaction, then hang up while it waits.
    const lock = prisma.$transaction(
      async (tx) => {
        await tx.$queryRawUnsafe("SELECT id FROM `Event` WHERE id = ? FOR UPDATE", eventId);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      },
      { timeout: 10_000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((done) => {
        const socket = net.connect(port, "127.0.0.1", () => {
          socket.write(raw);
          setTimeout(() => {
            socket.destroy();
            done();
          }, 100);
        });
      });
    }
    await lock;
    await new Promise((resolve) => setTimeout(resolve, 1000)); // let the stalled bookings finish

    const booked = await prisma.ticket.count({ where: { eventId, userId: rohan.id } });
    const next = await request(server).post(`/events/${eventId}/book`).set("X-User-Id", rohan.id).send({ quantity: 1 });
    server.close();
    expect(booked).toBe(2); // only the budget's worth got through
    expect(next.status).toBe(429);
  });

  it("gives each fan their own budget, even from the same IP (venue Wi-Fi)", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 1 } });

    expect((await bookAs(app, rohan.id)).status).toBe(201);
    expect((await bookAs(app, rohan.id)).status).toBe(429);
    expect((await bookAs(app, aiko.id)).status).toBe(201);
  });
});

describe("check-in limit (per staff user)", () => {
  it("counts failed attempts too, so guessing ticket codes is throttled", async () => {
    const app = createApp({ rateLimits: { checkinsPerUserPerMinute: 2 } });

    expect((await checkIn(app)).status).toBe(400);
    expect((await checkIn(app)).status).toBe(400);
    expect((await checkIn(app)).status).toBe(429);
  });

  it("is a separate budget from bookings, so bookings can't block the gate", async () => {
    const app = createApp({ rateLimits: { bookingsPerUserPerMinute: 1 } });

    await bookAs(app, rohan.id);
    expect((await bookAs(app, rohan.id)).status).toBe(429);
    expect((await checkIn(app)).status).toBe(400);
  });

  it("can't be used up from another network by someone sending the staff id", async () => {
    const app = behindProxy(createApp({ rateLimits: { checkinsPerUserPerMinute: 2 } }));

    await checkIn(app, "203.0.113.7");
    await checkIn(app, "203.0.113.7");
    expect((await checkIn(app, "203.0.113.7")).status).toBe(429); // the impersonator is throttled
    expect((await checkIn(app, "198.51.100.20")).status).toBe(400); // the real gate is not
  });
});

describe("IP limit (flood guard)", () => {
  it("throttles every booking from one IP past its budget, whoever the user is", async () => {
    const app = createApp({ rateLimits: { ipPerMinute: 2 } });

    await bookAs(app, rohan.id, { quantity: 0 });
    await bookAs(app, aiko.id, { quantity: 0 });
    const third = await bookAs(app, aiko.id, { quantity: 0 });
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
  });

  it("rejects before identity: unknown users are throttled with 429, not looked up and refused with 401", async () => {
    const app = createApp({ rateLimits: { ipPerMinute: 2 } });

    expect((await bookAs(app, randomUUID())).status).toBe(401);
    expect((await bookAs(app, randomUUID())).status).toBe(401);
    expect((await bookAs(app, randomUUID())).status).toBe(429);
  });

  it("keeps a separate IP budget per route, so a booking flood on venue Wi-Fi can't block the gate", async () => {
    const app = createApp({ rateLimits: { ipPerMinute: 2 } });

    for (let i = 0; i < 3; i++) await bookAs(app, rohan.id, { quantity: 0 });
    expect((await bookAs(app, rohan.id, { quantity: 0 })).status).toBe(429);
    expect((await checkIn(app)).status).toBe(400);
  });

  it("names each budget in the RateLimit headers, so stacked limits are distinguishable", async () => {
    const app = createApp({ rateLimits: { ipPerMinute: 50, bookingsPerUserPerMinute: 50 } });

    const res = await bookAs(app, rohan.id, { quantity: 0 });
    const policy = String(res.headers["ratelimit-policy"]);
    expect(policy).toContain('"ip-bookings"');
    expect(policy).toContain('"bookings"');
  });
});
