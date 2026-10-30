import { useSyncExternalStore } from "react";

// App-wide banners for booking outcomes that arrive later, e.g. a queued booking confirmed after reconnecting,
// possibly on another screen or after the app was reopened. Plain store (no React state) because the booking
// callbacks live in the QueryClient, outside any component.
export type Notice =
  | { id: string; kind: "booked"; eventName: string; count: number }
  | { id: string; kind: "failed"; eventName: string; code: string; ticketsLeft?: number };

type NoticeInput = Notice extends infer N ? (N extends Notice ? Omit<N, "id"> : never) : never;

let notices: Notice[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

const AUTO_DISMISS_MS = 8000;

export function pushNotice(notice: NoticeInput): void {
  const id = `${Date.now()}-${Math.random()}`;
  notices = [...notices, { ...notice, id } as Notice];
  emit();
  setTimeout(() => dismissNotice(id), AUTO_DISMISS_MS);
}

export function dismissNotice(id: string): void {
  notices = notices.filter((n) => n.id !== id);
  emit();
}

export function useNotices(): Notice[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => notices,
    () => notices,
  );
}
