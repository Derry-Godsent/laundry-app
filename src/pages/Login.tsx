import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Mail, Lock, Eye, EyeOff, AlertCircle, WifiOff, Loader2 } from "lucide-react";
import { useConnection } from "../hooks/useConnection";
import { BrandMark } from "../components/brand/BrandMark";
import { BRAND } from "../components/brand/brand";
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
  /* The sign-in screen sits outside the shell, so it reads the same shared
     connection state the shell uses: the two can never disagree about whether
     the system is up. */
  const { isOffline } = useConnection();
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

  /* A phone shows the keyboard as soon as it can, because the first thing this
     screen is for is typing an email address. */
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

  return (
    <div className="login-page">
      <div className="login-shell">
        <header className="login-brand">
          <BrandMark size="xl" />
          <div className="login-brand__text">
            <span className="login-brand__name">{BRAND.short}</span>
            <span className="login-brand__product">{BRAND.product}</span>
          </div>
        </header>

        <main className="login-card">
          <div className="login-card__head">
            <h1 className="login-title">Sign in</h1>
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
        </main>

        <footer className="login-foot">
          <span>{BRAND.name}</span>
          <span aria-hidden="true">·</span>
          <span>Authorized personnel only</span>
        </footer>
      </div>
    </div>
  );
};
