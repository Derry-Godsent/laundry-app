import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";
import { Printer, ArrowLeft, Search, Download, AlertCircle, Package } from "lucide-react";

const T = {
  bgBase: "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.15)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)",
  gold: "#dba96a", goldDim: "rgba(219,169,106,0.1)", goldBord: "rgba(219,169,106,0.22)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)",
  ember: "#f87171", emberDim: "rgba(248,113,113,0.1)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";

export const Receipt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState("");

  const { permission, loading: permLoading, canEdit } = usePermission(location.pathname);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    setDebugMsg("Fetching orders...");
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_id, total_due, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Supabase fetch error:", error);
      setDebugMsg(`Error: ${error.message}`);
      return;
    }
    
    console.log("✅ Fetched orders:", data);
    if (data) setOrders(data);
    setDebugMsg(data?.length ? `Loaded ${data.length} orders` : "No orders found in database");
  };

  useEffect(() => {
    if (!selectedOrderId) return;
    setLoading(true);
    setDebugMsg("Loading receipt details...");

    supabase
      .from('orders')
      .select(`
        *,
        clients:client_id (name, phone, type, tier),
        order_items (
          quantity,
          unit_price,
          services:service_id (name, category)
        )
      `)
      .eq('id', selectedOrderId)
      .single()
      .then(({ data, error }: any) => {
        if (error) {
          console.error("Receipt fetch error:", error);
          setDebugMsg(`Failed to load: ${error.message}`);
        } else {
          console.log("✅ Receipt data:", data);
          setReceipt(data);
          setDebugMsg("");
        }
        setLoading(false);
      });
  }, [selectedOrderId]);

  const handlePrint = () => window.print();

  // Calculate totals
  const subtotal = receipt?.order_items?.reduce((sum: number, i: any) => {
    // 🔹 MODIFIED: Calculate line_total client-side (quantity * unit_price)
    const lineTotal = (i.quantity || 1) * (i.unit_price || 0);
    return sum + lineTotal;
  }, 0) || 0;
  
  const expressSurcharge = receipt?.is_express 
    ? receipt.order_items.reduce((sum: number, i: any) => sum + ((i.quantity || 1) * 10), 0) 
    : 0;
    
  const discountAmount = subtotal * ((receipt?.discount_percent || 0) / 100);
  const totalDue = subtotal + expressSurcharge + (receipt?.delivery_fee || 0) - discountAmount;
  const balance = totalDue - (receipt?.amount_paid || 0);

  if (permLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: T.textTert, fontFamily: FONT }}>
      Loading...
    </div>
  );

  return (
    <div style={{ background: T.bgBase, minHeight: "100vh", fontFamily: FONT, color: T.textPrimary }}>
      <style>{`
        @media print {
          body { background: white; color: black; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .receipt-card { border: none; box-shadow: none; background: white; color: black; width: 100%; max-width: 100%; }
          .receipt-card * { color: black !important; border-color: #ddd !important; }
          .receipt-header { border-bottom: 2px solid #000; }
          .receipt-footer { border-top: 2px solid #000; }
        }

        @media (max-width: 720px) {
          .top-bar { padding: 12px 16px !important; flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .top-bar select { width: 100% !important; min-width: auto !important; }
          .receipt-card { margin: 0 12px !important; }
          .receipt-header, .receipt-body, .receipt-summary, .receipt-footer { padding: 20px !important; }
          .receipt-grid { grid-template-columns: 1fr !important; }
          .receipt-items-grid { grid-template-columns: 2fr 1fr 1fr 1fr !important; font-size: 12px !important; }
        }
        @media (max-width: 480px) {
          .receipt-items-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .receipt-items-grid > div:nth-child(2), .receipt-items-grid > div:nth-child(3) { display: none; }
        }
      `}</style>

      {/* Top Bar */}
      <div className="no-print top-bar" style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "16px 32px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: T.textSec, cursor: "pointer", fontFamily: FONT, fontSize: 14 }}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Receipt Generator</h2>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select 
            value={selectedOrderId} 
            onChange={e => setSelectedOrderId(e.target.value)}
            style={{ padding: "10px 14px", background: T.bgRaised, border: `1px solid ${T.borderMid}`, borderRadius: 8, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT, minWidth: 260, cursor: "pointer" }}
          >
            <option value="">📦 Select an order to print...</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>{o.order_id} • ₵{o.total_due?.toFixed(2)} • {o.status}</option>
            ))}
          </select>
          
          <button 
            onClick={() => canEdit && handlePrint()} 
            disabled={!selectedOrderId || !canEdit}
            style={{ 
              padding: "10px 18px", 
              background: (selectedOrderId && canEdit) ? T.accent : T.textHint, 
              border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, 
              cursor: (selectedOrderId && canEdit) ? "pointer" : "not-allowed", 
              display: "flex", alignItems: "center", gap: 6, fontFamily: FONT,
              opacity: (selectedOrderId && canEdit) ? 1 : 0.7
            }}
          >
            <Printer size={15} /> {canEdit ? "Print" : "View Only"}
          </button>
        </div>
      </div>

      {/* Debug/Status Bar */}
      {debugMsg && (
        <div style={{ padding: "8px 32px", background: T.bgElevated, borderBottom: `1px solid ${T.borderFaint}`, fontSize: 12, color: T.textSec, fontFamily: MONO }}>
          {debugMsg}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 80, color: T.textTert, fontFamily: FONT }}>
          Generating receipt...
        </div>
      )}

      {/* Empty State */}
      {!receipt && !loading && orders.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: T.textTert, fontFamily: FONT }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: T.textSec }}>No orders found</div>
          <div style={{ fontSize: 13, marginTop: 8, textAlign: "center", maxWidth: 400 }}>
            Create your first order in the <strong>New Order</strong> page, then come back here to generate receipts.
          </div>
        </div>
      )}

      {/* Receipt Card - Wrapped with PermissionGuard */}
      <PermissionGuard>
        {receipt && (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
            <div className="receipt-card" style={{ 
              width: "100%", maxWidth: 620, background: T.bgRaised, border: `1px solid ${T.borderSoft}`, 
              borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" 
            }}>
              <div className="receipt-header" style={{ padding: "32px", textAlign: "center", borderBottom: `1px solid ${T.borderFaint}` }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, textTransform: "uppercase" }}>Chapman Prestige Ltd</div>
                <div style={{ fontSize: 13, color: T.textTert, lineHeight: 1.6 }}>
                  Kwadaso-Ohwimase, Kumasi • Tel: +233 534 134 809<br/>
                  chapmanprestigelimited@gmail.com
                </div>
                <div style={{ marginTop: 16, padding: "6px 14px", background: T.bgElevated, borderRadius: 20, fontSize: 11, color: T.textSec, display: "inline-block", letterSpacing: "0.08em", fontWeight: 700 }}>
                  OFFICIAL RECEIPT
                </div>
              </div>

              <div className="receipt-body" style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderBottom: `1px solid ${T.borderFaint}` }}>
                <div>
                  <div style={{ fontSize: 10, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>Order ID</div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: MONO, color: T.accent }}>{receipt.order_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>Date</div>
                  {/* ✅ Date-only display (no time) */}
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{new Date(receipt.created_at).toLocaleDateString('en-GB')}</div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ fontSize: 10, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>Client</div>
                  <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {receipt.clients?.name || "Walk-in"}
                    <span style={{ fontSize: 10, padding: "2px 6px", background: T.goldDim, color: T.gold, borderRadius: 4, fontWeight: 600 }}>
                      {receipt.clients?.tier || "Standard"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="receipt-items" style={{ padding: "24px 32px" }}>
                <div className="receipt-items-grid" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", gap: 12, paddingBottom: 10, borderBottom: `1px solid ${T.borderSoft}`, fontSize: 10, color: T.textTert, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                  <div>Item</div><div style={{ textAlign: "center" }}>Qty</div><div style={{ textAlign: "right" }}>Unit</div><div style={{ textAlign: "right" }}>Total</div>
                </div>
                {receipt.order_items?.map((item: any, i: number) => {
                  // 🔹 MODIFIED: Calculate line_total client-side
                  const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.borderFaint}`, fontSize: 14 }}>
                      <div style={{ fontWeight: 500 }}>{item.services?.name || "Service"}</div>
                      <div style={{ textAlign: "center", color: T.textSec }}>{item.quantity}</div>
                      {/* 🔹 MODIFIED: Format unit_price with .toFixed(2) */}
                      <div style={{ textAlign: "right", color: T.textSec, fontFamily: MONO }}>₵{(item.unit_price || 0).toFixed(2)}</div>
                      {/* 🔹 MODIFIED: Display calculated line_total with .toFixed(2) */}
                      <div style={{ textAlign: "right", fontWeight: 600, fontFamily: MONO }}>₵{lineTotal.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="receipt-summary" style={{ padding: "24px 32px", background: T.bgSurface, borderTop: `1px solid ${T.borderFaint}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSec }}>
                    <span>Subtotal</span><span style={{ fontFamily: MONO }}>₵{subtotal.toFixed(2)}</span>
                  </div>
                  {expressSurcharge > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.gold }}>
                      <span>Express Surcharge</span><span style={{ fontFamily: MONO }}>+₵{expressSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  {receipt.delivery_fee > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSec }}>
                      <span>Delivery</span><span style={{ fontFamily: MONO }}>+₵{receipt.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.emerald }}>
                      <span>Discount ({receipt.discount_percent}%)</span><span style={{ fontFamily: MONO }}>-₵{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ height: 1, background: T.borderSoft, margin: "6px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700 }}>
                    <span>TOTAL DUE</span><span style={{ fontFamily: MONO }}>₵{totalDue.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: T.textSec }}>
                    <span>Paid</span><span style={{ fontFamily: MONO }}>₵{(receipt.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: balance > 0 ? T.ember : T.emerald, fontWeight: 600 }}>
                    <span>BALANCE</span><span style={{ fontFamily: MONO }}>₵{balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="receipt-footer" style={{ padding: "24px 32px", textAlign: "center", borderTop: `1px solid ${T.borderFaint}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Thank you for choosing Chapman Prestige!</div>
                <div style={{ fontSize: 11, color: T.textTert }}>Official receipt • Keep for records</div>
                {balance > 0 && (
                  <div style={{ marginTop: 14, padding: 10, background: T.emberDim, borderRadius: 8, fontSize: 12, color: T.ember, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <AlertCircle size={14} /> Balance of GH₵{balance.toFixed(2)} due on pickup/delivery
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </div>
  );
};

export default Receipt;