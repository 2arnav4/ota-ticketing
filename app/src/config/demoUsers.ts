// Mirrors api/prisma/seedData.ts. The brief has no login, so the app picks one of the seeded users and sends its ID
// as X-User-Id. Role here only labels the chip; the server decides what each user may do.
export type DemoUser = { id: string; name: string; role: "FAN" | "STAFF" };

export const DEMO_USERS: readonly DemoUser[] = [
  { id: "0a8f8a3c-cb83-4ecf-8358-588b03249b38", name: "Aiko Sharma", role: "FAN" },
  { id: "4a12eeb9-cc9f-404c-9493-957d3bd4cffb", name: "Rohan Mehta", role: "FAN" },
  { id: "cfc750b1-5c92-4710-8600-71d30c438c43", name: "Gate Staff", role: "STAFF" },
];

export const DEFAULT_USER_ID = DEMO_USERS[0]!.id;
