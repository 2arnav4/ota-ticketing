import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_USER_ID, DEMO_USERS } from "@/config/demoUsers";

const STORAGE_KEY = "ota.userId";

type Session = { userId: string; setUserId: (id: string) => void };

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        // A saved ID from an older seed would 401 forever; fall back to the default user instead.
        const known = DEMO_USERS.some((user) => user.id === saved);
        setUserIdState(known && saved ? saved : DEFAULT_USER_ID);
      })
      .catch(() => setUserIdState(DEFAULT_USER_ID));
  }, []);

  const setUserId = (id: string) => {
    setUserIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {
      // Losing the saved choice only means the default user on next launch.
    });
  };

  // Hold rendering until the saved user is known, so no request goes out under the wrong X-User-Id.
  if (userId === null) {
    return null;
  }
  return <SessionContext.Provider value={{ userId, setUserId }}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return session;
}
