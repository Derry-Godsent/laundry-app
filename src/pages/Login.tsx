import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, WifiOff, Loader2, ArrowRight,
  WashingMachine, Droplets, SprayCan, Car, Layers, Sofa, Cylinder,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useConnection } from "../hooks/useConnection";
import { BrandMark } from "../components/brand/BrandMark";
import { BRAND } from "../components/brand/brand";
import "./Login.css";

import type { Session, User } from "@supabase/supabase-js";

/* The services this console runs on. Each keeps the hue it has everywhere else
   in the console, so a service reads as the same thing whichever screen it
   appears on. Adding one is a single entry here; the tile grid takes care of
   the rest, and a longer list wraps rather than breaking the layout. */
const SERVICES: { slug: string; name: string; blurb: string; icon: LucideIcon; hue: string }[] = [
  { slug: "laundry", name: "Laundry", blurb: "Wash, dry, press and fold, tracked from intake to delivery.", icon: WashingMachine, hue: "var(--info-500)" },
  { slug: "cleaning", name: "Cleaning", blurb: "Homes and offices, booked as jobs and logged against the client.", icon: Droplets, hue: "var(--ok-500)" },
  { slug: "fumigation", name: "Fumigation", blurb: "Treatments scheduled, priced and recorded with their dates.", icon: SprayCan, hue: "var(--warn-500)" },
  { slug: "car-detailing", name: "Car detailing", blurb: "Interior and exterior work, quoted and tracked per vehicle.", icon: Car, hue: "var(--brand-500)" },
  { slug: "carpet-washing", name: "Carpet washing", blurb: "Rugs and fitted carpets, counted by the piece on the order.", icon: Layers, hue: "var(--stage-ironing)" },
  { slug: "upholstery", name: "Sofa and upholstery", blurb: "Sofas, chairs and upholstery, cleaned and returned on schedule.", icon: Sofa, hue: "var(--stage-received)" },
  { slug: "polytank", name: "Polytank washing", blurb: "Polytanks and water storage, washed to order and invoiced.", icon: Cylinder, hue: "var(--brand-400)" },
];

/* Photographs for the service tiles.
 *
 * Put named files in `public/services/` (`laundry.jpg`, `cleaning.jpg`, and so
 * on, matching each `slug` above) and set this to true: every tile then shows
 * its photograph above the name. Until then the tiles carry their icon, and no
 * request is made for a file that is not there. */
const SERVICE_PHOTOS = false;

/* One service tile. It shows its photograph when there is one to show, and its
   icon when there is not, so a missing file can never leave an empty box. */
