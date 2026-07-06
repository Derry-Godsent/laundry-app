import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Search, Plus, Minus, Trash2, Check, X, Package, Users,
  Receipt, Truck, Percent, Zap, Clock, Save
} from "lucide-react";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bgBase: "#07090e", bgSurface: "#0c0f18", bgRaised: "#111520", bgElevated: "#161c2c",
  borderFaint: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.09)", borderMid: "rgba(255,255,255,0.15)",
  textPrimary: "#edf0f8", textSec: "#9aa3b5", textTert: "#556070", textHint: "#2e3a4e",
  accent: "#6c72f3", accentDim: "rgba(108,114,243,0.13)", accentBord: "rgba(108,114,243,0.28)",
  gold: "#dba96a", goldDim: "rgba(219,169,106,0.1)", goldBord: "rgba(219,169,106,0.22)",
  emerald: "#34d399", emeraldDim: "rgba(52,211,153,0.1)", emeraldBord: "rgba(52,211,153,0.2)",
  ember: "#f87171", emberDim: "rgba(248,113,113,0.1)", emberBord: "rgba(248,113,113,0.25)",
};

const FONT = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', 'Fira Mono', ui-monospace, monospace";

type Service = { id: string; name: string; category: string; price_wash: number; price_iron: number; price_fold: number; price_hang: number };
type Client = { id: string; name: string; type: string; tier: string; phone: string };
type CartItem = { serviceId: string; name: string; treatment: string; quantity: number; unitPrice: number; total: number };

