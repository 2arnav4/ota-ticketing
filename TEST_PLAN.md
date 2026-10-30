# Test plan

A manual walkthrough of every feature, on a phone (Expo Go), a desktop browser and a phone browser, plus the
two business rules under real concurrency. Each case has an ID, steps and the exact expected result. Mark each
row ✅ / ❌ as you go; for ❌, note what you saw.

Automated coverage runs separately: `cd api && npm test` (86 tests), `cd app && npm test` (7 tests).
Concurrency and load results: `GAUNTLET.md`.

## 0. Setup (once per session)

| Terminal | Command | Leave it running? |
|---|---|---|
| T1: database | `cd ota-ticketing && docker compose up -d --wait` | Runs in Docker |
| T2: API with readable logs | `cd ota-ticketing/api && CORS_ORIGINS=http://localhost:8081,http://<MAC-IP>:8081 RATE_LIMIT_PER_MINUTE=200 npm run dev:logs` | **Yes, this is the log window** |
| T3: app (Metro) | `cd ota-ticketing/app && npx expo start` | Yes (shows the QR) |
| T4: free terminal | for `npm run db:seed`, `npm run race`, curl | |

- `<MAC-IP>` = the address Metro prints as `exp://<MAC-IP>:8081` (e.g. `192.168.1.9`).
- `RATE_LIMIT_PER_MINUTE=200` stops the race tests from tripping the 30-per-minute write limit. Case R-7 tests
  the limit on its own.
