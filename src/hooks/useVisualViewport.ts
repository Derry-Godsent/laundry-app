import { useEffect } from "react";

/**
 * Keeps the shell's full-screen surfaces inside what the staff member can
 * actually see on a phone.
 *
 * `100dvh` tracks the browser's retracting toolbar, but it does not track
 * pinch-zoom or the on-screen keyboard. When the page is zoomed, `position:
 * fixed` elements are still laid out against the layout viewport, so a pinned
 * decision bar ends up below the visible area, which is exactly how the
 * Confirm date button goes missing. iOS also cannot be told not to zoom: it
 * ignores `user-scalable=no`, and it zooms by itself when a field smaller than
 * 16px is focused.
 *
 * So the visual viewport (what is on screen right now) is published as three
 * custom properties on `<html>`, and the overlay, the modal and the pinned bars
 * are sized and offset with them:
 *
 *   --vv-h       the visible height
 *   --vv-top     how far down the page the visible area starts
 *   --vv-bottom  the strip hidden below the visible area, for sticky bottoms
 *
 * Each falls back to 100dvh / 0 in CSS, so browsers without visualViewport
 * behave exactly as before.
 */

export interface ViewportMetrics {
  height: number;
  offsetTop: number;
}

/** The maths, kept pure so it can be exercised without a browser. */
export const viewportVars = (layoutHeight: number, vv: ViewportMetrics) => {
  const top = Math.max(0, Math.round(vv.offsetTop));
  return {
    "--vv-h": `${Math.max(0, Math.round(vv.height))}px`,
    "--vv-top": `${top}px`,
    // Negative when zoomed out: the visible area is then taller than the page,
    // so nothing is hidden and sticky elements stay at their natural edge.
    "--vv-bottom": `${Math.max(0, Math.round(layoutHeight - (vv.offsetTop + vv.height)))}px`,
  };
};

export const useVisualViewport = () => {
  useEffect(() => {
    const vv = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;
    let frame = 0;

    const write = () => {
      frame = 0;
      const vars = viewportVars(window.innerHeight, { height: vv.height, offsetTop: vv.offsetTop });
      for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    write();
    // resize fires on zoom and on the keyboard; scroll fires while a zoomed
    // page is panned, which moves the visible area without resizing it.
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
      for (const name of ["--vv-h", "--vv-top", "--vv-bottom"]) root.style.removeProperty(name);
    };
  }, []);
};

export default useVisualViewport;
