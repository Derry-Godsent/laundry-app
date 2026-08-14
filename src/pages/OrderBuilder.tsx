import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom"; // ✅ Added
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import {
  Search, Plus, Minus, Trash2, Check, X, Package, Users,
  Receipt, Truck, Percent, Zap, Clock, Save, Calendar,
  Phone, Lightbulb, Inbox
} from "lucide-react";
import "./OrderBuilder.css";

// ✅ Added permission imports
import { usePermission } from "../hooks/usePermission";
import { PermissionGuard } from "../components/PermissionGuard";

interface Service {
  id: string;
  name: string;
  category: string;
  price_wash: number;
  price_iron: number;
  price_fold: number;
  price_hang: number;
}

interface Client {
  id: string;
  name: string;
  type: string;
  tier: string;
  phone: string;
}

interface CartItem {
  serviceId: string;
  name: string;
  treatment: string;
  quantity: number;
  unitPrice: number;
  total: number;
  useCustomPrice?: boolean;
}

interface Toast {
  msg: string;
  type: "success" | "error";
}

const formatDateOnly = (isoString: string): string => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB");
};

const getTodayDate = (): string => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
};

const parseDateInput = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (date.getMonth() === Number(m) - 1) {
      return date.toISOString().split("T")[0];
    }
  }

  const mmddyyyy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (mmddyyyy) {
    const [, m, d, y] = mmddyyyy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (date.getMonth() === Number(m) - 1) {
      return date.toISOString().split("T")[0];
    }
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  const now = new Date();
  if (lower === "today") return getTodayDate();
  if (lower === "yesterday") {
    const yest = new Date(now.getTime() - 86400000);
    return yest.toISOString().split("T")[0];
  }
  if (lower === "tomorrow") {
    const tom = new Date(now.getTime() + 86400000);
    return tom.toISOString().split("T")[0];
  }

  return null;
};

