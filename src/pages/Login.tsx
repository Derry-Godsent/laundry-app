import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, WifiOff, Loader2,
  WashingMachine, Droplets, SprayCan, Car, Layers, Sofa, Cylinder,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useConnection } from "../hooks/useConnection";
import { BrandMark } from "../components/brand/BrandMark";
import { BRAND } from "../components/brand/brand";
import "./Login.css";

import type { Session, User } from "@supabase/supabase-js";

/* The work this console runs on, in the order a customer meets it.
 *
 * Each service carries the hue it has everywhere else in the console, so the
 * same thing reads the same on this screen as it does on the Services page.
 * `line` is the one thing somebody signing in should be able to read off the
 * picture: what the work is, not what the software does. */
const FEATURE = {
  slug: "laundry",
  name: "Laundry",
  line: "Wash, dry, press and fold, tracked from intake to delivery.",
  icon: WashingMachine,
  hue: "var(--info-500)",
};

const SERVICES: { slug: string; name: string; line: string; icon: LucideIcon; hue: string }[] = [
  { slug: "cleaning", name: "Cleaning", line: "Homes, offices and shops.", icon: Droplets, hue: "var(--ok-500)" },
  { slug: "fumigation", name: "Fumigation", line: "Treatments, dates and certificates.", icon: SprayCan, hue: "var(--warn-500)" },
  { slug: "car-detailing", name: "Car detailing", line: "Interior and exterior, per vehicle.", icon: Car, hue: "var(--brand-500)" },
  { slug: "carpet-washing", name: "Carpet washing", line: "Rugs and fitted carpets, by the piece.", icon: Layers, hue: "var(--stage-ironing)" },
  { slug: "upholstery", name: "Sofa and upholstery", line: "Sofas, chairs and office seating.", icon: Sofa, hue: "var(--stage-received)" },
  { slug: "polytank", name: "Polytank washing", line: "Polytanks and water storage.", icon: Cylinder, hue: "var(--brand-400)" },
];

/* The photograph behind the whole page.
 *
 * One file, blurred and already dimmed, so the browser has nothing to do but
 * paint it: no CSS blur on a full-screen layer, which is what makes a phone
 * stutter while typing a password. Replace this file and the page follows. */
const BACKDROP = "/services/login-backdrop.jpg";

/* One piece of work, as a picture.
 *
 * The photograph carries the meaning; the plate over it names the service in
 * the console's own type. `/services/<slug>.jpg` is committed with the app, and
 * if one is ever renamed or missing the frame falls back to the service's icon
 * on its hue rather than leaving a hole in the page. */
const ServiceCard = ({ service }: { service: typeof FEATURE }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const Icon = service.icon;

  return (
    <li
      className="login-tile"
      style={{ "--svc-hue": service.hue } as React.CSSProperties}
    >
      <figure className="login-tile__frame">
        {photoFailed ? (
          <span className="login-tile__fallback">
            <Icon size={26} aria-hidden="true" />
          </span>
        ) : (
          <img
            className="login-tile__photo"
            src={`/services/${service.slug}.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        )}
        <figcaption className="login-tile__plate">
          <span className="login-tile__icon" aria-hidden="true">
            <Icon size={15} />
          </span>
          <span className="login-tile__name">{service.name}</span>
        </figcaption>
      </figure>
      <p className="login-tile__line">{service.line}</p>
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
      {/* The page backdrop: the company's work, out of focus, behind everything.
          Fixed, so it does not move while the page scrolls, and dimmed to a flat
          surface rather than faded, so it stays a background and every field
          above it keeps its contrast. */}
      <div className="login-backdrop" aria-hidden="true">
        <img className="login-backdrop__photo" src={BACKDROP} alt="" decoding="async" />
        <span className="login-backdrop__dim" />
      </div>

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

        {/* The work itself, before anything is asked for: the flagship service
            as a wide photograph, with its own name on it and the page's title
            over it. Laundry appears here and not again below, so no service is
            shown twice and every row of pictures stays full. */}
        <section className="login-band" style={{ "--svc-hue": FEATURE.hue } as React.CSSProperties}>
          <img
            className="login-band__photo"
            src={`/services/${FEATURE.slug}.jpg`}
            alt=""
            decoding="async"
          />
          <span className="login-band__scrim" aria-hidden="true" />
          <span className="login-band__chip">
            <span className="login-band__chip-icon" aria-hidden="true">
              <FEATURE.icon size={16} />
            </span>
            {FEATURE.name}
          </span>
          <div className="login-band__text">
            <h1 className="login-hero">Every job we run, in one place.</h1>
            <p className="login-hero__sub">
              Laundry, cleaning, fumigation, car detailing and more, logged from
              the first call to the receipt.
            </p>
          </div>
        </section>

        <div className="login-body">
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

          <section className="login-showcase" aria-labelledby="login-services-title">
            <h2 id="login-services-title" className="login-services__title">What we run</h2>

            <ul className="login-tiles">
              {SERVICES.map((service) => (
                <ServiceCard key={service.slug} service={service} />
              ))}
            </ul>
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