- **Reset the demo at any time:** T4 `cd ota-ticketing/api && npm run db:seed` (Day 2 back to 2 left, test
  bookings removed, Aiko's tickets restored).

**Devices**

| Device | How to open | Notes |
|---|---|---|
| iPhone (Expo Go) | Same Wi-Fi; Expo Go signed in to the same account as `npx expo login`; scan T3's QR | Native app; camera scanning works |
| Desktop browser | `http://localhost:8081` (or press `w` in T3) | Content is a centred column on wide screens |
| Phone browser (Safari) | `http://<MAC-IP>:8081` | No camera over plain http (browsers require HTTPS); use code entry. On the live HTTPS site the camera works |

**Seeded data:** users Aiko (fan, 3 tickets), Rohan (fan, none), Gate Staff (staff). Events in order: Delhi Day 1
(4,120 left), Day 2 (**2 left**), Anime Fans Meetup (sold out), Cosplay Workshop (18 left), Calligraphy (30 left).
A past event (Pune) is hidden. Aiko's codes: `7K3M-9QX2-RB4D`, `P8W2-H6TJ-5NC1` (unused), `Z4R7-E2KM-9VB3` (used).

## 1. Events screen

| ID | Steps | Expected |
|---|---|---|
| E-1 | Open the app | Skeleton cards briefly, then 5 events soonest first. The past Pune event is not listed |
| E-2 | Read each card | Name, venue + city, date and time in IST, price (₹349, ₹349, ₹1,062, ₹799, ₹599), stock badge |
| E-3 | Stock badges | Day 1 green "4,120 left"; Day 2 amber "Only 2 left"; Meetup red "Sold out"; Cosplay amber "Only 18 left"; Calligraphy green "30 left" |
| E-4 | Sold-out card | No stepper; the button is greyed "Sold out" and can't be tapped |
| E-5 | Stepper on Day 1 | Starts at 1; − disabled at 1; + stops at 4; the total updates (₹349 → ₹1,396) |
| E-6 | Stepper on Day 2 | + stops at **2** (can't pick more than are left) |
| E-7 | Pull down on the list | Refresh spinner, list reloads |

## 2. Booking (rule 1: no overselling)

| ID | Steps | Expected | Log window (T2) |
|---|---|---|---|
| B-1 | As Rohan, Day 1, quantity 2, Book now | Button shows a spinner, then you land on My Tickets with "Booked 2 tickets"; Day 1 now "4,118 left" | `booking created … buyer: "Rohan Mehta"` then `POST /events/…/book → 201` |
| B-2 | As Rohan, Day 2, quantity 2, Book now | 2 tickets; Day 2 becomes red "Sold out" | `→ 201` |
| B-3 | Reset (`npm run db:seed`). Rohan books 1 on Day 2. Then on **another device** (still showing "Only 2 left"), pick 2 and Book now | Inline red "Only 1 left. Lower the quantity and try again."; the card refreshes to "Only 1 left" and the stepper drops to 1 | `request rejected code: "NOT_ENOUGH_LEFT"`, `→ 409` |
| B-4 | Double-tap Book now quickly | Exactly one booking (the button disables while the request runs) | One `→ 201` |
| B-5 | Book on a sold-out event via curl (T4): see section 8 | 409 `SOLD_OUT` | `→ 409` |

## 3. My Tickets

| ID | Steps | Expected |
|---|---|---|
| T-1 | As Aiko, open My Tickets | 3 cards: Pune (past) first with a green "Checked in · 12:42" badge and a faded QR, then 2 × Day 1 "Not used" with sharp QRs |
| T-2 | Read a card | Event name, IST date, venue; QR ~220 px on white; code as `XXXX-XXXX-XXXX` in monospace; "Used on …" under used tickets |
| T-3 | As Rohan (no bookings) | "No tickets yet" card with a "Browse events" button that opens Events |
| T-4 | Switch user chips | Each user sees only their own tickets, never another user's |

## 4. Check-in and scanner (rule 2: once only)

| ID | Steps | Expected | Log window (T2) |
|---|---|---|---|
| C-1 | As Aiko or Rohan | No Scan tab. (Opening `/scan` in a browser says it's for gate staff) | |
| C-2 | Switch to Gate Staff | A third tab, **Scan**, appears | |
| C-3 | Scan tab, first time on the phone | "Allow camera" → iOS camera prompt → live camera in a rounded frame | |
| C-4 | Show Aiko's My Tickets on the desktop browser; scan an unused QR with the phone | Green "Checked in", Aiko Sharma, event name, code | `ticket checked in … holder: "Aiko Sharma"`, `POST /checkins → 200` |
| C-5 | "Scan next", scan the same QR again | Amber "Already checked in", "First scanned <date> · <time> IST", "Do not admit again." | `request rejected code: "ALREADY_CHECKED_IN" details.checkedInAt`, `→ 409` |
| C-6 | Hold the camera on one QR without tapping anything | Only **one** request is sent (one log line), not a stream | One `POST /checkins` |
| C-7 | Type `p8w2 h6tj 5nc1` (lowercase, spaces) and tap Check in | Accepted as `P8W2-H6TJ-5NC1` | `→ 200` |
| C-8 | Type `0000-0000-0000` | Red "Unknown ticket" | `TICKET_NOT_FOUND`, `→ 404` |
| C-9 | Type `hello` | Red "Not a ticket code" | `VALIDATION_FAILED`, `→ 400` |
| C-10 | Scan any QR that isn't a ticket (e.g. a website QR) | Red "Not a ticket code" | `→ 400` |
| C-11 | Back on Aiko's My Tickets (switch tab or app back to foreground) | That ticket now shows "Checked in · HH:MM" and a faded QR, **without** pulling to refresh | `GET /me/tickets → 200` |

## 5. Language (EN / 日本語)

| ID | Steps | Expected |
|---|---|---|
| L-1 | Tap 日本語 | Tabs イベント / マイチケット / スキャン; buttons 予約する; badges 残り2枚 / 完売; dates like 2026年11月28日(土) 11:00 IST; chip months 11月. Event names and venues stay in English |
| L-2 | Book in Japanese, then cause an error (B-3) | Success banner and errors are in Japanese |
| L-3 | Close the app fully (or reload the browser) and reopen | Still Japanese |
| L-4 | Tap EN | Everything back to English |

## 6. Errors and loading

| ID | Steps | Expected |
|---|---|---|
| X-1 | Stop the API (Ctrl-C in T2), pull to refresh on Events | Card "Couldn't load this · Can't reach the server (http://…:4000)" with Retry |
| X-2 | Start the API again, tap Retry | Events load |
| X-3 | Stop the API, try to book | Inline "Can't reach the server…", nothing booked |
| X-4 | Stop MySQL (`docker stop ota-mysql`); `curl localhost:4000/health` | After ≤5 s: `{"status":"degraded","db":"down"}` (503). `docker start ota-mysql` to recover |

## 7. Race-condition tests (watch T2 while each runs)

The rule: **if an event has N tickets left and more than N are requested at the same moment, exactly N are
sold and the rest get 409.** Humans tapping two phones rarely hit the server within the same millisecond, so
R-1 fires truly simultaneous requests from a script, and R-2 to R-4 add real devices on top.

| ID | Steps | Expected |
|---|---|---|
| R-1 | Reset. T4: `npm run race` (20 bookings of 1 at Day 2, alternating Aiko / Rohan, all at once) | Script prints `Booked: 2 (expected 2) · Refused 409: 18`, `Stock: 2 → 0`, **PASS**. T2 shows exactly 2 `booking created` lines and 18 `request rejected code: "SOLD_OUT"` |
| R-2 | Reset. Phone on Events. T4: `npm run race`. Then switch tabs on the phone (or bring the app to the front) | Day 2 shows "Sold out" without pulling. Trying to book Day 2 gives "Just sold out." |
| R-3 | Reset. T4: `npm run race -- --event cosplay --quantity 3 --attempts 20` (60 requested, 18 left) | Exactly 6 bookings of 3 succeed, `Stock: 18 → 0`, PASS |
| R-4 | Reset. Rohan books 1 on Day 2 (1 left). On the phone **and** the desktop browser, both as any user, set 1 and press Book now at the same moment (count down aloud) | One device lands on My Tickets; the other shows "Just sold out." T2: one `→ 201`, one `→ 409 SOLD_OUT`. Never 2 × 201 |
| R-5 | Reset. As Gate Staff on two devices, enter the same unused code and submit together | One green "Checked in", one amber "Already checked in" with the same time |
| R-6 | T4: `npm test -- tests/concurrency.test.ts` | 6 passed (50 parallel bookings on 2 left; 20 parallel scans of one code, etc.) |
| R-7 | Restart T2 **without** `RATE_LIMIT_PER_MINUTE` (default 30/min). Run `npm run race -- --attempts 40` | The later requests get 429 `RATE_LIMITED` (shown as "Other"); the script reports FAIL because some requests were throttled, not oversold. Stock never goes below 0 |

## 8. Same account on two devices

Identity is the `X-User-Id` the app sends (the selected user chip), **not the device**. Two devices with the
same chip selected are the same user; the brief has no login, so there's nothing per-device.

| ID | Steps | Expected |
|---|---|---|
| D-1 | Reset. Select **Rohan** on the phone and on the desktop browser. Book 1 on Day 2 from the desktop | Desktop: My Tickets shows 1 ticket |
| D-2 | On the phone, open My Tickets | The same ticket (same code) appears: same user, shared tickets |
| D-3 | On the phone (still Rohan), book 1 more on Day 2 | Succeeds (it was the last one); Day 2 now Sold out on both devices after a tab switch |
| D-4 | On either device, try Day 2 again | "Just sold out." / Sold out button. **2 sold out of 2: no overselling across devices** |
| D-5 | Desktop My Tickets (Rohan) | Both tickets, one booked on each device |
| D-6 | Select Aiko on the phone, Rohan on the desktop | Each sees only their own tickets; switching the chip switches the whole app |

## 9. API checks with curl (T4)

```bash
AIKO=0a8f8a3c-cb83-4ecf-8358-588b03249b38; ROHAN=4a12eeb9-cc9f-404c-9493-957d3bd4cffb
STAFF=cfc750b1-5c92-4710-8600-71d30c438c43; DAY2=717f39ba-ce42-4e30-97a6-102b009f380b; API=http://localhost:4000
```

| ID | Command | Expected |
|---|---|---|
| A-1 | `curl -s $API/events` | 400 `MISSING_USER_ID` |
| A-2 | `curl -s $API/events -H "X-User-Id: nope"` | 400 `INVALID_USER_ID` |
| A-3 | `curl -s $API/events -H "X-User-Id: 00000000-0000-4000-8000-000000000000"` | 401 `UNKNOWN_USER` |
| A-4 | `curl -s -X POST $API/events/$DAY2/book -H "X-User-Id: $ROHAN" -H "Content-Type: application/json" -d '{"quantity":5}'` | 400 `VALIDATION_FAILED` |
| A-5 | same with `-d '{"quantity":"2"}'`, `'{"quantity":1.5}'`, `'{"quantity":1,"price":0}'` | 400 each (strings, decimals and extra fields refused) |
| A-6 | same with `-d '{"quantity":3}'` | 409 `NOT_ENOUGH_LEFT`, `details.ticketsLeft: 2` |
| A-7 | `curl -s -X POST $API/events/76f2250d-7293-4740-9820-0b8b3d68360d/book -H "X-User-Id: $ROHAN" -H "Content-Type: application/json" -d '{"quantity":1}'` | 409 `EVENT_STARTED` (past event) |
| A-8 | `curl -s -X POST $API/checkins -H "X-User-Id: $AIKO" -H "Content-Type: application/json" -d '{"code":"P8W2H6TJ5NC1"}'` | 403 `FORBIDDEN` (fans can't check in) |
| A-9 | Check in `P8W2H6TJ5NC1` as `$STAFF` twice | 200, then 409 `ALREADY_CHECKED_IN` with the first `checkedInAt` |
| A-10 | `curl -s $API/me/tickets -H "X-User-Id: $AIKO"` | Aiko's tickets with `event` details and `checkedInAt` |

## 10. Desktop and mobile layout

| ID | Steps | Expected |
|---|---|---|
| U-1 | Desktop browser, full width | Header, cards and buttons in a centred column (max 720 px), nothing stretched edge to edge |
| U-2 | Narrow the window to phone width | Cards fill the width; the tab bar stays at the bottom |
| U-3 | iPhone (notch / Dynamic Island) | Header below the status bar; tab bar above the home indicator |
| U-4 | Keyboard on desktop: Tab through the page | User chips, language pill, stepper, Book now and tabs are all reachable |

## 11. Live site (after deploy)

Same cases as above against the deployed URLs (see README). Differences:

- The data is shared by everyone and **resets daily** (~06:00 IST). If Day 2 is already sold out, use Cosplay
  or Calligraphy for booking tests.
- Phone: open the web URL in Safari or Chrome; the camera scanner works there because the site is HTTPS.
- Don't run `npm run race` or the load test against the live site; both refuse non-localhost targets on purpose.