const ServiceTile = ({ service }: { service: (typeof SERVICES)[number] }) => {
  const [photoFailed, setPhotoFailed] = useState(!SERVICE_PHOTOS);
  const Icon = service.icon;

  return (
    <li
      className="login-service"
      style={{ "--svc-hue": service.hue } as React.CSSProperties}
    >
      {!photoFailed && (
        <span className="login-service__media">
          <img
            className="login-service__photo"
            src={`/services/${service.slug}.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        </span>
      )}
      <span className="login-service__body">
        <span className="login-service__icon" aria-hidden="true">
          <Icon size={17} />
        </span>
        <span className="login-service__text">
          <span className="login-service__name">{service.name}</span>
          <span className="login-service__blurb">{service.blurb}</span>
        </span>
      </span>
    </li>
  );
};

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  /* The sign-in screen sits outside the shell, so it reads the same shared
     connection state the shell uses: the two can never disagree about whether
     the system is up. */
  const { status: connectionStatus, isOffline } = useConnection();
  const isOnline = !isOffline;
  const errorId = useRef(`login-error-${Math.random().toString(36).slice(2, 9)}`);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleRoleRedirect = useCallback(async (user: User) => {
    try {
      const { data: roleData } = await supabase
        .from("staff")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = roleData?.role?.toLowerCase() || "staff";

      if (role === "admin" || role === "gm") {
        navigate("/dashboard");
      } else {
        navigate("/orders");
      }
    } catch (err) {
      console.error("Role fetch error:", err);
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) handleRoleRedirect(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!mounted) return;
        setSession(session);
        if (session?.user) handleRoleRedirect(session.user);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleRoleRedirect]);

  /* A phone shows the keyboard as soon as it can, because the first thing the
     fields are for is typing an email address. */
  useEffect(() => {
    if (session) return;
    emailRef.current?.focus({ preventScroll: true });
  }, [session]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isOnline) {
      setError("Sign-in needs a connection. Reconnect and try again.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        await supabase
          .from("staff")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.user.id)
          .then((res: { error: Error | null }) => {
            if (res.error) console.warn("Failed to update last_login:", res.error);
          });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, password, isOnline]);

  /* A session already exists: the redirect is the next thing to happen, so the
     screen says that and nothing else. */
  if (session) {
    return (
      <div className="login-page login-page--handoff">
        <div className="login-handoff">
          <BrandMark size="xl" />
          <div className="login-handoff__row">
            <Loader2 size={16} className="login-spin" aria-hidden="true" />
            <span className="login-handoff__text">Signing you in</span>
          </div>
        </div>
      </div>
    );
  }

  const liveLabel =
    connectionStatus === "live" ? "System live"
      : connectionStatus === "checking" ? "Checking the system"
        : "System offline";

  return (
    <div className="login-page">
      <div className="login-shell">
        <header className="login-top">
          <BrandMark size="lg" />
          <div className="login-top__text">
            <span className="login-top__name">{BRAND.name}</span>
            <span className="login-top__product">{BRAND.product}</span>
          </div>
          <div className={`login-live login-live--${connectionStatus}`} role="status">
            <span className="login-live__dot" aria-hidden="true" />
            <span className="login-live__text">{liveLabel}</span>
          </div>
        </header>

        <div className="login-body">
          <section className="login-showcase" aria-labelledby="login-services-title">
            <h1 className="login-hero">Everything we run, on one console.</h1>
            <p className="login-hero__sub">
              Orders, clients, staff, payments and service requests for every
              service below, from intake to delivery.
            </p>

            <a className="login-jump" href="#sign-in">
              Sign in <ArrowRight size={15} aria-hidden="true" />
            </a>

            <h2 id="login-services-title" className="login-services__title">What we run</h2>
            <ul className="login-services">
              {SERVICES.map((service) => (
                <ServiceTile key={service.slug} service={service} />
              ))}
            </ul>
          </section>

          <section className="login-panel" id="sign-in" aria-labelledby="login-title">
            <div className="login-card">
              <div className="login-card__head">
                <h2 className="login-title" id="login-title">Sign in</h2>
                <p className="login-subtitle">Staff access only</p>
              </div>

              {!isOnline && (
                <div className="login-notice login-notice--offline" role="status">
                  <WifiOff size={15} aria-hidden="true" />
                  <span>
                    This device is offline. Sign-in needs a connection, so it is
                    disabled until the system is reachable.
                  </span>
                </div>
              )}

              {error && (
                <div className="login-notice login-notice--error" role="alert" aria-live="assertive" id={errorId.current}>
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form
                className="login-form"
                onSubmit={handleLogin}
                aria-describedby={error ? errorId.current : undefined}
              >
                <div className="login-field">
                  <label className="login-label" htmlFor="login-email">Email address</label>
                  <div className="login-input">
                    <Mail size={16} className="login-input__icon" aria-hidden="true" />
                    <input
                      id="login-email"
                      ref={emailRef}
                      type="email"
                      name="email"
                      autoComplete="username"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="name@chapmanprestigelimited.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      aria-invalid={error ? "true" : "false"}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="login-password">Password</label>
                  <div className="login-input">
                    <Lock size={16} className="login-input__icon" aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      aria-invalid={error ? "true" : "false"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="login-input__reveal"
                      aria-label={showPass ? "Hide password" : "Show password"}
                      aria-pressed={showPass}
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading || !isOnline}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="login-spin" aria-hidden="true" />
                      Signing in
                    </>
                  ) : !isOnline ? "Offline" : "Sign in"}
                </button>
              </form>

              <p className="login-help">Contact administration for access provisioning.</p>
            </div>

          </section>
        </div>

        <footer className="login-bottom">
          <span>{BRAND.name}</span>
          <span aria-hidden="true">·</span>
          <span>Authorized personnel only</span>
        </footer>
      </div>
    </div>
  );
};
