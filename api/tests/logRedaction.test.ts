import { Writable } from "node:stream";
import request from "supertest";
import { SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import { createLogger } from "../src/logging/logger";

afterAll(() => prisma.$disconnect());

// Gauntlet F-2: credentials in request headers must never reach the logs.
describe("request log redaction", () => {
  it("redacts Authorization and X-User-Id but keeps the rest of the request line", async () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _encoding, done) {
        lines.push(chunk.toString());
        done();
      },
    });
    const logger = createLogger(sink);
    logger.level = "info"; // setupEnv silences logs; this test needs them
    const app = createApp({ logger });

    await request(app)
      .get("/me")
      .set("Authorization", "Bearer super-secret-value-123456")
      .set("X-User-Id", SEED_USERS.aiko.id);

    const output = lines.join("");
    expect(output).toContain('"url":"/me"');
    expect(output).not.toContain("super-secret-value-123456");
    expect(output).not.toContain(SEED_USERS.aiko.id);
    expect(output).toContain("[redacted]");
  });
});

// Gauntlet F-3: outside Vercel, a client-supplied X-Forwarded-For must not choose the rate-limit bucket.
describe("rate limit keying", () => {
  it("ignores a spoofed X-Forwarded-For when not behind Vercel", async () => {
    const app = createApp({ writesPerMinute: 2 });
    const book = (forwardedFor?: string) => {
      const req = request(app)
        .post("/events/717f39ba-ce42-4e30-97a6-102b009f380b/book")
        .set("X-User-Id", SEED_USERS.rohan.id)
        .send({ quantity: 0 }); // invalid on purpose: the limiter runs first, nothing is booked
      return forwardedFor ? req.set("X-Forwarded-For", forwardedFor) : req;
    };

    await book();
    await book();
    expect((await book("11.11.11.11")).status).toBe(429);
    expect((await book("22.22.22.22")).status).toBe(429);
  });
});
