import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import * as healthService from "../src/services/healthService";

const app = createApp();

afterEach(() => jest.restoreAllMocks());
afterAll(() => prisma.$disconnect());

describe("GET /health", () => {
  it("returns 200 with db up against the real test database", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "up" });
  });

  it("returns 503 with db down when the database check fails", async () => {
    jest.spyOn(healthService, "isDatabaseUp").mockResolvedValue(false);
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", db: "down" });
  });

  it("sets a request id header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("unknown routes and bad bodies", () => {
  it("returns the standard error body on 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: "Route not found", details: {} } });
  });

  it("rejects bodies over 10kb with 413", async () => {
    const res = await request(app)
      .post("/health")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ pad: "x".repeat(11 * 1024) }));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects malformed JSON with 400 and no stack trace", async () => {
    const res = await request(app).post("/health").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.(js|ts):\d+/);
  });
});
