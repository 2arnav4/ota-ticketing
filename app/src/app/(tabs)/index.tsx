import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { ErrorState } from "@/components/ErrorState";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";
import { useEvents } from "@/hooks/useEvents";
import { colors, layout, space } from "@/theme/tokens";

export default function EventsScreen() {
  const { t, i18n } = useTranslation();
  const { data: events, isPending, isError, error, refetch, isRefetching } = useEvents();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title={t("tabs.events")} />
      {isPending ? (
        <View style={styles.list}>
          {[0, 1, 2].map((key) => (
            <EventCardSkeleton key={key} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.list}>
          <ErrorState error={error} onRetry={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={events}
          // FlatList skips re-rendering rows unless data or extraData change; the language must count.
          extraData={i18n.language}
          keyExtractor={(event) => event.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.lg, gap: space.md, width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },
});
