import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";

const app = createApp();

afterAll(() => prisma.$disconnect());

describe("CORS", () => {
  it("answers a preflight from an allowed origin and allows X-User-Id", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "http://localhost:8081")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,x-user-id");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:8081");
    expect(res.headers["access-control-allow-headers"]).toMatch(/X-User-Id/i);
  });

  it("gives no allow-origin header to an unknown origin", async () => {
    const res = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("lets requests with no Origin through (native app, curl)", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
