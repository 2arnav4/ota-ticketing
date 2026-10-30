import type { PressableStateCallbackType } from "react-native";

// react-native-web adds `hovered` to a Pressable's style callback; React Native's own types don't declare it
// (on iOS / Android it is simply undefined). Typing it here keeps hover styles compiling on a fresh checkout,
// before Expo has generated any local type files.
export type PressState = PressableStateCallbackType & { hovered?: boolean };
