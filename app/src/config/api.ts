import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 4000;

// Order: explicit env var (prod / custom) → the Mac running Metro (dev on a real phone) → localhost (web, iOS simulator).
// A phone can't use "localhost": that is the phone itself. Metro's hostUri is the Mac's LAN IP, and the API runs there too.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (Platform.OS !== "web" && metroHost) {
    return `http://${metroHost}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
