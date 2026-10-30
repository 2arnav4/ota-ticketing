import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, space, type } from "@/theme/tokens";

// Fallback for a damaged QR, a denied camera, or a browser without camera access. Server normalises the input.
export function ManualCodeEntry({ disabled, onSubmit }: { disabled: boolean; onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  const canSubmit = !disabled && code.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(code.trim());
    setCode("");
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Or type the code</Text>
      <View style={styles.row}>
        <TextInput
          value={code}
          onChangeText={setCode}
          onSubmitEditing={submit}
          placeholder="XXXX-XXXX-XXXX"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          editable={!disabled}
          accessibilityLabel="Ticket code"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={submit}
          style={({ pressed }) => [styles.button, !canSubmit && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.buttonText}>Check in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { ...type.meta, color: colors.textMuted },
  row: { flexDirection: "row", gap: space.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.gradientEnd,
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
