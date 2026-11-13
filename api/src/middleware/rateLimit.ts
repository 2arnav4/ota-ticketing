import type { Request, RequestHandler, Response } from "express";
import { ipKeyGenerator, MemoryStore, rateLimit } from "express-rate-limit";
import { AppError } from "../domain/errors";
import { currentUser } from "./userContext";

// All limiters are in memory, so on Vercel each one is per function instance, not global: they slow an abusive
// client, they are not a hard quota. A global limit belongs in Vercel Firewall or a shared store (README).
// Each call creates its own store, so every limiter returned below is a separate budget.
type LimitOptions = {
  perMinute: number;
  // Names the budget in the RateLimit / RateLimit-Policy response headers, so stacked limiters stay distinguishable.
  name: string;
  keyGenerator?: (req: Request) => string;
  store?: MemoryStore;
};

// Every request counts when it arrives. Deliberately NOT using the library's skipFailedRequests: it also refunds a
// request whose connection closes before the reply, even though the server kept working and may have committed.
// Closing sockets mid-request then let a client book past its limit (review 3). Refunds are done by refundWhen below.
function perMinuteLimit({ perMinute, name, keyGenerator, store }: LimitOptions): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: perMinute,
    identifier: name,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...(keyGenerator && { keyGenerator }),
    ...(store && { store }),
    handler: () => {
      throw new AppError(429, "RATE_LIMITED", "Too many requests, slow down");
    },
  });
}

// Wraps a limiter so a request can be refunded, but only after its response actually finished being sent ("finish").
// An aborted connection never fires "finish", so it stays counted. A 429 never reaches the refund either: the
// limiter's handler throws, so `next` gets an error and no listener is attached.
function refundWhen(
  limiter: RequestHandler,
  store: MemoryStore,
  key: (req: Request) => string,
  refund: (res: Response) => boolean,
): RequestHandler {
  return (req, res, next) => {
    void limiter(req, res, (err?: unknown) => {
      if (err) return next(err);
      const counted = key(req);
      res.on("finish", () => {
        if (refund(res)) void store.decrement(counted);
      });
      next();
    });
  };
}

// Per user AND per IP. Must be mounted after userContext.
// Why the IP is in the key: X-User-Id is unauthenticated (demo identity), so anyone can send anyone's id. Keyed by
// user alone, an attacker on any network could burn the gate scanner's budget and lock the gate out. With the IP in
// the key they only burn their own (attacker IP + staff id) bucket. Once real auth exists, the user id alone is enough.
// Why after userContext: keying on the raw header would let a client send a fresh random id per request and get a
// fresh bucket each time. After userContext only real users have buckets, so the store can't grow without bound.
const userOnThisIp = (req: Request) => `${currentUser(req).id}|${ipKeyGenerator(req.ip ?? "")}`;

// Layer 1, per IP, mounted before userContext: a cheap flood guard so junk never costs more than a PK lookup.
// Loose on purpose: a whole venue's Wi-Fi (fans and gate scanners) can reach us as one public IP.
// Create one per route: then a flood of bookings from the venue Wi-Fi can't use up the gate's check-in budget.
// Someone flooding /checkins itself from the gate's own network still can; only real auth or a separate gate
// network fixes that, because an IP-keyed limit can't tell neighbours apart.
export function ipWriteLimit(perMinute: number, name: string): RequestHandler {
  return perMinuteLimit({ perMinute, name });
}

// Layer 2 for bookings. Refunded once the response has finished (they don't use up the budget):
// - 400 bad input: no DB work was done, and junk sent under a fan's id can't burn their budget.
// - Idempotent replays: the booking already exists, so a queued offline resend shouldn't use up the budget.
// Everything else counts, 409 sold out included: each one runs a transaction that row-locks the event, so a
// client hammering a sold-out hot event is exactly what this brake is for.
const isFreeBookingResponse = (res: Response) =>
  res.statusCode === 400 || res.getHeader("Idempotent-Replayed") === "true";

export function bookingLimit(perMinute: number): RequestHandler {
  const store = new MemoryStore();
  const limiter = perMinuteLimit({ perMinute, name: "bookings", keyGenerator: userOnThisIp, store });
  return refundWhen(limiter, store, userOnThisIp, isFreeBookingResponse);
}

// Layer 2 for check-ins. Failures DO count: a 404 is what guessing ticket codes looks like, so refunding them would
// remove the brake on code guessing. Note: gates sharing one staff account on one IP share this budget.
export function checkinLimit(perMinute: number): RequestHandler {
  return perMinuteLimit({ perMinute, name: "checkins", keyGenerator: userOnThisIp });
}
