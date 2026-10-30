# Test plan

Two short checks: a feature checklist and a race-condition test. Run them on the **live site** (no setup) or
**locally** (needed for the race test and the outage check).

| Where | Open | Notes |
|---|---|---|
| Live, any browser (phone or desktop) | https://ota-ticketing.vercel.app | Shared data; resets daily around 06:00 IST. If Day 2 is already sold out, someone booked it today: use Cosplay or Calligraphy instead |
| Local, browser | `http://localhost:8081` | Start: `docker compose up -d`, then `cd api && npm run dev:logs`, then `cd app && npx expo start` |
| Local, iPhone (Expo Go) | Scan the QR from `npx expo start` | Same Wi-Fi; Expo Go signed in to the same Expo account as the Mac |

Reset local data any time: `cd api && npm run db:seed`.

## 1. Feature checklist (about 5 minutes)

- [ ] **Events:** 5 events, soonest first, each with date (IST), venue, price, stock badge. Day 2 shows **Only 2 left**, Anime Fans Meetup shows **Sold out**.
- [ ] **Book:** as **Rohan**, pick 2 on Day 1 → **Book now** → My Tickets opens with "Booked 2 tickets".
- [ ] **Limits:** the stepper stays between 1 and 4, and on Day 2 it can't go above what's left.
- [ ] **Stock drops:** back on Events, Day 1's count went down by 2.
- [ ] **QR tickets:** each ticket shows a QR, the code as `XXXX-XXXX-XXXX`, and a grey **Not used** badge.
- [ ] **Sold out:** book Day 2 until it's gone; trying again shows **Sold out** and "Just sold out."
- [ ] **Staff only:** Aiko and Rohan have no **Scan** tab; **Gate Staff** does.
- [ ] **Check in:** as Gate Staff, scan one of Rohan's QR codes (from another screen) or type its code → green **Checked in** with the holder's name. On the live site the camera works in the phone browser; locally in a browser, type the code.
- [ ] **Only once:** the same code again → amber **Already checked in** with the first time.
- [ ] **Badge:** as Rohan, My Tickets shows **Checked in · HH:MM** and a faded QR, without pulling to refresh.
- [ ] **Bad codes:** `0000-0000-0000` → "Unknown ticket"; `hello` → "Not a ticket code".
- [ ] **日本語:** labels and dates switch to Japanese, survive a reload, and EN switches back.
- [ ] **Friendly errors** (local): stop the API (Ctrl-C) and pull to refresh → "Can't connect right now…" with **Retry**, and no URL or technical text. Start it again, tap Retry → events return.
- [ ] **Two devices, one user:** pick Rohan on the phone and the computer, book on one → after switching tabs, the other device shows the same ticket.
- [ ] **Layout:** on a wide desktop window the content is a centred column; on a phone it fills the screen.

## 2. Race-condition test (local, about 1 minute)

Rule: when more people book at the same moment than there are tickets, only that many succeed.

1. Terminal A: `cd api && RATE_LIMIT_PER_MINUTE=200 npm run dev:logs`
2. Terminal B: `cd api && npm run db:seed && npm run race` (20 bookings for Day 2, 2 tickets left, all at once)
3. **Pass if** Terminal B ends with
   ```
   Booked: 2 (expected 2) · Refused 409: 18 · Other: 0
   Stock: 2 → 0 (sold 2, never below 0)
   PASS: no overselling.
   ```
   and Terminal A shows exactly 2 `booking created` and 18 `request rejected  code: "SOLD_OUT"` lines.
4. Two-device version: reset, book 1 on Day 2 (1 left), then press **Book now** on the phone and the computer at
   the same moment → one gets the ticket, the other sees "Just sold out." Works the same on the live site.

`npm run race` refuses non-local targets on purpose; don't load-test the live site.
Automated versions: `cd api && npm test` (86 tests), `cd app && npm test` (11 tests).
