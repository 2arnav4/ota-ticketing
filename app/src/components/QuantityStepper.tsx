import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type PressState } from "@/utils/pressState";
import { colors, radius, touch, type } from "@/theme/tokens";

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
      style={({ pressed, hovered }: PressState) => [
        styles.button,
        !props.enabled && styles.disabled,
        hovered && props.enabled && styles.hovered,
        pressed && props.enabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, !props.enabled && styles.disabledText]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // One rounded control rather than two floating circles: reads as a single "how many" field.
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  button: { width: touch.min, height: touch.min, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  hovered: { backgroundColor: colors.neutralFill },
  pressed: { backgroundColor: colors.border },
  disabled: { opacity: 1 },
  buttonText: { fontSize: 20, fontWeight: "500", color: colors.ink, lineHeight: 22 },
  disabledText: { color: colors.borderStrong },
  value: { minWidth: 24, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.ink, ...type.figure },
});
