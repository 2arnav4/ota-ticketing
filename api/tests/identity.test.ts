import { randomUUID } from "node:crypto";
import request from "supertest";
import { seedDemoData } from "../prisma/seed";
import { SEED_USERS } from "../prisma/seedData";
import { createApp } from "../src/createApp";
import { prisma } from "../src/db/prisma";

const app = createApp();

beforeAll(() => seedDemoData(prisma));
afterAll(() => prisma.$disconnect());

describe("X-User-Id identity", () => {
  it.each([
    ["missing", undefined, 400, "MISSING_USER_ID"],
    ["not a UUID", "aiko", 400, "INVALID_USER_ID"],
    ["SQL in the header", "' OR 1=1 --", 400, "INVALID_USER_ID"],
    ["well-formed but unknown", randomUUID(), 401, "UNKNOWN_USER"],
  ])("rejects a %s header", async (_label, header, status, code) => {
    const req = request(app).get("/me");
    const res = await (header === undefined ? req : req.set("X-User-Id", header));
    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });

  it("resolves a fan", async () => {
    const res = await request(app).get("/me").set("X-User-Id", SEED_USERS.aiko.id);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: SEED_USERS.aiko.id, name: "Aiko Sharma", role: "FAN" });
  });

  it("resolves staff", async () => {
    const res = await request(app).get("/me").set("X-User-Id", SEED_USERS.staff.id);
    expect(res.body.user.role).toBe("STAFF");
  });
});
