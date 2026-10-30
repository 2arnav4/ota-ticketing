import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";
import { TicketCard } from "@/components/TicketCard";
import { useTickets } from "@/hooks/useTickets";
import { colors, layout, space } from "@/theme/tokens";

export default function TicketsScreen() {
  const { t, i18n } = useTranslation();
  const { data: tickets, isPending, isError, error, refetch, isRefetching } = useTickets();
  // Set by the Events screen after a successful booking; cleared when the banner is dismissed.
  const { booked } = useLocalSearchParams<{ booked?: string }>();

  const banner = booked ? (
    <Banner
      message={t("tickets.booked", { count: Number(booked) })}
      onDismiss={() => router.setParams({ booked: undefined })}
    />
  ) : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title={t("tabs.tickets")} />
      {isPending ? (
        <View style={styles.list}>
          <EventCardSkeleton />
          <EventCardSkeleton />
        </View>
      ) : isError ? (
        <View style={styles.list}>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          // FlatList skips re-rendering rows unless data or extraData change; the language must count.
          extraData={i18n.language}
          keyExtractor={(ticket) => ticket.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={banner}
          ListEmptyComponent={
            <EmptyState
              title={t("tickets.emptyTitle")}
              message={t("tickets.emptyMessage")}
              actionLabel={t("tickets.browse")}
              onAction={() => router.navigate("/")}
            />
          }
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
