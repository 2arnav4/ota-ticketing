import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { colors } from "@/theme/tokens";

// Placeholder until module M3 (check-in scanner).
export default function ScanScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title="Scan" />
      <ComingSoon label="The gate scanner arrives in module M3." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
