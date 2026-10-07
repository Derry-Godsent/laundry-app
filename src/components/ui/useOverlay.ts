import { useCallback, useEffect, useRef } from "react";

/**
 * Behaviour every overlay in the console needs, in one place.
 *
 * A phone is not a desk: the notch takes the top and bottom of the screen, the
 * on-screen keyboard takes the bottom half, and the only way out of a panel is
 * often a back gesture. So every overlay:
 *
 *   - closes on Escape,
 *   - locks the page behind it instead of letting it scroll away,
 *   - keeps keyboard focus inside itself, and returns focus to whatever opened
 *     it when it closes,
 *   - is announced as a dialog.
 *
 * Panels used to solve this one at a time, which is why some closed on Escape
 * and some did not.
 */
export const useOverlay = (isOpen: boolean, onClose: () => void) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const focusables = useCallback((): HTMLElement[] => {
    const root = containerRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => node.offsetParent !== null || node === document.activeElement);
  }, []);

  /* Escape closes; Tab cycles inside the panel rather than walking into the
     page behind it. */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = focusables();
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || !active)) {
        event.preventDefault();
        last.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose, focusables]);

  /* The page behind the panel must not scroll: on a phone that is how a sheet
     ends up half off the screen. */
  useEffect(() => {
    if (!isOpen) return;

    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [isOpen]);

  /* Focus moves into the panel on open and back to the trigger on close. */
  useEffect(() => {
    if (!isOpen) {
      const previous = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (previous && document.contains(previous)) previous.focus();
      return;
    }

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      const nodes = focusables();
      const target =
        containerRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? nodes[0];
      target?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, focusables]);

  return containerRef;
};
