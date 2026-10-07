import { useEffect, useRef, useState } from "react";
import { WifiOff, RefreshCw, ServerCrash } from "lucide-react";
import { useConnection } from "@/hooks/useConnection";
import "./ConnectionBanner.css";

/**
 * One connection strip for the whole console.
 *
 * It sits inside the layout, directly under the top bar, so it is visible on
 * every page at once and no page needs its own copy. While the console is live
 * it renders nothing at all: a green "all good" bar is noise, and the top bar
 * already carries the live indicator. When the backend cannot be reached it
 * says which side is down, and it offers the one useful action.
 *
 * Saving is refused while the banner is up, rather than attempted and failed:
 * this app is a console for staff standing in a laundry, and "Saved" followed
 * by "Save Failed" is worse than a clear "not now".
 */
export const ConnectionBanner = () => {
  const { status, reason, lastChecked, retry } = useConnection();
  const [checkedAgo, setCheckedAgo] = useState<number | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (status !== "offline" || !lastChecked) {
      setCheckedAgo(null);
      return;
    }
    const tick = () => setCheckedAgo(Math.max(0, Math.round((Date.now() - lastChecked) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, lastChecked]);

  /* When the connection comes back, the page under this banner is showing
     stale rows. Say so, once, and get out of the way. */
  useEffect(() => {
    if (status === "offline") wasOffline.current = true;
  }, [status]);

  if (status !== "offline") return null;

  const isServer = reason === "server";

  return (
    <div className="conn-banner" role="alert" aria-live="assertive">
      <div className="conn-banner__left">
        {isServer ? (
          <ServerCrash size="var(--icon-md)" className="conn-banner__icon" aria-hidden="true" />
        ) : (
          <WifiOff size="var(--icon-md)" className="conn-banner__icon" aria-hidden="true" />
        )}
        <div className="conn-banner__text">
          <strong>
            {isServer
              ? "The system is not responding."
              : "This device is offline."}
          </strong>
          <span>
            {isServer
              ? "Your connection is working, but the server cannot be reached. Nothing can be loaded or saved until it answers."
              : "Nothing can be loaded or saved until this device has a connection again."}
            {checkedAgo !== null && checkedAgo > 5 ? ` Last checked ${checkedAgo}s ago.` : ""}
          </span>
        </div>
      </div>

      <button type="button" className="conn-banner__retry" onClick={retry}>
        <RefreshCw size="var(--icon-sm)" aria-hidden="true" />
        Check again
      </button>
    </div>
  );
};

export default ConnectionBanner;
