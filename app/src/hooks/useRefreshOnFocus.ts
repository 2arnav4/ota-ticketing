import { focusManager } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

// React Query refetches on window focus in a browser, but React Native has no window: tell it when the app
// returns to the foreground. Registered once from the root layout.
export function useAppStateFocus(): void {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => subscription.remove();
  }, []);
}

// Tabs stay mounted, so switching back to one doesn't refetch by itself. This refetches each time the screen
// regains focus, so a booking or check-in made on another device shows up without a manual pull-to-refresh.
// The first focus is skipped: the query is already fetching on mount.
export function useRefreshOnFocus(refetch: () => Promise<unknown>): void {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );
}
