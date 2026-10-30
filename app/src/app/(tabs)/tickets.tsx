import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";
import { PendingBookingCard } from "@/components/PendingBookingCard";
import { TicketCard } from "@/components/TicketCard";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { useTickets } from "@/hooks/useTickets";
import { usePendingBookings } from "@/state/bookingQueue";
import { useSession } from "@/state/session";
import { colors, layout, space } from "@/theme/tokens";

export default function TicketsScreen() {
  const { t, i18n } = useTranslation();
  const { userId } = useSession();
  const { data: tickets, isPending, isError, error, refetch, isRefetching, fetchStatus } = useTickets();
  const pending = usePendingBookings(userId);
  useRefreshOnFocus(refetch);

  // Offline with nothing saved yet: React Query pauses the request instead of failing it, so say why it's empty.
  const offlineWithoutData = isPending && fetchStatus === "paused";

  const pendingCards =
    pending.length > 0 ? (
      <View style={styles.pending}>
        {pending.map((booking) => (
          <PendingBookingCard key={booking.idempotencyKey} booking={booking} />
        ))}
      </View>
    ) : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title={t("tabs.tickets")} />
      {offlineWithoutData ? (
        <View style={styles.list}>
          {pendingCards}
          <EmptyState
            title={t("offline.noDataTitle")}
            message={t("offline.noDataMessage")}
            actionLabel={t("errors.retry")}
            onAction={() => void refetch()}
          />
        </View>
      ) : isPending ? (
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
          ListHeaderComponent={pendingCards}
          ListEmptyComponent={
            pending.length > 0 ? undefined : (
              <EmptyState
                title={t("tickets.emptyTitle")}
                message={t("tickets.emptyMessage")}
                actionLabel={t("tickets.browse")}
                onAction={() => router.navigate("/")}
              />
            )
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
  pending: { gap: space.md },
});