export const OrderBuilder = () => {
  const location = useLocation();
  // ✅ Get permission state for this specific page
  const { canEdit } = usePermission(location.pathname);

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [serviceSearch, setServiceSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isExpress, setIsExpress] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const [orderDate, setOrderDate] = useState(getTodayDate);
  const [dateInput, setDateInput] = useState(getTodayDate);

  const [useCurrentPricing, setUseCurrentPricing] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      const [{ data: cData }, { data: sData }] = await Promise.all([
        supabase.from("clients").select("id, name, type, tier, phone").order("name"),
        supabase.from("services").select("id, name, category, price_wash, price_iron, price_fold, price_hang").order("category, name"),
      ]);
      if (!mounted) return;
      if (cData) setClients(cData);
      if (sData) setServices(sData);
      setLoading(false);
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  );

  const filteredServices = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase())),
    [services, serviceSearch]
  );

  const getClientPrice = useCallback((service: Service, treatment: string): number => {
    switch (treatment) {
      case "Iron": return service.price_iron || service.price_wash;
      case "Fold": return service.price_fold || service.price_wash;
      case "Hang": return service.price_hang || service.price_wash;
      default: return service.price_wash;
    }
  }, []);

  const addToCart = useCallback(
    (service: Service) => {
      setCart((prev) => {
        const existing = prev.find(
          (i) => i.serviceId === service.id && i.treatment === "Wash"
        );
        if (existing) {
          return prev.map((i) =>
            i.serviceId === service.id && i.treatment === "Wash"
              ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
              : i
          );
        }
        const price = !useCurrentPricing ? 0 : getClientPrice(service, "Wash");
        return [
          ...prev,
          {
            serviceId: service.id,
            name: service.name,
            treatment: "Wash",
            quantity: 1,
            unitPrice: price,
            total: price,
            useCustomPrice: !useCurrentPricing,
          },
        ];
      });
      setServiceSearch("");
    },
    [useCurrentPricing, getClientPrice]
  );

  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      const qty = Math.max(1, newCart[index].quantity + delta);
      newCart[index] = {
        ...newCart[index],
        quantity: qty,
        total: qty * newCart[index].unitPrice,
      };
      return newCart;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTreatment = useCallback(
    (index: number, treatment: string) => {
      setCart((prev) => {
        const newCart = [...prev];
        const service = services.find((s) => s.id === newCart[index].serviceId);
        if (service) {
          const price = !newCart[index].useCustomPrice
            ? getClientPrice(service, treatment)
            : newCart[index].unitPrice;
          newCart[index] = {
            ...newCart[index],
            treatment,
            unitPrice: price,
            total: newCart[index].quantity * price,
          };
        }
        return newCart;
      });
    },
    [services, getClientPrice]
  );

  const updateCustomPrice = useCallback((index: number, price: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index] = {
        ...newCart[index],
        unitPrice: price,
        total: price * newCart[index].quantity,
        useCustomPrice: true,
      };
      return newCart;
    });
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.total, 0),
    [cart]
  );
  const expressSurcharge = useMemo(
    () => (isExpress ? cart.reduce((sum, i) => sum + i.quantity * 10, 0) : 0),
    [isExpress, cart]
  );
  const discountAmount = useMemo(
    () => subtotal * (discountPercent / 100),
    [subtotal, discountPercent]
  );
  const totalDue = useMemo(
    () => subtotal + expressSurcharge + deliveryFee - discountAmount,
    [subtotal, expressSurcharge, deliveryFee, discountAmount]
  );
  const balance = useMemo(() => totalDue - amountPaid, [totalDue, amountPaid]);

  const handleDateChange = useCallback((value: string) => {
    setDateInput(value);
    const parsed = parseDateInput(value);
    if (parsed) {
      setOrderDate(parsed);
    }
  }, []);

  const handleDateBlur = useCallback(() => {
    const parsed = parseDateInput(dateInput);
    if (parsed) {
      setDateInput(parsed);
      setOrderDate(parsed);
    } else {
      setDateInput(orderDate);
    }
  }, [dateInput, orderDate]);

  const handleSubmit = useCallback(async () => {
    if (!selectedClient) {
      setToast({ msg: "Please select a client", type: "error" });
      return;
    }
    if (cart.length === 0) {
      setToast({ msg: "Add at least one item", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const orderId = `CPL-ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const created_at = `${orderDate}T12:00:00.000Z`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            order_id: orderId,
            client_id: selectedClient.id,
            status: "Pending",
            is_express: isExpress,
            delivery_fee: deliveryFee,
            discount_percent: discountPercent,
            total_due: totalDue,
            amount_paid: amountPaid,
            notes: notes || null,
            created_at,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsPayload = cart.map((i) => ({
        order_id: order.id,
        service_id: i.serviceId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      setToast({ msg: `Order ${orderId} created successfully`, type: "success" });

      setSelectedClient(null);
      setClientSearch("");
      setCart([]);
      setIsExpress(false);
      setDeliveryFee(0);
      setDiscountPercent(0);
      setAmountPaid(0);
      setNotes("");
      const today = getTodayDate();
      setOrderDate(today);
      setDateInput(today);
      setUseCurrentPricing(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      console.error(err);
      setToast({ msg: message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }, [selectedClient, cart, orderDate, isExpress, deliveryFee, discountPercent, totalDue, amountPaid, notes]);

  const handleFormKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (loading) {
    return <div className="ob-loading">Loading order builder...</div>;
  }

  return (
    <div className="ob-root">
      {toast && (
        <div className={`ob-toast ${toast.type}`}>
          <span className="ob-toast-text">{toast.msg}</span>
          <button
            className="ob-toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="ob-header">
        <div>
          <div className="ob-header-title">New Order</div>
          <div className="ob-header-sub">Build unlimited-item orders instantly</div>
        </div>
        {/* ✅ Disabled if user lacks edit access */}
        <button
          className="ob-submit-btn"
          onClick={handleSubmit}
          disabled={submitting || !canEdit}
          style={{ opacity: !canEdit ? 0.6 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}
        >
          <Save size={16} />
          {submitting ? "Saving..." : "Create Order"}
        </button>
      </div>

      {/* ✅ Wrapped in PermissionGuard to show "View-only" banner if needed */}
      <PermissionGuard>
        <div className="ob-layout" onKeyDown={handleFormKeyDown} role="form" aria-label="Order form">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="ob-panel">
              <div className="ob-panel-title">
                <Users size={16} color="#6c72f3" /> Client
              </div>
              <div style={{ position: "relative" }} ref={clientDropdownRef}>
                <input
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                    setSelectedClient(null);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search client name..."
                  className="ob-input"
                  disabled={!canEdit}
                  style={{
                    borderColor: selectedClient ? "rgba(52, 211, 153, 0.2)" : undefined,
                    opacity: !canEdit ? 0.7 : 1,
                    cursor: !canEdit ? "not-allowed" : "text"
                  }}
                />
                {showClientDropdown && clientSearch && (
                  <div className="ob-dropdown">
                    {filteredClients.length === 0 ? (
                      <div className="ob-dropdown-empty">No clients found</div>
                    ) : (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          className={`ob-dropdown-item ${selectedClient?.id === c.id ? "active" : ""}`}
                          onClick={() => {
                            if (!canEdit) return;
                            setSelectedClient(c);
                            setClientSearch(c.name);
                            setShowClientDropdown(false);
                          }}
                          style={{ cursor: !canEdit ? "not-allowed" : "pointer" }}
                        >
                          <div className="ob-dropdown-name">{c.name}</div>
                          <div className="ob-dropdown-meta">
                            {c.type} &middot; {c.tier}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedClient && (
                <div className="ob-client-info">
                  <span className="ob-client-phone">
                    <Phone size={14} />
                    {selectedClient.phone || "No phone"}
                  </span>
                  <span className="ob-client-tier">{selectedClient.tier}</span>
                </div>
              )}
            </div>

            <div className="ob-panel">
              <div className="ob-panel-title">
                <Package size={16} color="#dba96a" /> Add Items
              </div>
              <div className="ob-search-wrap">
                <Search size={14} className="ob-search-icon" />
                <input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search service (e.g. Shirt, Suit)..."
                  className="ob-input ob-input-search"
                  disabled={!canEdit}
                  style={{ opacity: !canEdit ? 0.7 : 1, cursor: !canEdit ? "not-allowed" : "text" }}
                />
              </div>
              {serviceSearch && (
                <div className="ob-service-list">
                  {filteredServices.length === 0 ? (
                    <div className="ob-dropdown-empty">No services found</div>
                  ) : (
                    filteredServices.map((s) => (
                      <div
                        key={s.id}
                        className="ob-service-item"
                        onClick={() => {
                          if (!canEdit) return;
                          addToCart(s);
                        }}
                        style={{ cursor: !canEdit ? "not-allowed" : "pointer" }}
                      >
                        <div>
                          <div className="ob-service-name">{s.name}</div>
                          <div className="ob-service-category">{s.category}</div>
                        </div>
                        <div className="ob-service-price">₵{s.price_wash}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="ob-panel" style={{ overflow: "hidden", flex: 1, padding: 0 }}>
              <div className="ob-cart-header">
                <Receipt size={16} color="#34d399" /> Cart ({cart.length} items)
              </div>
              {cart.length === 0 ? (
                <div className="ob-cart-empty">
                  <Inbox size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div>No items added yet</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="ob-cart-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style={{ textAlign: "center" }}>Treatment</th>
                        <th style={{ textAlign: "center" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Price</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={`${item.serviceId}-${item.treatment}`}>
                          <td style={{ fontWeight: 500 }}>{item.name}</td>
                          <td>
                            <select
                              value={item.treatment}
                              onChange={(e) => updateTreatment(idx, e.target.value)}
                              className="ob-select"
                              disabled={!canEdit}
                              style={{ opacity: !canEdit ? 0.7 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}
                            >
                              <option>Wash</option>
                              <option>Iron</option>
                              <option>Fold</option>
                              <option>Hang</option>
                            </select>
                          </td>
                          <td>
                            <div className="ob-cart-qty">
                              <button
                                className="ob-qty-btn"
                                onClick={() => updateQuantity(idx, -1)}
                                aria-label="Decrease quantity"
                                disabled={!canEdit}
                                style={{ opacity: !canEdit ? 0.5 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="ob-qty-value">{item.quantity}</span>
                              <button
                                className="ob-qty-btn"
                                onClick={() => updateQuantity(idx, 1)}
                                aria-label="Increase quantity"
                                disabled={!canEdit}
                                style={{ opacity: !canEdit ? 0.5 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="ob-cart-price">
                            {!useCurrentPricing || item.useCustomPrice ? (
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateCustomPrice(idx, Number(e.target.value))}
                                className="ob-input ob-input-number"
                                style={{ width: 70, padding: "4px 6px", opacity: !canEdit ? 0.7 : 1, cursor: !canEdit ? "not-allowed" : "text" }}
                                disabled={!canEdit}
                              />
                            ) : (
                              `₵${item.unitPrice}`
                            )}
                          </td>
                          <td className="ob-cart-total">₵{item.total}</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="ob-cart-remove"
                              onClick={() => removeItem(idx)}
                              aria-label="Remove item"
                              disabled={!canEdit}
                              style={{ opacity: !canEdit ? 0.5 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="ob-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="ob-panel-title">
                <Zap size={16} color="#dba96a" /> Order Options
              </div>

              <div>
                <div className="ob-date-label">
                  <Calendar size={12} /> Order Date
                </div>
                <div className="ob-date-wrap">
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => handleDateChange(e.target.value)}
                    onBlur={handleDateBlur}
                    placeholder="DD/MM/YYYY or today"
                    className="ob-input ob-date-text"
                    disabled={!canEdit}
                    style={{ opacity: !canEdit ? 0.7 : 1, cursor: !canEdit ? "not-allowed" : "text" }}
                  />
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => {
                      setOrderDate(e.target.value);
                      setDateInput(e.target.value);
                    }}
                    className="ob-date-picker"
                    disabled={!canEdit}
                    style={{ opacity: !canEdit ? 0.7 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}
                  />
                  <Calendar size={16} className="ob-date-icon" />
                </div>
              </div>

              <label className="ob-option-row" style={{ opacity: !canEdit ? 0.6 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}>
                <span className="ob-option-label">Use Current Service Prices</span>
                <input
                  type="checkbox"
                  checked={useCurrentPricing}
                  onChange={(e) => setUseCurrentPricing(e.target.checked)}
                  className="ob-option-input"
                  disabled={!canEdit}
                />
              </label>
              {!useCurrentPricing && (
                <div className="ob-option-hint">
                  <Lightbulb size={12} />
                  Enter custom prices per item in the cart
                </div>
              )}

              <label className="ob-option-row" style={{ opacity: !canEdit ? 0.6 : 1, cursor: !canEdit ? "not-allowed" : "pointer" }}>
                <span className="ob-option-label">
                  Express Service (+₵10/item)
                </span>
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="ob-option-input"
                  disabled={!canEdit}
                />
              </label>

              <div style={{ opacity: !canEdit ? 0.6 : 1 }}>
                <div style={{ fontSize: 11, color: "#556070", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Delivery Fee
                </div>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="ob-input ob-input-number"
                  disabled={!canEdit}
                  style={{ cursor: !canEdit ? "not-allowed" : "text" }}
                />
              </div>

              <div style={{ opacity: !canEdit ? 0.6 : 1 }}>
                <div style={{ fontSize: 11, color: "#556070", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Discount (%)
                </div>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="ob-input ob-input-number"
                  disabled={!canEdit}
                  style={{ cursor: !canEdit ? "not-allowed" : "text" }}
                />
              </div>

              <div style={{ opacity: !canEdit ? 0.6 : 1 }}>
                <div style={{ fontSize: 11, color: "#556070", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Amount Paid
                </div>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="ob-input ob-input-number"
                  disabled={!canEdit}
                  style={{
                    borderColor: balance > 0 ? "rgba(248, 113, 113, 0.2)" : "rgba(52, 211, 153, 0.2)",
                    cursor: !canEdit ? "not-allowed" : "text"
                  }}
                />
              </div>

              <div style={{ opacity: !canEdit ? 0.6 : 1 }}>
                <div style={{ fontSize: 11, color: "#556070", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notes
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="ob-input ob-textarea"
                  disabled={!canEdit}
                  style={{ cursor: !canEdit ? "not-allowed" : "text" }}
                />
              </div>
            </div>

            <div className="ob-totals">
              <div className="ob-total-row secondary">
                <span>Subtotal</span>
                <span className="ob-total-mono">₵{subtotal.toFixed(2)}</span>
              </div>
              {expressSurcharge > 0 && (
                <div className="ob-total-row gold">
                  <span>Express Surcharge</span>
                  <span className="ob-total-mono">
                    +₵{expressSurcharge.toFixed(2)}
                  </span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="ob-total-row secondary">
                  <span>Delivery</span>
                  <span className="ob-total-mono">
                    +₵{deliveryFee.toFixed(2)}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="ob-total-row emerald">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="ob-total-mono">
                    -₵{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="ob-total-divider" />
              <div className="ob-total-final">
                <span>TOTAL DUE</span>
                <span className="ob-total-mono">₵{totalDue.toFixed(2)}</span>
              </div>
              <div className={`ob-total-balance ${balance > 0 ? "ember" : "emerald"}`}>
                <span>BALANCE</span>
                <span className="ob-total-mono">₵{balance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
};

export default OrderBuilder;