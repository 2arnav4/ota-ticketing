// Fixed IDs so every run (local, test, prod) produces the same rows and the app's demo user list stays valid.
// The two "Ōta TOKYO Delhi" rows use the real listing's dates, venue and ₹349 price; every other event is invented.

export const SEED_USERS = {
  aiko: { id: "0a8f8a3c-cb83-4ecf-8358-588b03249b38", name: "Aiko Sharma", role: "FAN" },
  rohan: { id: "4a12eeb9-cc9f-404c-9493-957d3bd4cffb", name: "Rohan Mehta", role: "FAN" },
  staff: { id: "cfc750b1-5c92-4710-8600-71d30c438c43", name: "Gate Staff", role: "STAFF" },
} as const;

// Times are written in IST (+05:30) and stored as UTC instants.
export const SEED_EVENTS = {
  delhiDay1: {
    id: "b0772539-e91f-4237-b6d0-28a78d2f1fe4",
    name: "Ōta TOKYO Delhi: Day 1",
    venue: "Yashobhoomi (IICC)",
    city: "New Delhi",
    startsAt: new Date("2026-11-28T11:00:00+05:30"),
    pricePaise: 34900,
    capacity: 5000,
    ticketsLeft: 4120,
  },
  delhiDay2: {
    id: "717f39ba-ce42-4e30-97a6-102b009f380b",
    name: "Ōta TOKYO Delhi: Day 2",
    venue: "Yashobhoomi (IICC)",
    city: "New Delhi",
    startsAt: new Date("2026-11-29T11:00:00+05:30"),
    pricePaise: 34900,
    capacity: 5000,
    ticketsLeft: 2,
  },
  meetup: {
    id: "de30b700-a64d-40e2-951b-850d22ae454c",
    name: "Anime Fans Meetup",
    venue: "JLN Stadium",
    city: "New Delhi",
    startsAt: new Date("2026-12-13T16:00:00+05:30"),
    pricePaise: 106200,
    capacity: 200,
    ticketsLeft: 0,
  },
  cosplay: {
    id: "9df4187b-6157-4412-9b57-885235f8988b",
    name: "Cosplay Craft Workshop",
    venue: "Indiranagar",
    city: "Bengaluru",
    startsAt: new Date("2026-12-20T14:00:00+05:30"),
    pricePaise: 79900,
    capacity: 40,
    ticketsLeft: 18,
  },
  calligraphy: {
    id: "4664c0ed-8b02-4f26-b0fd-661d9b61766a",
    name: "Japanese Calligraphy Session",
    venue: "Bandra",
    city: "Mumbai",
    startsAt: new Date("2027-01-10T11:00:00+05:30"),
    pricePaise: 59900,
    capacity: 30,
    ticketsLeft: 30,
  },
  pastMatsuri: {
    id: "76f2250d-7293-4740-9820-0b8b3d68360d",
    name: "Ōta Summer Matsuri",
    venue: "Phoenix Marketcity",
    city: "Pune",
    startsAt: new Date("2026-08-15T12:00:00+05:30"),
    pricePaise: 29900,
    capacity: 500,
    ticketsLeft: 0,
  },
} as const;

// Codes use the Crockford base32 alphabet (no I, L, O, U), same as generated codes.
export const SEED_TICKETS = [
  {
    id: "0a1a59d0-14f9-4cc6-88e3-e9bc653d3a4d",
    code: "7K3M9QX2RB4D",
    eventId: SEED_EVENTS.delhiDay1.id,
    userId: SEED_USERS.aiko.id,
    checkedInAt: null,
  },
  {
    id: "aba6cae6-b8b5-49cc-95f1-5d03d97624e9",
    code: "P8W2H6TJ5NC1",
    eventId: SEED_EVENTS.delhiDay1.id,
    userId: SEED_USERS.aiko.id,
    checkedInAt: null,
  },
  {
    id: "0f38558e-3296-4c88-a09d-e20c6d9b2cb8",
    code: "Z4R7E2KM9VB3",
    eventId: SEED_EVENTS.pastMatsuri.id,
    userId: SEED_USERS.aiko.id,
    checkedInAt: new Date("2026-08-15T12:42:00+05:30"),
  },
] as const;
