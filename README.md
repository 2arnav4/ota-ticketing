# Ōta Tickets

Mini ticketing for Ōta events: book a ticket, show it as a QR code, check it in at the gate.
Express + MySQL API, Expo (React Native) app for iOS, Android and web.

| | |
|---|---|
| Live web app | **https://ota-ticketing.vercel.app** (phone or desktop browser) |
| Live API | **https://ota-ticketing-api.vercel.app** (`/health` shows DB status) |
| Stack | Node 24, Express 5, Prisma 7, MySQL 8 · Expo SDK 58, Expo Router, React Query, i18next |

## Try it in 2 minutes (reviewers)

There is no login (the brief excludes it). Pick a demo user from the chips at the top of the app; the app sends
that user's ID as the `X-User-Id` header.

| User | Role | Starts with |
|---|---|---|
| Aiko Sharma | Fan | 2 Day 1 tickets, 1 used ticket from a past event |
| Rohan Mehta | Fan | No tickets |
| Gate Staff | Staff | The only user who can check tickets in (Scan tab) |

1. **Book:** as Rohan, open **Ōta TOKYO Delhi: Day 2** ("Only 2 left"), set 2, tap **Book now**. You land on
   My Tickets with two QR codes. Back on Events, Day 2 now says **Sold out**. Try booking 3 on another event with
   fewer left, or book Day 2 again: you get "Only N left" / "Just sold out".
