import { Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const T = {
  bgBase: "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";

const faqs = [
  { q: "How do I create a new order?", a: "Navigate to the 'New Order' page from the sidebar. Select a client, add services, and click 'Create Order'." },
  { q: "How are loyalty tiers calculated?", a: "Tiers are automatically updated based on the number of completed visits. Bronze starts at 5 visits, Silver at 15, and Gold at 30+." },
  { q: "I forgot my password. How do I reset it?", a: "You can change your password directly from the 'My Profile' page in the top-right dropdown menu." },
  { q: "Who do I contact for system errors?", a: "Please reach out to the System Administrator via the contact details below or use the internal support channel." },
];

export const Help = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ padding: "32px", maxWidth: 800, margin: "0 auto", fontFamily: FONT, color: T.textPrimary }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: "-0.03em" }}>Help & Support</h2>

      {/* Contact Card */}
      <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <MessageCircle size={16} color={T.accent} /> Contact Support
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: 13.5 }}>
            <Mail size={16} color={T.accent} /> chapmanprestigeltd1@gmail.com
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: 13.5 }}>
            <Phone size={16} color={T.emerald} /> +233 534 134 809
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.textSec, fontSize: 13.5 }}>
            <MapPin size={16} color="#dba96a" /> Kwadaso-Ohwimase, Kumasi
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Frequently Asked Questions</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 10, overflow: "hidden" }}>
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              style={{
                width: "100%", padding: "16px 20px", background: "transparent", border: "none",
                color: T.textPrimary, fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT,
                textAlign: "left"
              }}
            >
              {faq.q}
              {openFaq === index ? <ChevronUp size={16} color={T.textTert} /> : <ChevronDown size={16} color={T.textTert} />}
            </button>
            {openFaq === index && (
              <div style={{ padding: "0 20px 16px", color: T.textSec, fontSize: 13.5, lineHeight: 1.6, fontFamily: FONT }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Help;