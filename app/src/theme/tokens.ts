// Visual style sampled from the Ota Life app screenshots (approximate; colors came from JPEGs). Style only, no brand art.
export const colors = {
  gradientStart: "#05B6CA",
  gradientEnd: "#7B2CEA",
  bg: "#F5F9FC",
  surface: "#FFFFFF",
  border: "#E8ECF4",
  chipActive: "#D9F6FB",
  chipIdle: "#F1F1F9",
  textPrimary: "#111827",
  textMuted: "#6B7280",
  price: "#2B6FD8",
  success: "#16A34A",
  successTint: "#DCFCE7",
  warning: "#D97706",
  warningTint: "#FEF3C7",
  danger: "#DC2626",
  dangerTint: "#FEE2E2",
  eventAccent: "#6F3291",
} as const;

export const radius = { card: 14, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const type = {
  title: { fontSize: 22, fontWeight: "600" },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, fontWeight: "400" },
} as const;
