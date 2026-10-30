import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMe } from "@/hooks/useMe";
import { colors } from "@/theme/tokens";

// Picks the color from `focused` itself: the navigator's color param is typed wider than Ionicons accepts.
function TabIcon({ name, focused, size }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; size: number }) {
  return <Ionicons name={name} size={size} color={focused ? colors.ink : colors.muted} />;
}

const TAB_BAR_HEIGHT = 62;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
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
        // The default 49px bar clipped the label's descenders, so "My Tickets" read as "Mv Tickets". The bar now
        // sets its own height and padding; the bottom safe-area inset is added so iPhones keep the home-bar gap.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 8,
        },
        // flexShrink 0: the label sat in a flex column under the icon and was squeezed to 9px, cutting its text.
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: "500", flexShrink: 0 },
        tabBarItemStyle: { paddingVertical: 2 },
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
