import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { Building2, Shield, Package, Users, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, WifiOff, Loader2 } from "lucide-react";


/* ── DESIGN TOKENS ───────────────────────────────────────── */
const T = {
  bgBase: "#05070b",
  bgSurface: "#0a0d15",
  bgRaised: "#10141f",
  bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)",
  borderSoft: "rgba(255,255,255,0.09)",
  borderMid: "rgba(255,255,255,0.16)",
  textPrimary: "#edf0f8",
  textSec: "#9aa3b5",
  textTert: "#556070",
  textHint: "#2e3a4e",
  accent: "#6c72f3",
  accentBright: "#8489ff",
  accentDim: "rgba(108,114,243,0.13)",
  accentBord: "rgba(108,114,243,0.28)",
  accentGlow: "rgba(108,114,243,0.45)",
  gold: "#dba96a",
  goldDim: "rgba(219,169,106,0.1)",
  goldBord: "rgba(219,169,106,0.22)",
  emerald: "#34d399",
  emeraldDim: "rgba(52,211,153,0.1)",
  emeraldBord: "rgba(52,211,153,0.2)",
  emeraldGlow: "rgba(52,211,153,0.5)",
  ember: "#f87171",
  emberDim: "rgba(248,113,113,0.1)",
  emberBord: "rgba(248,113,113,0.2)",
  emberGlow: "rgba(248,113,113,0.45)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";

