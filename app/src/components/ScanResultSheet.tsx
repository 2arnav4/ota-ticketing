import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { classifyError, logForDevelopers } from "@/utils/errorKind";
import type { CheckedInTicket } from "@/api/types";
import { colors, layout, radius, space, type } from "@/theme/tokens";
import { formatDateAndTime, formatTicketCode } from "@/utils/format";

type Props = { ticket?: CheckedInTicket; error?: unknown; onNext: () => void };

type ResultView = { tone: "success" | "warning" | "danger"; title: string; lines: string[] };

function describe({ ticket, error }: Pick<Props, "ticket" | "error">, t: TFunction, language: string): ResultView {
  if (ticket) {
    return {
      tone: "success",
      title: t("scan.result.checkedIn"),
      lines: [ticket.holderName, ticket.event.name, formatTicketCode(ticket.code)],
    };
  }
  logForDevelopers(error);
  const result = classifyError(error);
  if (result.kind === "network") return { tone: "danger", title: t("scan.result.offline"), lines: [t("errors.network")] };
  if (result.kind === "server") return { tone: "danger", title: t("scan.result.failed"), lines: [t("errors.server")] };
  if (result.kind === "known") {
    if (result.code === "ALREADY_CHECKED_IN") {
      const at = typeof result.details.checkedInAt === "string" ? formatDateAndTime(result.details.checkedInAt, language) : "";
      return { tone: "warning", title: t("scan.result.already"), lines: [t("scan.result.alreadyAt", { when: at }), t("scan.result.doNotAdmit")] };
    }
    if (result.code === "TICKET_NOT_FOUND") return { tone: "danger", title: t("scan.result.unknown"), lines: [t("scan.result.unknownLine")] };
    if (result.code === "VALIDATION_FAILED") return { tone: "danger", title: t("scan.result.invalid"), lines: [t("scan.result.invalidLine")] };
    if (result.code === "FORBIDDEN") return { tone: "danger", title: t("scan.result.staffOnly"), lines: [t("scan.result.staffOnlyLine")] };
  }
  return { tone: "danger", title: t("scan.result.failed"), lines: [t("scan.result.tryAgain")] };
}

const TONES = {
  success: { fg: colors.success, bg: colors.successTint },
  warning: { fg: colors.warning, bg: colors.warningTint },
  danger: { fg: colors.danger, bg: colors.dangerTint },
} as const;

export function ScanResultSheet({ ticket, error, onNext }: Props) {
  const { t, i18n } = useTranslation();
  const view = describe({ ticket, error }, t, i18n.language);
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
        <Text style={styles.nextText}>{t("scan.next")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
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
