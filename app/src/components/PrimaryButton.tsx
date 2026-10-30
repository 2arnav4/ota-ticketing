import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

type Props = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };

// The one filled action per card. Flat near-black: colour is kept for data, not buttons.
export function PrimaryButton({ label, onPress, disabled = false, loading = false }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        disabled && styles.disabled,
        hovered && !inactive && styles.hovered,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  hovered: { backgroundColor: "#1F2937" },
  pressed: { transform: [{ scale: 0.98 }], backgroundColor: "#000000" },
  disabled: { backgroundColor: colors.disabledFill },
  label: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  disabledLabel: { color: colors.disabledInk },
});