const StyleSheet = () => (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
    }
    @keyframes floatSlow {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-25px, 25px) scale(1.08); }
    }
    @keyframes loginFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes loginFadeRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes loginPing { 0% { transform: scale(0.9); opacity: 0.6; } 70% { transform: scale(2); opacity: 0; } 100% { opacity: 0; } }
    @keyframes loginPulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @keyframes loginShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    @keyframes loginBannerIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }

    .login-root * { box-sizing: border-box; }

    .auth-input { transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
    .auth-input:hover { border-color: ${T.borderMid}; }
    .auth-input:focus { outline: none; border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentDim}, 0 0 20px ${T.accentDim}; background: ${T.bgElevated}; }
    .auth-input::placeholder { color: ${T.textHint}; }

    .auth-icon { transition: color 0.2s ease; }
    .auth-field:focus-within .auth-icon { color: ${T.accent} !important; }

    .auth-eye-btn { transition: color 0.18s ease, transform 0.18s ease; }
    .auth-eye-btn:hover { color: ${T.textPrimary} !important; transform: scale(1.08); }

    .auth-submit { transition: transform 0.18s ease, box-shadow 0.25s ease, filter 0.18s ease; }
    .auth-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 28px ${T.accentGlow}; filter: brightness(1.06); }
    .auth-submit:not(:disabled):active { transform: translateY(0) scale(0.98); }

    .auth-feature { transition: transform 0.2s ease, color 0.2s ease; animation: loginFadeUp 0.5s ease both; }
    .auth-feature:hover { transform: translateX(4px); }
    .auth-feature:hover .auth-feature-icon { transform: scale(1.15) rotate(-4deg); }
    .auth-feature-icon { transition: transform 0.25s cubic-bezier(.34,1.56,.64,1); }

    .auth-card { animation: loginFadeRight 0.55s cubic-bezier(.2,.75,.3,1) both; }
    .auth-brand { animation: loginFadeUp 0.5s ease both; }
    .auth-headline { animation: loginFadeUp 0.6s ease 0.08s both; }
    .auth-sub { animation: loginFadeUp 0.6s ease 0.16s both; }

    .auth-error { animation: loginShake 0.5s ease both, loginFadeUp 0.3s ease both; }

    .auth-status-dot { animation: loginPulseDot 2s ease-in-out infinite; }
    .auth-ping-ring { position: absolute; inset: 0; border-radius: 50%; animation: loginPing 1.8s cubic-bezier(0,0,.2,1) infinite; }

    .auth-spin { animation: loginSpin 0.8s linear infinite; }

    .auth-banner { animation: loginBannerIn 0.35s cubic-bezier(.2,.8,.3,1) both; }

    @media (prefers-reduced-motion: reduce) {
      .login-root *, .login-root *::before, .login-root *::after {
        animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important;
      }
    }

    @media (max-width: 980px) {
      .auth-layout { flex-direction: column !important; }
      .auth-brand-panel { padding: 44px 28px 32px !important; }
      .auth-headline { font-size: 34px !important; }
      .auth-card { width: 100% !important; border-left: none !important; border-top: 1px solid ${T.borderSoft}; padding: 40px 28px !important; }
      .auth-features { display: none !important; }
      .auth-footer-note { position: static !important; margin-top: 32px; }
    }

    @media (max-width: 480px) {
      .auth-brand-panel { padding: 32px 20px 24px !important; }
      .auth-headline { font-size: 28px !important; }
      .auth-card { padding: 32px 20px !important; }
    }

     /* ✅ MOBILE TWEAKS (added only) */
    @media (max-width: 980px) {
      .auth-layout { flex-direction: column !important; }
      .auth-brand-panel { 
        padding: 44px 28px 32px !important; 
        text-align: center !important;
      }
      .auth-headline { font-size: 34px !important; }
      .auth-sub { margin: 0 auto 32px !important; }
      .auth-features { 
        display: none !important; /* Hide features on mobile to reduce clutter */
      }
      .auth-card { 
        width: 100% !important; 
        border-left: none !important; 
        border-top: 1px solid ${T.borderSoft}; 
        padding: 40px 28px !important;
        box-shadow: none !important;
      }
      .auth-footer-note { 
        position: static !important; 
        margin-top: 32px;
        justify-content: center !important;
      }
    }

    @media (max-width: 480px) {
      .auth-brand-panel { padding: 32px 20px 24px !important; }
      .auth-headline { font-size: 28px !important; }
      .auth-card { padding: 32px 20px !important; }
      
      /* Ensure inputs are touch-friendly */
      .auth-input { font-size: 16px !important; } /* Prevents iOS zoom */
      button, [role="button"] { min-height: 44px !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      .login-root *, .login-root *::before, .login-root *::after {
        animation-duration: 0.001ms !important; 
        animation-iteration-count: 1 !important; 
        transition-duration: 0.001ms !important;
      }
    }
  `}</style>
);

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Connectivity awareness — additive only, existing auth flow is untouched
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Subtle cursor parallax for the ambient background orbs
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session) handleRoleRedirect(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setSession(session);
        if (session) handleRoleRedirect(session.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleRoleRedirect = async (user: any) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const role = roleData?.role || user.user_metadata?.role || 'staff';

      switch (role) {
        case 'admin':
        case 'gm':
          navigate('/dashboard');
          break;
        default:
          navigate('/orders');
      }
    } catch (err) {
      console.error('Role fetch error:', err);
      navigate('/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isOnline) {
      setError("You're offline. Check your connection and try again.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) return;
    const { clientX, clientY, currentTarget } = e;
    rafRef.current = requestAnimationFrame(() => {
      const rect = currentTarget.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((clientY - rect.top) / rect.height - 0.5) * 2;
      setParallax({ x, y });
      rafRef.current = null;
    });
  };

  const statusColor = isOnline ? T.emerald : T.ember;
  const statusGlow = isOnline ? T.emeraldGlow : T.emberGlow;

  if (session) {
    return (
      <div className="login-root" style={{
        background: T.bgBase, minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: FONT
      }}>
        <StyleSheet />
        <div style={{ textAlign: "center" }} className="auth-brand">
          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 16px" }}>
            <div className="auth-ping-ring" style={{ background: T.emeraldGlow, opacity: 0.35 }} />
            <CheckCircle size={64} color={T.emerald} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary }}>Session Authenticated</div>
          <div style={{ fontSize: 13, color: T.textTert, marginTop: 8 }}>Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="login-root"
      onMouseMove={handleMouseMove}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        background: T.bgBase,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <StyleSheet />

      {/* OFFLINE BANNER — informs users plainly rather than letting a login attempt fail silently */}
      {!isOnline && (
        <div className="auth-banner" style={{
          position: "sticky", top: 0, zIndex: 50,
          background: `linear-gradient(90deg, ${T.emberDim}, rgba(248,113,113,0.04))`,
          borderBottom: `1px solid ${T.emberBord}`, padding: "10px 24px",
          display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(6px)"
        }}>
          <WifiOff size={15} color={T.ember} />
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600, fontFamily: FONT }}>You're offline.</span>
          <span style={{ fontSize: 13, color: T.textSec, fontFamily: FONT }}>Sign-in needs a connection — reconnect and try again.</span>
        </div>
      )}

      <div className="auth-layout" style={{ flex: 1, display: "flex", position: "relative" }}>

        {/* Ambient background */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${T.bgBase} 0%, ${T.bgSurface} 50%, ${T.bgRaised} 100%)`,
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
          backgroundImage: `radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: "34px 34px"
        }} />
        <div style={{
          position: "absolute", top: "-20%", right: "-10%", width: 600, height: 600,
          background: `radial-gradient(circle, ${T.accentDim} 0%, transparent 70%)`,
          borderRadius: "50%", pointerEvents: "none",
          transform: `translate(${parallax.x * 16}px, ${parallax.y * 16}px)`,
          animation: "float 20s ease-in-out infinite", transition: "transform 0.3s ease-out"
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", left: "-10%", width: 500, height: 500,
          background: `radial-gradient(circle, ${T.goldDim} 0%, transparent 70%)`,
          borderRadius: "50%", pointerEvents: "none",
          transform: `translate(${parallax.x * -12}px, ${parallax.y * -12}px)`,
          animation: "floatSlow 25s ease-in-out infinite reverse", transition: "transform 0.3s ease-out"
        }} />
        <div style={{
          position: "absolute", top: "35%", left: "38%", width: 380, height: 380,
          background: `radial-gradient(circle, ${T.emeraldDim} 0%, transparent 72%)`,
          borderRadius: "50%", pointerEvents: "none", opacity: 0.5,
          transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)`,
          animation: "float 30s ease-in-out infinite", transition: "transform 0.3s ease-out"
        }} />

        {/* Left Side - Branding */}
        <div className="auth-brand-panel" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
          zIndex: 1
        }}>
          <div className="auth-brand" style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32
          }}>
            <div style={{
              position: "relative", width: 48, height: 48,
              background: `linear-gradient(135deg, ${T.accent}, ${T.gold})`,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 24px ${T.accentDim}`
            }}>
              <Building2 size={24} color="#fff" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.03em" }}>
              Chapman Prestige Limited
            </div>
          </div>

          <h1 className="auth-headline" style={{
            fontSize: 48,
            fontWeight: 800,
            color: T.textPrimary,
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: "-0.02em"
          }}>
            Centralized<br />
            <span style={{
              background: `linear-gradient(90deg, ${T.accent}, ${T.accentBright})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent"
            }}>Laundry Operations</span>
          </h1>

          <p className="auth-sub" style={{
            fontSize: 16,
            color: T.textSec,
            lineHeight: 1.6,
            maxWidth: 480,
            marginBottom: 40
          }}>
            Unified platform for order management, staff coordination, and real-time performance tracking.
          </p>

          {/* Features */}
          <div className="auth-features" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: Shield, text: "Secure Authentication" },
              { icon: Package, text: "Real-Time Order Tracking" },
              { icon: Users, text: "Role-Based Access Control" }
            ].map((feature, i) => (
              <div key={i} className="auth-feature" style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                color: T.textSec,
                animationDelay: `${0.2 + i * 0.08}s`
              }}>
                <feature.icon size={18} color={T.emerald} className="auth-feature-icon" />
                {feature.text}
              </div>
            ))}
          </div>

          {/* Live status + footer */}
          <div className="auth-footer-note" style={{
            position: "absolute",
            bottom: 40,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ position: "relative", width: 8, height: 8 }}>
                <div className="auth-ping-ring" style={{ background: statusGlow, opacity: 0.4 }} />
                <span className="auth-status-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
              </div>
              <span style={{ fontSize: 11.5, color: T.textTert, fontFamily: FONT }}>{isOnline ? "Systems online" : "Offline"}</span>
            </div>
            <span style={{ fontSize: 12, color: T.textTert }}>
              © Chapman Prestige Limited • Authorized Personnel Only
            </span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-card" style={{
          width: "520px",
          background: `rgba(16, 20, 31, 0.65)`,
          backdropFilter: "blur(20px)",
          borderLeft: `1px solid ${T.borderSoft}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
          zIndex: 1,
          boxShadow: "-30px 0 60px rgba(0,0,0,0.25)"
        }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>
              System Access
            </div>
            <div style={{ fontSize: 14, color: T.textTert }}>
              Authorized credentials required
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error" style={{
              padding: 14,
              background: T.emberDim,
              border: `1px solid ${T.emberBord}`,
              borderRadius: 10,
              color: T.ember,
              fontSize: 13,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{
                fontSize: 12,
                color: T.textTert,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 8,
                display: "block",
                fontFamily: FONT
              }}>
                Email Address
              </label>
              <div className="auth-field" style={{ position: "relative" }}>
                <Mail size={18} color={T.textTert} className="auth-icon" style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none"
                }} />
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="name@chapmanprestigelimited.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 46px",
                    background: T.bgSurface,
                    border: `1px solid ${T.borderSoft}`,
                    borderRadius: 10,
                    color: T.textPrimary,
                    fontSize: 14,
                    fontFamily: MONO,
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{
                fontSize: 12,
                color: T.textTert,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 8,
                display: "block",
                fontFamily: FONT
              }}>
                Password
              </label>
              <div className="auth-field" style={{ position: "relative" }}>
                <Lock size={18} color={T.textTert} className="auth-icon" style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none"
                }} />
                <input
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 48px 14px 46px",
                    background: T.bgSurface,
                    border: `1px solid ${T.borderSoft}`,
                    borderRadius: 10,
                    color: T.textPrimary,
                    fontSize: 14,
                    fontFamily: MONO,
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-eye-btn"
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: T.textSec,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isOnline}
              className="auth-submit"
              style={{
                marginTop: 8,
                padding: "14px 20px",
                background: loading
                  ? T.textHint
                  : !isOnline
                    ? T.bgElevated
                    : `linear-gradient(135deg, ${T.accent}, ${T.gold})`,
                border: !isOnline && !loading ? `1px solid ${T.borderSoft}` : "none",
                borderRadius: 10,
                color: !isOnline && !loading ? T.textTert : "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: (loading || !isOnline) ? "not-allowed" : "pointer",
                fontFamily: FONT,
                opacity: loading ? 0.7 : 1,
                boxShadow: loading || !isOnline ? "none" : `0 4px 16px ${T.accentDim}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {loading && <Loader2 size={16} className="auth-spin" />}
              {loading ? "Authenticating..." : !isOnline ? "Offline" : "Authenticate"}
            </button>
          </form>

          {/* Help Text */}
          <div style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: 13,
            color: T.textTert,
            fontFamily: FONT
          }}>
            Contact administration for access provisioning
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;