import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

type Props = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };

export function GradientButton({ label, onPress, disabled = false, loading = false }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, inactive && styles.inactive, pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.label}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.pill, overflow: "hidden" },
  inactive: { opacity: 0.45 },
  gradient: { paddingVertical: space.md, alignItems: "center", justifyContent: "center", minHeight: 46 },
  label: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
