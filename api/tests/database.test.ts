import { seedDemoData } from "../prisma/seed";
import { SEED_EVENTS } from "../prisma/seedData";
import { prisma } from "../src/db/prisma";

afterAll(() => prisma.$disconnect());

describe("database guarantees", () => {
  it("rejects ticketsLeft below zero at the database level (CHECK constraint)", async () => {
    await seedDemoData(prisma);
    await expect(
      prisma.$executeRaw`UPDATE Event SET ticketsLeft = ticketsLeft - 3 WHERE id = ${SEED_EVENTS.delhiDay2.id}`,
    ).rejects.toThrow();
    const event = await prisma.event.findUniqueOrThrow({ where: { id: SEED_EVENTS.delhiDay2.id } });
    expect(event.ticketsLeft).toBe(2);
  });

  it("seed is idempotent and resets demo state", async () => {
    await seedDemoData(prisma);
    await prisma.event.update({ where: { id: SEED_EVENTS.cosplay.id }, data: { ticketsLeft: 1 } });
    await seedDemoData(prisma);
    await seedDemoData(prisma);

    expect(await prisma.user.count()).toBe(3);
    expect(await prisma.event.count()).toBe(6);
    expect(await prisma.ticket.count()).toBe(3);
    const cosplay = await prisma.event.findUniqueOrThrow({ where: { id: SEED_EVENTS.cosplay.id } });
    expect(cosplay.ticketsLeft).toBe(18);
  });
});
