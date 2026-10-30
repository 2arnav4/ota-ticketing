// Money is integer paise everywhere; this is the only place it becomes a display string ("₹1,062").
// Always Indian grouping, even in the Japanese UI: the currency is INR.
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

// Event times are stored as UTC instants and always shown in IST, whatever the device's time zone.
// The language only changes how the date is written (en-IN vs ja-JP), never the zone.
const IST = "Asia/Kolkata";

const FORMATS = {
  dateTime: { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true },
  day: { day: "numeric" },
  month: { month: "short" },
  time: { hour: "numeric", minute: "2-digit", hour12: true },
  date: { day: "numeric", month: "short", year: "numeric" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

type FormatName = keyof typeof FORMATS;

// Intl formatters are expensive to build; keep one per (locale, format).
const cache = new Map<string, Intl.DateTimeFormat>();

// `language` is an explicit argument on purpose. The React Compiler memoizes calls by their inputs; a formatter
// that read the current language from a global would keep returning the old language after a switch.
function formatter(name: FormatName, language: string): Intl.DateTimeFormat {
  const locale = language === "ja" ? "ja-JP" : "en-IN";
  const key = `${locale}:${name}`;
  let cached = cache.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...FORMATS[name], timeZone: IST });
    cache.set(key, cached);
  }
  return cached;
}

// 12-hour clock everywhere. en-IN writes "7:42 pm"; English UI shows "7:42 PM", Japanese keeps "午後7:42".
function format12h(name: "dateTime" | "time", iso: string, language: string): string {
  return formatter(name, language)
    .formatToParts(new Date(iso))
    .map((part) => (part.type === "dayPeriod" && language !== "ja" ? part.value.toUpperCase() : part.value))
    .join("")
    // ICU puts a narrow no-break space (U+202F) before AM/PM; some Android fonts draw it as a box.
    .replace(/\u202f/g, " ");
}

export function formatEventDateTime(iso: string, language: string): string {
  return format12h("dateTime", iso, language);
}

export function formatDateChip(iso: string, language: string): { day: string; month: string } {
  const date = new Date(iso);
  return { day: formatter("day", language).format(date).replace(/日$/, ""), month: formatter("month", language).format(date).toUpperCase() };
}

/** "6:42 PM" in IST (午後6:42 in Japanese), for check-in badges. */
export function formatTime(iso: string, language: string): string {
  return format12h("time", iso, language);
}

/** "15 Aug 2026 · 6:42 PM" in IST. */
export function formatDateAndTime(iso: string, language: string): string {
  return `${formatter("date", language).format(new Date(iso))} · ${formatTime(iso, language)}`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

/** "7K3M9QX2RB4D" → "7K3M-9QX2-RB4D". Display only; the QR and the API use the raw 12 characters. */
export function formatTicketCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}
