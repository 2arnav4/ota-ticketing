-- Backstop for the booking rule. The conditional UPDATE in the booking service is the real oversell guard;
-- this makes the database itself reject any write (bug, manual query, future code path) that would go below zero.
-- Hand-written because Prisma's schema language can't express CHECK constraints.
ALTER TABLE `Event` ADD CONSTRAINT `Event_ticketsLeft_nonnegative` CHECK (`ticketsLeft` >= 0);
