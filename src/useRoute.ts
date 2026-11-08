import { useSyncExternalStore } from "react";
import { parseHash, type Route } from "./route.ts";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getHash = () => window.location.hash;

/** Current route; re-renders on hashchange. Navigation is plain <a href="#…">. */
export function useRoute(): { route: Route; hash: string } {
  const hash = useSyncExternalStore(subscribe, getHash, getHash);
  return { route: parseHash(hash), hash };
}
