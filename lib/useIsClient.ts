import { useSyncExternalStore } from "react";

/** True after hydration; false during SSR. Prefer over useEffect + mounted state. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
