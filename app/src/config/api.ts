import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 4000;

// Order: explicit env var (deployed builds) → in dev, the machine that served the app → localhost.
// A phone can't use "localhost": that is the phone itself. In Expo Go, Metro's hostUri is the Mac's LAN IP; in a
// browser, the page's own host is (http://192.168.x.x:8081 opened on a phone → API at 192.168.x.x:4000).
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:${API_PORT}`;
  }
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (metroHost) {
    return `http://${metroHost}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
