// Own visual system (not the Ota Life brand). One neutral ground, one ink, one accent.
// The accent is shu-iro vermilion, the red of Tokyo's torii gates, and it goes on data, not chrome: the date chip
// of Ōta events, the wordmark and the scanner frame. Actions are near-black. Every text colour below clears
// 4.5:1 on the surface it is used on (checked when chosen; see the contrast notes beside each pair).
export const colors = {
  ground: "#F4F5F7",
  surface: "#FFFFFF",
  /** The ticket's stub: one tone step from the card, instead of a dividing line. */
  surfaceSunken: "#F7F8FA",
  /** 1.25:1 against white: separates cards without a shadow. */
  border: "#E3E6EB",
  /** Controls get one step stronger than cards. */
  borderStrong: "#CBD0D8",
  ink: "#111827",
  /** 6.0:1 on white, 5.5:1 on the ground. Secondary text only; running text stays in ink. */
  muted: "#5B6472",
  accent: "#B93A16",
  accentTint: "#FBEAE4",
  neutralFill: "#ECEEF1",
  success: "#166534",
  successTint: "#DCFCE7",
  warning: "#92400E",
  warningTint: "#FEF3C7",
  danger: "#B91C1C",
  dangerTint: "#FEE2E2",
  disabledFill: "#E5E7EB",
  disabledInk: "#4B5563",
} as const;

// Phones use the full width; on tablets and desktop browsers content stays a readable centred column
// instead of stretching cards and buttons across a 1440px screen.
export const layout = { maxContentWidth: 720 } as const;

// Cards are soft; buttons are fully round. Decided once for the whole app.
export const radius = { card: 16, chip: 10, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Touch targets: nothing tappable is shorter than this.
export const touch = { min: 44 } as const;

export const type = {
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.4 },
  cardTitle: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: "400" },
  meta: { fontSize: 13, fontWeight: "400" },
  /** Prices, counts and codes: digits of equal width so columns and changing numbers don't jiggle. */
  figure: { fontVariant: ["tabular-nums"] },
} as const;