export const OrderBuilder = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const [serviceSearch, setServiceSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [isExpress, setIsExpress] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: cData }, { data: sData }] = await Promise.all([
        supabase.from('clients').select('id, name, type, tier, phone').order('name'),
        supabase.from('services').select('id, name, category, price_wash, price_iron, price_fold, price_hang').order('category, name')
      ]);
      if (cData) setClients(cData);
      if (sData) setServices(sData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const filteredServices = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));

  const getClientPrice = (service: Service, treatment: string) => {
    switch(treatment) {
      case 'Iron': return service.price_iron || service.price_wash;
      case 'Fold': return service.price_fold || service.price_wash;
      case 'Hang': return service.price_hang || service.price_wash;
      default: return service.price_wash;
    }
  };

  const addToCart = (service: Service) => {
    const existing = cart.find(i => i.serviceId === service.id && i.treatment === 'Wash');
    if (existing) {
      setCart(cart.map(i => i.serviceId === service.id && i.treatment === 'Wash' 
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } 
        : i
      ));
    } else {
      const price = getClientPrice(service, 'Wash');
      setCart([...cart, { serviceId: service.id, name: service.name, treatment: 'Wash', quantity: 1, unitPrice: price, total: price }]);
    }
    setServiceSearch("");
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const qty = Math.max(1, newCart[index].quantity + delta);
    newCart[index] = { ...newCart[index], quantity: qty, total: qty * newCart[index].unitPrice };
    setCart(newCart);
  };

  const removeItem = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const updateTreatment = (index: number, treatment: string) => {
    const newCart = [...cart];
    const service = services.find(s => s.id === newCart[index].serviceId);
    if (service) {
      const price = getClientPrice(service, treatment);
      newCart[index] = { ...newCart[index], treatment, unitPrice: price, total: newCart[index].quantity * price };
      setCart(newCart);
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
  const expressSurcharge = isExpress ? cart.reduce((sum, i) => sum + (i.quantity * 10), 0) : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const totalDue = subtotal + expressSurcharge + deliveryFee - discountAmount;
  const balance = totalDue - amountPaid;

 const handleSubmit = async () => {
  if (!selectedClient) { 
    setToast({ msg: "Please select a client", type: 'error' }); 
    setTimeout(() => setToast(null), 3500); // ✅ Added
    return; 
  }
  if (cart.length === 0) { 
    setToast({ msg: "Add at least one item", type: 'error' }); 
    setTimeout(() => setToast(null), 3500); // ✅ Added
    return; 
  }
  // ... rest of your handleSubmit stays exactly the same
  
  setSubmitting(true);
  try {
    const orderId = `CPL-ORD-${Date.now().toString().slice(-6)}`;
    
    // ✅ FIXED: Added 'data:' so Supabase correctly returns the order object
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_id: orderId,
        client_id: selectedClient.id,
        status: 'Pending',
        is_express: isExpress,
        delivery_fee: deliveryFee,
        discount_percent: discountPercent,
        total_due: totalDue,
        amount_paid: amountPaid,
        notes: notes || null
      }])
      .select()
      .single();
      
    if (orderError) throw orderError;

    // ✅ Now 'order' is defined, so order.id works
    const itemsPayload = cart.map(i => ({
      order_id: order.id,
      service_id: i.serviceId,
      quantity: i.quantity,
      unit_price: i.unitPrice
    }));
    
    const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
    if (itemsError) throw itemsError;

    setToast({ msg: `Order ${orderId} created successfully!`, type: 'success' });
    setTimeout(() => setToast(null), 3500); // ✅ Auto-hide after 3.5s
    
    // Reset form
    setSelectedClient(null);
    setClientSearch("");
    setCart([]);
    setIsExpress(false);
    setDeliveryFee(0);
    setDiscountPercent(0);
    setAmountPaid(0);
    setNotes("");
  } catch (err: any) {
    console.error(err);
    setToast({ msg: err.message || "Failed to create order", type: 'error' });
    setTimeout(() => setToast(null), 4000); // ✅ Auto-hide error after 4s
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return <div style={{ padding: 40, color: T.textTert, fontFamily: FONT }}>Loading order builder...</div>;

  return (
    <div style={{ background: T.bgBase, minHeight: "100vh", fontFamily: FONT, color: T.textPrimary }}>
       <style>{`
        /* ✅ MOBILE TWEAKS (added only) */
        @media (max-width: 900px) {
          /* Stack the two columns vertically */
          [style*="gridTemplateColumns: \"1fr 380px\""] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          /* Make cart table scrollable on small screens */
          table { min-width: 680px !important; }
          
          /* Adjust header padding */
          [style*="padding: \"20px 32px\""] {
            padding: 16px !important;
          }
          
          /* Make inputs touch-friendly */
          input, select, textarea { font-size: 16px !important; } /* Prevents iOS zoom */
          button, [role="button"] { min-height: 44px !important; }
        }
        
        @media (max-width: 480px) {
          /* Further compact spacing */
          [style*="padding: \"24px 32px\""] {
            padding: 16px !important;
          }
          
          /* Hide less critical labels on very small screens */
          [style*="textTransform: \"uppercase\""] {
            font-size: 10px !important;
          }
        }
      `}</style>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === 'error' ? T.emberDim : T.emeraldDim, border: `1px solid ${toast.type === 'error' ? T.ember : T.emerald}`, borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.3)", zIndex: 10000 }}>
          <span style={{ fontSize: 14, color: toast.type === 'error' ? T.ember : T.emerald, fontWeight: 500 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ padding: 4, background: "transparent", border: "none", color: T.textSec, cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}`, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>New Order</div>
          <div style={{ fontSize: 12, color: T.textTert }}>Build unlimited-item orders instantly</div>
        </div>
        <button onClick={handleSubmit} disabled={submitting} style={{ 
          padding: "10px 24px", background: submitting ? T.textHint : T.accent, border: "none", borderRadius: 9, 
          color: "#fff", fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", 
          display: "flex", alignItems: "center", gap: 8, opacity: submitting ? 0.7 : 1 
        }}>
          <Save size={16} /> {submitting ? "Saving..." : "Create Order"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, padding: "24px 32px", alignItems: "start" }}>
        
        {/* LEFT: Client & Cart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Client Selector */}
          <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} color={T.accent} /> Client
            </div>
            <div style={{ position: "relative" }}>
              <input 
                value={clientSearch} 
                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); setSelectedClient(null); }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search client name..." 
                style={{ width: "100%", padding: "10px 12px", background: T.bgSurface, border: `1px solid ${selectedClient ? T.emeraldBord : T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT }} 
              />
              {showClientDropdown && clientSearch && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, maxHeight: 200, overflowY: "auto", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                  {filteredClients.length === 0 ? (
                    <div style={{ padding: 12, color: T.textTert, fontSize: 13 }}>No clients found</div>
                  ) : filteredClients.map(c => (
                    <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); setShowClientDropdown(false); }} 
                      style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, borderBottom: `1px solid ${T.borderFaint}`, background: selectedClient?.id === c.id ? T.accentDim : "transparent" }}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.textTert }}>{c.type} • {c.tier}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && (
              <div style={{ marginTop: 12, padding: 10, background: T.bgSurface, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: T.textSec }}>📞 {selectedClient.phone || "No phone"}</span>
                <span style={{ padding: "4px 8px", background: T.goldDim, color: T.gold, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{selectedClient.tier}</span>
              </div>
            )}
          </div>

          {/* Service Search */}
          <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} color={T.gold} /> Add Items
            </div>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textHint }} />
              <input 
                value={serviceSearch} 
                onChange={e => setServiceSearch(e.target.value)}
                placeholder="Search service (e.g. Shirt, Suit)..." 
                style={{ width: "100%", padding: "10px 12px 10px 36px", background: T.bgSurface, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: FONT }} 
              />
            </div>
            {serviceSearch && (
              <div style={{ marginTop: 8, background: T.bgElevated, border: `1px solid ${T.borderSoft}`, borderRadius: 8, maxHeight: 240, overflowY: "auto" }}>
                {filteredServices.length === 0 ? (
                  <div style={{ padding: 12, color: T.textTert, fontSize: 13 }}>No services found</div>
                ) : filteredServices.map(s => (
                  <div key={s.id} onClick={() => addToCart(s)} 
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.borderFaint}`, fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: T.textTert }}>{s.category}</div>
                    </div>
                    <div style={{ fontFamily: MONO, color: T.emerald, fontWeight: 600 }}>₵{s.price_wash}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSoft}`, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Receipt size={16} color={T.emerald} /> Cart ({cart.length} items)
            </div>
            {cart.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: T.textTert, fontSize: 14 }}>No items added yet</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bgSurface, borderBottom: `1px solid ${T.borderFaint}` }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: T.textTert, fontSize: 11, textTransform: "uppercase" }}>Item</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: T.textTert, fontSize: 11, textTransform: "uppercase" }}>Treatment</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: T.textTert, fontSize: 11, textTransform: "uppercase" }}>Qty</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: T.textTert, fontSize: 11, textTransform: "uppercase" }}>Price</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: T.textTert, fontSize: 11, textTransform: "uppercase" }}>Total</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <select value={item.treatment} onChange={e => updateTreatment(idx, e.target.value)} 
                          style={{ background: T.bgSurface, border: `1px solid ${T.borderSoft}`, borderRadius: 6, padding: "4px 8px", color: T.textPrimary, fontSize: 12, outline: "none", fontFamily: FONT }}>
                          <option>Wash</option><option>Iron</option><option>Fold</option><option>Hang</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <button onClick={() => updateQuantity(idx, -1)} style={{ width: 24, height: 24, borderRadius: 4, background: T.bgElevated, border: "none", color: T.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                          <span style={{ width: 24, textAlign: "center", fontFamily: MONO }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)} style={{ width: 24, height: 24, borderRadius: 4, background: T.bgElevated, border: "none", color: T.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: MONO, color: T.textSec }}>₵{item.unitPrice}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: MONO, fontWeight: 600 }}>₵{item.total}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button onClick={() => removeItem(idx)} style={{ background: "transparent", border: "none", color: T.textHint, cursor: "pointer" }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: Summary & Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: T.bgRaised, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color={T.gold} /> Order Options
            </div>
            
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.bgSurface, borderRadius: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 13, color: T.textSec }}>Express Service (+₵10/item)</span>
              <input type="checkbox" checked={isExpress} onChange={e => setIsExpress(e.target.checked)} style={{ width: 18, height: 18, accentColor: T.gold }} />
            </label>

            <div>
              <div style={{ fontSize: 11, color: T.textTert, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Delivery Fee</div>
              <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", background: T.bgSurface, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: MONO }} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: T.textTert, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Discount (%)</div>
              <input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", background: T.bgSurface, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: MONO }} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: T.textTert, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount Paid</div>
              <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", background: T.bgSurface, border: `1px solid ${balance > 0 ? T.emberBord : T.emeraldBord}`, borderRadius: 8, color: T.textPrimary, fontSize: 14, outline: "none", fontFamily: MONO }} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: T.textTert, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: "100%", padding: "10px 12px", background: T.bgSurface, border: `1px solid ${T.borderSoft}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, outline: "none", fontFamily: FONT, resize: "none" }} />
            </div>
          </div>

          {/* Totals */}
          <div style={{ background: T.bgSurface, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSec }}>
              <span>Subtotal</span><span style={{ fontFamily: MONO }}>₵{subtotal.toFixed(2)}</span>
            </div>
            {expressSurcharge > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.gold }}>
                <span>Express Surcharge</span><span style={{ fontFamily: MONO }}>+₵{expressSurcharge.toFixed(2)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSec }}>
                <span>Delivery</span><span style={{ fontFamily: MONO }}>+₵{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.emerald }}>
                <span>Discount ({discountPercent}%)</span><span style={{ fontFamily: MONO }}>-₵{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ height: 1, background: T.borderSoft, margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700 }}>
              <span>TOTAL DUE</span><span style={{ fontFamily: MONO }}>₵{totalDue.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: balance > 0 ? T.ember : T.emerald, fontWeight: 600 }}>
              <span>BALANCE</span><span style={{ fontFamily: MONO }}>₵{balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};