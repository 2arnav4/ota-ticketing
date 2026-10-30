# Test plan

Two short checks. Reset the demo data before each run: `cd api && npm run db:seed`.

## 1. Feature checklist (about 5 minutes)

Open the app (Expo Go on the phone, or `http://localhost:8081` in a browser). Tick each line.

- [ ] **Events list:** 5 events, soonest first, each with date (IST), venue, price, stock badge. "Day 2" shows **Only 2 left**, "Anime Fans Meetup" shows **Sold out**.
- [ ] **Book:** as **Rohan**, on Day 1 pick 2 → **Book now** → you land on My Tickets with "Booked 2 tickets".
- [ ] **Limits:** the stepper never goes below 1 or above 4, and on Day 2 not above 2.
- [ ] **Stock drops:** back on Events, Day 1 went from 4,120 to 4,118.
- [ ] **QR tickets:** each ticket shows a QR code, the code as `XXXX-XXXX-XXXX` and a grey **Not used** badge.
- [ ] **Not enough left:** on Day 2 pick 2 and book, then try to book Day 2 again → **"Just sold out."** (or "Only 1 left…" if one was taken).
- [ ] **Staff only:** Aiko and Rohan have no **Scan** tab; **Gate Staff** does.
- [ ] **Check in:** as Gate Staff, scan one of Rohan's QR codes (or type its code) → green **Checked in** with the holder's name.
- [ ] **Only once:** scan the same code again → amber **Already checked in** with the first time.
- [ ] **Badge:** back as Rohan, My Tickets shows **Checked in · HH:MM** on that ticket and its QR is faded.
- [ ] **Bad codes:** typing `0000-0000-0000` → "Unknown ticket"; typing `hello` → "Not a ticket code".
- [ ] **日本語:** tap 日本語 → all labels and dates switch to Japanese; reload the app → still Japanese; tap EN to go back.
- [ ] **Friendly errors:** stop the API (Ctrl-C) and pull to refresh → "Can't connect right now…" with **Retry**, and no URL or technical text. Start the API, tap Retry → events come back.
- [ ] **Desktop:** in a wide browser window the content is a centred column, not stretched.

## 2. Race-condition test (about 1 minute)

The rule: when more people book at the same moment than there are tickets, only as many as there are tickets
succeed.

1. Terminal A, API with readable logs:
   `cd api && RATE_LIMIT_PER_MINUTE=200 npm run dev:logs`
2. Terminal B: `cd api && npm run db:seed && npm run race`
   This sends 20 bookings for Day 2 (2 tickets left) at the same instant.
3. **Pass if** Terminal B ends with:
   ```
   Booked: 2 (expected 2) · Refused 409: 18 · Other: 0
   Stock: 2 → 0 (sold 2, never below 0)
   PASS: no overselling.
   ```
   and Terminal A shows exactly **2** `booking created` lines and **18** `request rejected  code: "SOLD_OUT"` lines.
4. On the phone, switch to another tab and back to Events → Day 2 shows **Sold out**.

Optional, two devices: reset, book 1 on Day 2 (1 left), then press **Book now** on the phone and on the
computer at the same moment → one gets the ticket, the other sees "Just sold out." The two devices can be the
same user: the server identifies the user, not the device, and still sells only one.

Automated versions of both: `cd api && npm test` (86 tests, including 50 parallel bookings on 2 tickets) and
`cd app && npm test`.
