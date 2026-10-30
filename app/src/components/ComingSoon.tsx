import { StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "@/theme/tokens";

// Placeholder for tabs built in later modules. Removed when the real screen lands.
export function ComingSoon({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl },
  text: { ...type.meta, color: colors.textMuted, textAlign: "center" },
});
