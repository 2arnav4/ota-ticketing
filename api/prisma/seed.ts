import { prisma as defaultClient } from "../src/db/prisma";
import type { PrismaClient } from "../src/generated/prisma/client";
import { SEED_EVENTS, SEED_TICKETS, SEED_USERS } from "./seedData";

/**
 * Resets the demo to its known state. Safe to run any number of times.
 * Destructive by design: deletes every ticket the seed didn't create (bookings made while testing)
 * and restores each event's ticketsLeft. Never run against prod without the owner's OK.
 */
export async function seedDemoData(prisma: PrismaClient): Promise<void> {
  const seedTicketIds = SEED_TICKETS.map((ticket) => ticket.id);

  await prisma.$transaction(async (tx) => {
    // Delete first: a ticket references its event, and stale bookings would contradict the restored stock.
    await tx.ticket.deleteMany({ where: { id: { notIn: seedTicketIds } } });

    for (const user of Object.values(SEED_USERS)) {
      await tx.user.upsert({
        where: { id: user.id },
        create: user,
        update: { name: user.name, role: user.role },
      });
    }

    for (const event of Object.values(SEED_EVENTS)) {
      const { id, ...fields } = event;
      await tx.event.upsert({ where: { id }, create: event, update: fields });
    }

    for (const ticket of SEED_TICKETS) {
      const { id, ...fields } = ticket;
      await tx.ticket.upsert({ where: { id }, create: ticket, update: fields });
    }
  }, // ~25 round trips; from a laptop to a distant hosted DB that outlasts Prisma's 5 s default.
  { maxWait: 10_000, timeout: 60_000 });
}

// CLI entry (`npm run db:seed`, `prisma db seed`). Tests import seedDemoData without running this block.
if (require.main === module) {
  seedDemoData(defaultClient)
    .then(() => console.log("Seed complete: 3 users, 6 events, 3 tickets."))
    .finally(() => defaultClient.$disconnect());
}
