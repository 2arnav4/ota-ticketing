import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { colors } from "@/theme/tokens";

// Placeholder until module M2 (booking + QR tickets).
export default function TicketsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title="My Tickets" />
      <ComingSoon label="Your tickets with QR codes arrive in module M2." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
