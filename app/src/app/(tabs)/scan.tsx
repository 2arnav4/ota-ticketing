import { useTranslation } from "react-i18next";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { ManualCodeEntry } from "@/components/ManualCodeEntry";
import { ScanResultSheet } from "@/components/ScanResultSheet";
import { useCheckin } from "@/hooks/useCheckin";
import { useMe } from "@/hooks/useMe";
import { colors, layout, radius, space, type } from "@/theme/tokens";

export default function ScanScreen() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const [permission, requestPermission] = useCameraPermissions();
  const checkin = useCheckin();
  const [focused, setFocused] = useState(false);

  // The camera fires onBarcodeScanned many times per second while a QR is in view. A ref (not state) flips
  // synchronously, so only the first frame gets through until "Scan next" releases it.
  const scanLock = useRef(false);

  // Release the camera when the tab is left, so it isn't running in the background.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const submit = (code: string) => {
    if (scanLock.current) return;
    scanLock.current = true;
    checkin.mutate(code);
  };

  const onScanned = ({ data }: BarcodeScanningResult) => submit(data);

  const scanNext = () => {
    checkin.reset();
    scanLock.current = false;
  };

  const showResult = checkin.isSuccess || checkin.isError;

  // A fan can still reach /scan by URL on web. The server answers 403 anyway; this just explains it up front.
  if (me && me.role !== "STAFF") {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <AppHeader title={t("tabs.scan")} />
        <Text style={styles.notice}>{t("scan.staffOnlyNotice")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title={t("tabs.scan")} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.viewfinder}>
          {permission?.granted && focused ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={showResult || checkin.isPending ? undefined : onScanned}
            />
          ) : (
            <View style={styles.cameraOff}>
              <Text style={styles.cameraOffText}>
                {permission?.canAskAgain === false
                  ? t("scan.cameraBlocked")
                  : t("scan.allowPrompt")}
              </Text>
              {permission?.canAskAgain !== false ? (
                <Pressable accessibilityRole="button" onPress={() => void requestPermission()} style={styles.allow}>
                  <Text style={styles.allowText}>{t("scan.allowButton")}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          {checkin.isPending ? (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>{t("scan.checking")}</Text>
            </View>
          ) : null}
        </View>

        <ManualCodeEntry disabled={checkin.isPending || showResult} onSubmit={submit} />
      </ScrollView>

      {showResult ? <ScanResultSheet ticket={checkin.data} error={checkin.error} onNext={scanNext} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },
  viewfinder: {
    aspectRatio: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0B1020",
    borderWidth: 3,
    borderColor: colors.gradientStart,
  },
  cameraOff: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md },
  cameraOffText: { color: "#E5E7EB", textAlign: "center", ...type.meta, fontSize: 14 },
  allow: { backgroundColor: colors.gradientStart, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.sm },
  allowText: { color: "#FFFFFF", fontWeight: "700" },
  pending: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  pendingText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  notice: { ...type.meta, color: colors.textMuted, textAlign: "center", padding: space.xl },
});
