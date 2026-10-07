import { useEffect, useState } from "react";

/**
 * Tracks a media query in React.
 *
 * Layout should be decided in CSS wherever possible. This hook exists for the
 * cases where the *behaviour* differs, not just the look: a busy list and its
 * detail panel sit side by side on a desk, but on a phone the detail has to take
 * over the screen with a Back button, and that is a different element, not a
 * different style.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const list = window.matchMedia(query);
    const handle = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(list.matches);
    list.addEventListener("change", handle);
    return () => list.removeEventListener("change", handle);
  }, [query]);

  return matches;
};

export default useMediaQuery;
