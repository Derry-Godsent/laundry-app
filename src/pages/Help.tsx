import { Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const T = {
  bgBase: "var(--ink-base)", bgSurface: "var(--ink-shell)", bgRaised: "var(--ink-card)", bgElevated: "var(--ink-raised)",
  borderFaint: "var(--line-faint)", borderSoft: "var(--line-soft)",
  textPrimary: "var(--text-1)", textSec: "var(--text-2)", textTert: "var(--text-3)",
  accent: "var(--brand-500)", accentDim: "var(--brand-soft)", accentBord: "var(--brand-border)",
  emerald: "var(--ok-500)", emeraldDim: "var(--ok-soft)",
};

const FONT = "var(--font-ui)";

const faqs = [
  { q: "How do I create a new order?", a: "Navigate to the 'New Order' page from the sidebar. Select a client, add services, and click 'Create Order'." },
  { q: "How are loyalty tiers calculated?", a: "Tiers are automatically updated based on the number of completed visits. Bronze starts at 5 visits, Silver at 15, and Gold at 30+." },
  { q: "I forgot my password. How do I reset it?", a: "You can change your password directly from the 'My Profile' page in the top-right dropdown menu." },
  { q: "Who do I contact for system errors?", a: "Please reach out to the System Administrator via the contact details below or use the internal support channel." },
];

/* Phone: the shared page padding, thumb-height FAQ rows and contact rows that
   wrap instead of squeezing an address onto one line. */
const HELP_CSS = `
  @media screen and (max-width: 900px) {
    .hp-page { padding: 18px var(--page-pad-x) 40px !important; }
    .hp-faq-btn { min-height: var(--tap-min); padding: 16px var(--page-pad-x) !important; }
    .hp-faq-body { padding: 0 var(--page-pad-x) 16px !important; }
    .hp-contact { grid-template-columns: minmax(0, 1fr) !important; gap: 12px !important; }
    .hp-contact-row { align-items: flex-start !important; }
    .hp-contact-row svg { flex: 0 0 auto; margin-top: 2px; }
  }
`;

export const Help = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style>{HELP_CSS}</style>
      <div className="hp-page" style={{ padding: "32px", maxWidth: 800, margin: "0 auto", fontFamily: FONT, color: T.textPrimary }}>
      <h2 style={{ fontSize: "var(--fs-2xl)", fontWeight: 700, marginBottom: 24, letterSpacing: "-0.03em" }}>Help & Support</h2>

      {/* Contact Card */}
      <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: "var(--fs-lg)", fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <MessageCircle size={16} color={T.accent} /> Contact Support
        </h3>
        <div className="hp-contact" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div className="hp-contact-row" style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: "var(--fs-md)" }}>
            <Mail size={16} color={T.accent} /> chapmanprestigeltd1@gmail.com
          </div>
          <div className="hp-contact-row" style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: "var(--fs-md)" }}>
            <Phone size={16} color={T.emerald} /> +233 534 134 809
          </div>
          <div className="hp-contact-row" style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: "var(--fs-md)" }}>
            <MapPin size={16} color="var(--text-2)" /> Kwadaso-Ohwimase, Kumasi
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <h3 style={{ fontSize: "var(--fs-lg)", fontWeight: 600, marginBottom: 16 }}>Frequently Asked Questions</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10, overflow: "hidden" }}>
            <button
              className="hp-faq-btn"
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              style={{
                width: "100%", padding: "16px 20px", background: "transparent", border: "none",
                color: T.textPrimary, fontSize: "var(--fs-md)", fontWeight: 600, cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT,
                textAlign: "left"
              }}
            >
              {faq.q}
              {openFaq === index ? <ChevronUp size={16} color={T.textTert} /> : <ChevronDown size={16} color={T.textTert} />}
            </button>
            {openFaq === index && (
              <div className="hp-faq-body" style={{ padding: "0 20px 16px", color: T.textSec, fontSize: "var(--fs-md)", lineHeight: 1.6, fontFamily: FONT }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </>
  );
};

export default Help;