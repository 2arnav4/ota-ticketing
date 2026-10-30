import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useMe } from "@/hooks/useMe";
import { colors } from "@/theme/tokens";

// Picks the color from `focused` itself: the navigator's color param is typed wider than Ionicons accepts.
function TabIcon({ name, focused, size }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; size: number }) {
  return <Ionicons name={name} size={size} color={focused ? colors.ink : colors.muted} />;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  // UI convenience only: hides the tab for fans. The server's role check (M3) is what actually blocks them.
  const isStaff = me?.role === "STAFF";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.events"),
          tabBarIcon: ({ focused, size }) => <TabIcon name="calendar-outline" focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: t("tabs.tickets"),
          tabBarIcon: ({ focused, size }) => <TabIcon name="ticket-outline" focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t("tabs.scan"),
          href: isStaff ? undefined : null,
          tabBarIcon: ({ focused, size }) => <TabIcon name="qr-code-outline" focused={focused} size={size} />,
        }}
      />
    </Tabs>
  );
}
