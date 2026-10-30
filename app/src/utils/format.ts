// Money is integer paise everywhere; this is the only place it becomes a display string. "₹1,062" style.
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

// Event times are stored as UTC instants and always shown in IST, whatever the device's time zone.
const IST = "Asia/Kolkata";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dayOfMonth = new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric" });
const shortMonth = new Intl.DateTimeFormat("en-IN", { timeZone: IST, month: "short" });

export function formatEventDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatDateChip(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  return { day: dayOfMonth.format(date), month: shortMonth.format(date).toUpperCase() };
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

const timeOnly = new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateOnly = new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });

/** "18:42" in IST, for check-in badges. */
export function formatTime(iso: string): string {
  return timeOnly.format(new Date(iso));
}

/** "15 Aug 2026 · 18:42" in IST. */
export function formatDateAndTime(iso: string): string {
  return `${dateOnly.format(new Date(iso))} · ${formatTime(iso)}`;
}

/** "7K3M9QX2RB4D" → "7K3M-9QX2-RB4D". Display only; the QR and the API use the raw 12 characters. */
export function formatTicketCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}
