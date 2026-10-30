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
import { colors, space } from "@/theme/tokens";

export default function TicketsScreen() {
  const { data: tickets, isPending, isError, error, refetch, isRefetching } = useTickets();
  // Set by the Events screen after a successful booking; cleared when the banner is dismissed.
  const { booked } = useLocalSearchParams<{ booked?: string }>();

  const banner = booked ? (
    <Banner
      message={booked === "1" ? "Booked 1 ticket" : `Booked ${booked} tickets`}
      onDismiss={() => router.setParams({ booked: undefined })}
    />
  ) : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppHeader title="My Tickets" />
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
          keyExtractor={(ticket) => ticket.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={banner}
          ListEmptyComponent={
            <EmptyState
              title="No tickets yet"
              message="Book an event and your QR tickets show up here."
              actionLabel="Browse events"
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
  list: { padding: space.lg, gap: space.md },
});
