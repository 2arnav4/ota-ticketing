import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, NetworkError } from "@/api/client";
import type { CheckedInTicket } from "@/api/types";
import { colors, radius, space, type } from "@/theme/tokens";
import { formatDateAndTime, formatTicketCode } from "@/utils/format";

type Props = { ticket?: CheckedInTicket; error?: unknown; onNext: () => void };

type ResultView = { tone: "success" | "warning" | "danger"; title: string; lines: string[] };

function describe({ ticket, error }: Pick<Props, "ticket" | "error">): ResultView {
  if (ticket) {
    return {
      tone: "success",
      title: "Checked in",
      lines: [ticket.holderName, ticket.event.name, formatTicketCode(ticket.code)],
    };
  }
  if (error instanceof ApiError) {
    if (error.code === "ALREADY_CHECKED_IN") {
      const at = typeof error.details.checkedInAt === "string" ? formatDateAndTime(error.details.checkedInAt) : "";
      return { tone: "warning", title: "Already checked in", lines: [`First scanned ${at} IST`, "Do not admit again."] };
    }
    if (error.code === "TICKET_NOT_FOUND") return { tone: "danger", title: "Unknown ticket", lines: ["No ticket has this code."] };
    if (error.code === "VALIDATION_FAILED") return { tone: "danger", title: "Not a ticket code", lines: ["This QR isn't an Ōta ticket."] };
    if (error.code === "FORBIDDEN") return { tone: "danger", title: "Staff only", lines: ["Switch to Gate Staff to check tickets in."] };
    return { tone: "danger", title: "Check-in failed", lines: [error.message] };
  }
  if (error instanceof NetworkError) return { tone: "danger", title: "No connection", lines: [error.message] };
  return { tone: "danger", title: "Check-in failed", lines: ["Try again."] };
}

const TONES = {
  success: { fg: colors.success, bg: colors.successTint },
  warning: { fg: colors.warning, bg: colors.warningTint },
  danger: { fg: colors.danger, bg: colors.dangerTint },
} as const;

export function ScanResultSheet({ ticket, error, onNext }: Props) {
  const view = describe({ ticket, error });
  const tone = TONES[view.tone];

  return (
    <View style={[styles.sheet, { borderTopColor: tone.fg }]} accessibilityLiveRegion="polite">
      <View style={[styles.pill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.title, { color: tone.fg }]}>{view.title}</Text>
      </View>
      {view.lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
      <Pressable accessibilityRole="button" onPress={onNext} style={({ pressed }) => [styles.next, pressed && { opacity: 0.8 }]}>
        <Text style={styles.nextText}>Scan next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 4,
    padding: space.xl,
    gap: space.sm,
    alignItems: "center",
  },
  pill: { borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, marginBottom: space.xs },
  title: { fontSize: 18, fontWeight: "700" },
  line: { ...type.meta, fontSize: 15, color: colors.textPrimary, textAlign: "center" },
  next: {
    marginTop: space.md,
    alignSelf: "stretch",
    backgroundColor: colors.textPrimary,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: "center",
  },
  nextText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
