import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

type Props = { value: number; min: number; max: number; disabled?: boolean; onChange: (next: number) => void };

export function QuantityStepper({ value, min, max, disabled = false, onChange }: Props) {
  const { t } = useTranslation();
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <View style={styles.row}>
      <StepButton label="−" accessibilityLabel={t("events.fewer")} enabled={canDecrease} onPress={() => onChange(value - 1)} />
      <Text style={styles.value} accessibilityLabel={t("events.ticketsCount", { count: value })}>
        {value}
      </Text>
      <StepButton label="+" accessibilityLabel={t("events.more")} enabled={canIncrease} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton(props: { label: string; accessibilityLabel: string; enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      accessibilityState={{ disabled: !props.enabled }}
      disabled={!props.enabled}
      onPress={props.onPress}
      style={({ pressed }) => [styles.button, !props.enabled && styles.disabled, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.buttonText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
  buttonText: { fontSize: 20, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 },
  value: { minWidth: 20, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.textPrimary },
});
