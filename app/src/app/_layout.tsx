// Must stay first: importing @/i18n initialises i18next before any screen calls useTranslation.
import { restoreSavedLanguage } from "@/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { useAppStateFocus } from "@/hooks/useRefreshOnFocus";
import { connectOnlineManager, registerBookingDefaults } from "@/state/bookingQueue";
import { SessionProvider } from "@/state/session";

// 4xx answers are final (bad input, unknown user, sold out); retrying them only repeats the error. Retry network/5xx twice.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Saved data older than a day is dropped, including bookings still waiting for a connection.
const CACHE_MAX_AGE = DAY_MS;
const PERSISTED_QUERIES = new Set(["events", "tickets", "me"]);

function createQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      // gcTime must outlive the saved copy, or restored data is collected before it can be shown.
      queries: { retry: shouldRetry, staleTime: 15_000, gcTime: CACHE_MAX_AGE },
    },
  });
  registerBookingDefaults(client);
  return client;
}

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "ota.queryCache.v1" });

connectOnlineManager();

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  useAppStateFocus();

  useEffect(() => {
    void restoreSavedLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE,
          dehydrateOptions: {
            // Save bookings still waiting for the network, and the last good events / tickets so the app (and its
            // QR codes) still opens offline. Nothing else is written to the device.
            shouldDehydrateMutation: (mutation) => mutation.state.isPaused,
            shouldDehydrateQuery: (query) =>
              query.state.status === "success" && PERSISTED_QUERIES.has(String(query.queryKey[0])),
          },
        }}
        // Bookings restored from storage are paused; send them as soon as the saved cache is back.
        onSuccess={() => void queryClient.resumePausedMutations()}
      >
        <SessionProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </SessionProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
