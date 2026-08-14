import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Building2, Shield, Package, Users, Mail, Lock,
  Eye, EyeOff, AlertCircle, CheckCircle, WifiOff, Loader2
} from "lucide-react";
import "./Login.css";

import type { Session, User } from "@supabase/supabase-js";

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const errorId = useRef(`login-error-${Math.random().toString(36).slice(2, 9)}`);

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

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

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
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      subscription.unsubscribe();
    };
  }, [handleRoleRedirect]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isOnline) {
      setError("You are offline. Check your connection and try again.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        supabase
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) return;
    const { clientX, clientY, currentTarget } = e;
    rafRef.current = requestAnimationFrame(() => {
      const rect = currentTarget.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((clientY - rect.top) / rect.height - 0.5) * 2;
      setParallax({ x, y });
      rafRef.current = null;
    });
  }, []);

  const statusColor = isOnline ? "#34d399" : "#f87171";
  const statusGlow = isOnline ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.5)";

  if (session) {
    return (
      <div className="login-root login-session">
        <div className="login-session-inner">
          <div className="login-session-icon-wrap">
            <div className="login-ping online" style={{ background: statusGlow, opacity: 0.35 }} />
            <CheckCircle size={64} color={statusColor} />
          </div>
          <div className="login-session-title">Session Authenticated</div>
          <div className="login-session-sub">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-root" onMouseMove={handleMouseMove}>
      {!isOnline && (
        <div className="login-banner">
          <WifiOff size={15} color="#f87171" />
          <span className="login-banner-text">You are offline.</span>
          <span className="login-banner-sub">Sign-in needs a connection. Reconnect and try again.</span>
        </div>
      )}

      <div className="login-layout">
        <div className="login-ambient" />
        <div className="login-grid" />
        <div
          className="login-orb login-orb-accent"
          style={{ transform: `translate(${parallax.x * 16}px, ${parallax.y * 16}px)` }}
        />
        <div
          className="login-orb login-orb-gold"
          style={{ transform: `translate(${parallax.x * -12}px, ${parallax.y * -12}px)` }}
        />
        <div
          className="login-orb login-orb-emerald"
          style={{ transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)` }}
        />

        <div className="login-brand-panel">
          <div className="login-brand">
            <div className="login-brand-logo">
              <Building2 size={24} color="#fff" />
            </div>
            <div className="login-brand-name">Chapman Prestige Limited</div>
          </div>

          <h1 className="login-headline">
            Centralized<br />
            <span className="login-headline-accent">Operations Hub</span>
          </h1>

          <p className="login-sub">
            Unified platform for order management, staff coordination, and real-time performance tracking.
          </p>

          <div className="login-features">
            {[
              { icon: Shield, text: "Secure Authentication" },
              { icon: Package, text: "Real-Time Order Tracking" },
              { icon: Users, text: "Role-Based Access Control" },
            ].map((feature, i) => (
              <div
                key={feature.text}
                className="login-feature"
                style={{ animationDelay: `${0.2 + i * 0.08}s` }}
              >
                <feature.icon
                  size={18}
                  color="#34d399"
                  className="login-feature-icon"
                />
                {feature.text}
              </div>
            ))}
          </div>

          <div className="login-footer">
            <div className="login-status">
              <div className="login-status-dot-wrap">
                <div
                  className="login-ping online"
                  style={{ background: statusGlow, opacity: 0.4 }}
                />
                <span
                  className={`login-status-dot ${isOnline ? "online" : "offline"}`}
                />
              </div>
              <span className="login-status-text">
                {isOnline ? "Systems online" : "Offline"}
              </span>
            </div>
            <span className="login-copyright">
              &copy; Chapman Prestige Limited &middot; Authorized Personnel Only
            </span>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-title">System Access</div>
          <div className="login-card-subtitle">Authorized credentials required</div>

          {error && (
            <div
              className="login-error"
              role="alert"
              aria-live="assertive"
              id={errorId.current}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleLogin}
            aria-describedby={error ? errorId.current : undefined}
          >
            <div>
              <label className="login-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="login-field">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  autoComplete="email"
                  placeholder="name@chapmanprestigelimited.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            <div>
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-field">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="login-password"
                  className="login-input login-input-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-invalid={error ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="login-eye-btn"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isOnline}
              className={`login-submit ${!isOnline && !loading ? "offline" : ""}`}
            >
              {loading && <Loader2 size={16} className="login-spin" />}
              {loading
                ? "Authenticating..."
                : !isOnline
                  ? "Offline"
                  : "Authenticate"}
            </button>
          </form>

          <div className="login-help">
            Contact administration for access provisioning
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;