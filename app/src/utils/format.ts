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
