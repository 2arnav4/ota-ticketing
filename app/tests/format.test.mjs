// Run with `npm test` (node --test). Node 24 strips TypeScript types natively, so format.ts loads as is.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDateAndTime,
  formatDateChip,
  formatEventDateTime,
  formatINR,
  formatTicketCode,
  formatTime,
} from "../src/utils/format.ts";

test("formatINR: integer paise to rupees with Indian grouping, no decimals", () => {
  assert.equal(formatINR(34900), "₹349");
  assert.equal(formatINR(106200), "₹1,062");
  assert.equal(formatINR(1234567800), "₹1,23,45,678");
  assert.equal(formatINR(0), "₹0");
});

test("times are shown in IST regardless of the machine's zone", () => {
  // 05:30 UTC is 11:00 in Kolkata; 12-hour clock with AM/PM.
  assert.equal(formatTime("2026-11-29T05:30:00.000Z", "en"), "11:00 AM");
  assert.equal(formatTime("2026-08-15T07:12:00.000Z", "en"), "12:42 PM");
  assert.equal(formatTime("2026-10-30T14:12:00.000Z", "en"), "7:42 PM");
  assert.equal(formatTime("2026-10-30T18:30:00.000Z", "en"), "12:00 AM"); // midnight is 12 AM, not 0:00
  // 20:00 UTC on the 28th is already the 29th in IST.
  assert.deepEqual(formatDateChip("2026-11-28T20:00:00.000Z", "en"), { day: "29", month: "NOV" });
});

test("language changes the writing, not the zone", () => {
  assert.match(formatEventDateTime("2026-11-28T05:30:00.000Z", "ja"), /2026年11月28日\(土\) 午前11:00/);
  assert.match(formatEventDateTime("2026-11-28T05:30:00.000Z", "en"), /28 Nov/);
  assert.deepEqual(formatDateChip("2026-11-28T05:30:00.000Z", "ja"), { day: "28", month: "11月" });
  assert.equal(formatDateAndTime("2026-08-15T07:12:00.000Z", "en"), "15 Aug 2026 · 12:42 PM");
  assert.match(formatEventDateTime("2026-11-28T05:30:00.000Z", "en"), /11:00 AM$/);
  assert.equal(formatTime("2026-10-30T14:12:00.000Z", "ja"), "午後7:42");
});

test("formatTicketCode groups 12 characters in fours for reading", () => {
  assert.equal(formatTicketCode("7K3M9QX2RB4D"), "7K3M-9QX2-RB4D");
});