2. **Check in:** switch to **Gate Staff**, open **Scan**. Scan a QR from another device (or type a code like
   `7K3M-9QX2-RB4D`, one of Aiko's). First time: green **Checked in** with the holder's name. Second time: amber
   **Already checked in** with the original time.
3. **See it as the fan:** switch back to Rohan (or Aiko): the ticket now shows **Checked in · HH:MM** and its QR fades.
4. **日本語:** tap the language pill. All UI text and dates switch; event names stay as listed.

The live demo data **resets every day** (Vercel Cron, around 06:00 IST), so "Day 2: 2 left" comes back.

## Run it locally

Needs Node 24 and Docker.

```bash
git clone https://github.com/2arnav4/ota-ticketing && cd ota-ticketing
docker compose up -d --wait                      # MySQL 8.4 on :3306 (databases: ota, ota_test)

cd api
cp .env.example .env                             # local values already point at the Docker MySQL
npm install
npx prisma migrate deploy                        # creates tables + the ticketsLeft >= 0 CHECK
npm run db:seed                                  # 3 users, 6 events, 3 tickets (re-run any time to reset)
npm run dev                                      # API on http://localhost:4000
npm test                                         # Jest against ota_test (real MySQL, no mocks)

cd ../app                                        # second terminal
npm install
npx expo start                                   # press w for web, or scan the QR with Expo Go (SDK 58)
```

On a phone (Expo Go), the app reaches the API through the Mac's LAN IP automatically (same Wi-Fi needed).
On iOS, Expo Go must be signed in to the same Expo account as `npx expo login` on the Mac.

## API

All routes except `/health` need `X-User-Id: <seeded user UUID>`. Errors always look like
`{ "error": { "code": "SOLD_OUT", "message": "...", "details": {} } }`.

| Route | Does | Main statuses |
|---|---|---|
| `GET /health` | DB reachability | 200, 503 |
| `GET /events` | Upcoming events: venue, date, price (paise), tickets left | 200, 400, 401 |
| `POST /events/:id/book` `{ "quantity": 1-4 }` | Books tickets, never oversells | 201, 400, 404, 409, 429 |
| `GET /me` | Current demo user and role | 200 |
| `GET /me/tickets` | My tickets with event details and check-in status | 200 |
| `POST /checkins` `{ "code": "..." }` | Staff only. Checks a ticket in once | 200, 403, 404, 409 (+ original time), 429 |

```bash
AIKO=0a8f8a3c-cb83-4ecf-8358-588b03249b38
ROHAN=4a12eeb9-cc9f-404c-9493-957d3bd4cffb
STAFF=cfc750b1-5c92-4710-8600-71d30c438c43
DAY2=717f39ba-ce42-4e30-97a6-102b009f380b
API=http://localhost:4000

curl -s $API/events -H "X-User-Id: $ROHAN"
curl -s -X POST $API/events/$DAY2/book -H "X-User-Id: $ROHAN" -H "Content-Type: application/json" -d '{"quantity":3}'
#   409 {"error":{"code":"NOT_ENOUGH_LEFT","message":"Only 2 left","details":{"ticketsLeft":2,"requested":3}}}
curl -s -X POST $API/events/$DAY2/book -H "X-User-Id: $ROHAN" -H "Content-Type: application/json" -d '{"quantity":2}'
curl -s $API/me/tickets -H "X-User-Id: $AIKO"
curl -s -X POST $API/checkins -H "X-User-Id: $STAFF" -H "Content-Type: application/json" -d '{"code":"7K3M-9QX2-RB4D"}'
curl -s -X POST $API/checkins -H "X-User-Id: $STAFF" -H "Content-Type: application/json" -d '{"code":"7K3M-9QX2-RB4D"}'
#   409 {"error":{"code":"ALREADY_CHECKED_IN",...,"details":{"checkedInAt":"..."}}}
curl -s -X POST $API/checkins -H "X-User-Id: $AIKO" -H "Content-Type: application/json" -d '{"code":"P8W2-H6TJ-5NC1"}'
#   403 FORBIDDEN (fans can't check in)
```

## How overselling is prevented

**In short:** booking is one conditional `UPDATE … SET ticketsLeft = ticketsLeft - qty WHERE ticketsLeft >= qty`
inside a transaction, so MySQL's row lock makes concurrent bookings queue and re-check the real stock; if no row
changed, the booking is refused with 409. A `CHECK (ticketsLeft >= 0)` constraint backstops it. Check-in uses the
same pattern (`WHERE checkedInAt IS NULL`), so a ticket can only be checked in once.

In detail, check and decrement are **one statement**, inside a transaction:

```sql
UPDATE Event SET ticketsLeft = ticketsLeft - :qty
WHERE id = :id AND ticketsLeft >= :qty AND startsAt > NOW();
```

InnoDB locks the event row while this runs. A concurrent booking waits, then re-evaluates the `WHERE` against
the committed value, so there is no read-then-write gap to race through, on any number of API instances.
If 0 rows changed, the API looks up why and answers 404 / 409 `SOLD_OUT` / `NOT_ENOUGH_LEFT` / `EVENT_STARTED`.
Otherwise it inserts the tickets in the same transaction. A `CHECK (ticketsLeft >= 0)` constraint backstops it
at the database level. "Node is single-threaded" would not be a fix: every `await` yields, and serverless runs
many instances.

Check-in uses the same idea: `UPDATE Ticket SET checkedInAt = NOW() WHERE code = ? AND checkedInAt IS NULL`.
Exactly one of several simultaneous scans changes a row; the rest get 409 with the first scan's time.

Proven by tests (`api/tests/booking.test.ts`, `checkins.test.ts`, and the Gauntlet below): 10 parallel bookings
on a 2-left event → exactly 2 succeed; 5 parallel scans of one code → exactly 1 succeeds.

## Design notes

- **Money** is integer paise (₹349 = `34900`), formatted only at the edge with `Intl.NumberFormat('en-IN')`.
- **Times** are stored in UTC and shown in IST (`Asia/Kolkata`) in both languages.
- **Ticket codes** are 12 Crockford base32 characters from the CSPRNG (60 bits): unguessable, and no I/L/O/U, so
  they can be typed at the gate. The QR holds only the code. All primary keys are UUIDs.
- **Layers:** routes → controllers (parse, call, respond) → services (rules, no `req`/`res`) → Prisma.
  Input is validated with zod only at the boundary; bodies are strict (unknown fields → 400).
- **Event data:** the two "Ōta TOKYO Delhi" events use the real listing's dates, venue and ₹349 price. All
  other events are invented demo data.

## Known gaps (deliberate, given the brief)

- `X-User-Id` is **not authentication**: anyone can send any seeded user's ID, including staff's. Real auth
  (sessions or JWT) would replace the header; the role check on `/checkins` is already server-side.
- The write rate limit (30/min per IP) is in memory, so on Vercel it is per function instance. A global limit
  belongs in Vercel Firewall or a shared store.
- The free Aiven database can be powered off when idle; the first request after that may fail until it's back.

## Deploy (owner notes)

Live setup: API on Vercel (Express, region `sin1` Singapore), web app on Vercel (static Expo web export), MySQL 8.4
on Aiven's free tier (also Singapore, so each query is a short hop).

**Every push to `main` deploys both projects automatically** (Vercel's GitHub integration; project root folders
`api/` and `app/`). Other branches don't deploy: `git.deploymentEnabled` in each `vercel.json` allows `main` only.
Database migrations are never part of a deploy; run step 2 by hand first when a change adds one.

1. **Database (Aiven, free MySQL):** create the service; copy its Service URI and download its CA certificate
   (`ca.pem`) from the service's Overview page.
2. **Migrate from a Linux container.** Aiven's server certificate has no `serverAuth` extended key usage, which
   macOS's TLS verifier requires, so `prisma migrate deploy` on a Mac fails with P1011 even though the chain is
   valid. Inside Docker, OpenSSL verifies it normally (TLS stays verified; never use `sslaccept=accept_invalid_certs`):
   ```bash
   cd api
   docker run --rm -v "$PWD/prisma:/src/prisma:ro" -v "$PWD/prisma.config.ts:/src/prisma.config.ts:ro" \
     -v /absolute/path/ca.pem:/ca.pem:ro \
     -e DATABASE_URL='mysql://USER:PASS@HOST:PORT/defaultdb?sslaccept=strict&sslcert=/ca.pem' \
     node:24-bookworm-slim sh -c 'mkdir /work && cp -r /src/prisma /src/prisma.config.ts /work/ && cd /work && \
       npm init -y >/dev/null && npm i --silent prisma@7.10.1 dotenv@18.0.9 && npx prisma migrate deploy'
   ```
3. **Seed** (Node verifies the certificate fine on macOS):
   `DATABASE_URL='mysql://USER:PASS@HOST:PORT/defaultdb' DATABASE_SSL=true DATABASE_CA_CERT="$(cat ca.pem)" npm run db:seed`
4. **API on Vercel** (project root `api/`, deploys on push to `main`). `api/vercel.json` sets the Express framework,
   the `sin1` region and the daily reset cron. Env: `DATABASE_URL` (no query string), `DATABASE_SSL=true`,
   `DATABASE_CA_CERT` (the PEM), `CORS_ORIGINS` (the web app URL), `CRON_SECRET` (random, 16+ chars),
   `LOG_LEVEL=info`, `RATE_LIMIT_PER_MINUTE=30`.
5. **Web app on Vercel** (project root `app/`, deploys on push to `main`), env `EXPO_PUBLIC_API_URL` = the API URL.
6. Check `https://<api>/health` returns `{"status":"ok","db":"up"}`.

## Tests

```bash
cd api && npm test        # 86 Jest tests, real MySQL test DB
cd app && npm test && npm run typecheck && npm run lint
cd api && npm run race    # 20 simultaneous bookings on the 2-left event: exactly 2 must win (local only)
cd api && npm run dev:logs   # API with readable logs: one line per booking, check-in and rejection
```

- `TEST_PLAN.md`: a 15-point feature checklist (live site or local) and a one-minute race-condition test.
- `GAUNTLET.md`: concurrency, load and security test results.
