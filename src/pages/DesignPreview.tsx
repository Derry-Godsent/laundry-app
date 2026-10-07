import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "../components/brand/BrandMark";
import {
  AlertCircle, ArrowRight, BarChart3, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  ClipboardList, Clock, DollarSign, FileText, Inbox, LayoutDashboard, LayoutGrid, List,
  MessageSquareText, Package, Phone, Plus, RefreshCw, Search, Shield, Settings, Smartphone,
  Trash2, Users, X,
} from "lucide-react";
import {
  ActionBar,
  Avatar,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DetailView,
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingRows,
  Modal,
  RecordList,
  RecordRow,
  PageHeader,
  SegmentedControl,
  Sparkline,
  StatTile,
  StatusPill,
} from "../components/ui";
import type { PillTone } from "../components/ui";
import "./DesignPreview.css";
import "./Orders.css";

/* ───────────────────────────────────────────────────────────────────────────
   DESIGN PREVIEW
   A credential-free walkthrough of the redesigned staff console: the shell, the
   dashboard grid, the Mobile Requests queue, the order book and the component
   vocabulary, all rendered from sample records so nothing here touches Supabase.

   It exists so the redesign can be reviewed (and screenshotted) before anyone
   signs in. Delete this page and its `/preview` route once the redesign has
   been signed off in production.
   ─────────────────────────────────────────────────────────────────────────── */

const SAMPLE_STATS = [
  { label: "Total Orders", value: "1,248", role: "hero" as const, accent: "var(--brand-500)", icon: <ClipboardList size={19} />, meta: "18 recorded today, 12% ahead of yesterday", spark: [4, 6, 5, 9, 7, 11, 10, 14] },
  { label: "In Progress", value: "37", accent: "var(--info-500)", icon: <Clock size={19} />, meta: "9 still awaiting review", spark: [3, 5, 4, 6, 5, 7, 6, 8] },
  { label: "Completed Today", value: "14", accent: "var(--ok-500)", icon: <CheckCircle2 size={19} />, meta: "4% behind yesterday", spark: [8, 7, 9, 6, 8, 7, 6, 5] },
  { label: "Revenue Today", value: "GH\u20b56,420", accent: "var(--brand-500)", icon: <DollarSign size={19} />, meta: "GH\u20b51,180 ahead of yesterday", spark: [2, 4, 3, 6, 5, 8, 9, 12] },
];

const SAMPLE_WORKFLOW = [
  { label: "Received & Sorted", value: 42, count: 41, color: "var(--stage-received)" },
  { label: "Washing", value: 26, count: 25, color: "var(--stage-washing)" },
  { label: "Ironing", value: 18, count: 17, color: "var(--stage-ironing)" },
  { label: "Ready for Delivery", value: 9, count: 9, color: "var(--stage-ready)" },
  { label: "Delivered", value: 5, count: 5, color: "var(--stage-completed)" },
];

const SAMPLE_QUEUE = [
  { id: "8f21c4a0", name: "Akosua Mensah", status: "New", tone: "brand" as PillTone, date: "Fri, Oct 9", items: 12, total: "GH₵420.00", express: true },
  { id: "1c90be73", name: "Kwame Boateng", status: "Reviewing", tone: "warn" as PillTone, date: "Sat, Oct 10", items: 6, total: "GH₵185.00", express: false },
  { id: "44d7a192", name: "Efua Sarpong", status: "Waiting for client", tone: "info" as PillTone, date: "Mon, Oct 12", items: 21, total: "GH₵780.00", express: false },
  { id: "92be05f1", name: "Yaw Adjei", status: "Approved", tone: "ok" as PillTone, date: "Tue, Oct 13", items: 4, total: "GH₵96.00", express: false },
];

/* The order book sample: enough rows to show the frame, the stage ramp and the
   payment tones. Stage colours come from the shared workflow ramp in tokens.css. */
const SAMPLE_ORDERS = [
  { id: "CH-10482", customer: "Akosua Mensah", phone: "+233 24 551 0198", service: "Laundry", items: 12, amount: 420, stage: "washing", payment: "pending", date: "06/10/2026" },
  { id: "CH-10481", customer: "Yaw Adjei", phone: "+233 20 774 2210", service: "Laundry", items: 4, amount: 96, stage: "completed", payment: "paid", date: "06/10/2026" },
  { id: "CH-10480", customer: "Walk-in", phone: "+233 53 413 4809", service: "Cleaning", items: 9, amount: 185, stage: "queued", payment: "partial", date: "05/10/2026" },
  { id: "CH-10479", customer: "Efua Sarpong", phone: "+233 26 330 8811", service: "Fumigation", items: 3, amount: 780, stage: "ready", payment: "paid", date: "05/10/2026" },
  { id: "CH-10478", customer: "Kwame Boateng", phone: "+233 27 118 4402", service: "Car Detailing", items: 1, amount: 250, stage: "delivery", payment: "pending", date: "04/10/2026" },
  { id: "CH-10477", customer: "Abena Osei", phone: "+233 55 902 3317", service: "Laundry", items: 7, amount: 210, stage: "ironing", payment: "paid", date: "04/10/2026" },
];

const PREVIEW_STAGE: Record<string, { label: string; color: string }> = {
  queued: { label: "In Queue", color: "var(--stage-queued)" },
  washing: { label: "Washing", color: "var(--stage-washing)" },
  ironing: { label: "Ironing", color: "var(--stage-ironing)" },
  ready: { label: "Ready", color: "var(--stage-ready)" },
  delivery: { label: "Out for Delivery", color: "var(--stage-delivery)" },
  completed: { label: "Completed", color: "var(--stage-completed)" },
};

const PREVIEW_PAY: Record<string, { label: string; tone: PillTone }> = {
  paid: { label: "Paid", tone: "ok" },
  pending: { label: "Pending", tone: "warn" },
  partial: { label: "Partial", tone: "bad" },
};

/* ───────────────────────────────────────────────────────────────────────────
   WIDTH PROBE
   Phone layouts cannot be judged in a wide desktop window: the app's breakpoints
   are media queries, so they only fire when the *viewport* is narrow. This
   renders the sample below inside an iframe of a chosen width and copies the
   console stylesheets into it, so the real 320/360/390/430 layouts are what you
   are looking at, not a zoomed-out imitation.
   ─────────────────────────────────────────────────────────────────────────── */
const PROBE_WIDTHS = [320, 360, 390, 430, 768];

const WidthProbe = ({ children }: { children: ReactNode }) => {
  const [width, setWidth] = useState(390);
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!frame) return;
    const doc = frame.contentDocument;
    if (!doc) return;

    /* Copy every stylesheet the console is using: in dev Vite injects <style>
       tags, in a build it emits <link> tags, so both are carried over. */
    doc.head.innerHTML = "";
    document
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => doc.head.appendChild(node.cloneNode(true)));

    doc.documentElement.style.setProperty("color-scheme", "dark");
    doc.body.style.margin = "0";
    doc.body.style.background = "var(--ink-base)";
    setBody(doc.body);
  }, [frame]);

  /* If the frame cannot be scripted, show the sample inline rather than
     nothing: a preview that silently renders empty is worse than a wide one. */
  useEffect(() => {
    if (body) return;
    const timer = window.setTimeout(() => {
      if (!body) setFallback(true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [body]);

  return (
    <div className="probe">
      <div className="probe__bar">
        <span className="probe__label">Check a width</span>
        {PROBE_WIDTHS.map((value) => (
          <button
            key={value}
            type="button"
            className={`probe__btn ${width === value ? "is-active" : ""}`}
            onClick={() => setWidth(value)}
            aria-pressed={width === value}
          >
            {value}px
          </button>
        ))}
        <span className="probe__hint">
          The real page at that viewport width: phone breakpoints fire inside the frame.
        </span>
      </div>

      <iframe
        ref={setFrame}
        title={`App preview at ${width}px wide`}
        className="probe__frame"
        style={{ width, maxWidth: "100%" }}
        srcDoc="<!doctype html><html><head></head><body></body></html>"
      />

      {body ? createPortal(children, body) : null}
      {fallback && !body ? (
        <>
          <div className="probe__warn">
            This browser would not let the preview script the frame, so the sample is shown at full
            width instead. Use a device emulator to check the phone layout.
          </div>
          <div className="pattern-demo">{children}</div>
        </>
      ) : null}
    </div>
  );
};

const PILL_TONES: PillTone[] = ["neutral", "brand", "accent", "ok", "warn", "bad", "info"];

const NAV_SAMPLE = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, badge: undefined as number | undefined },
  { icon: Package, label: "Orders", badge: 1248 },
  { icon: Inbox, label: "Mobile Requests", badge: 5 },
  { icon: MessageSquareText, label: "Service Requests", badge: 2 },
  { icon: Users, label: "Staff" },
  { icon: Shield, label: "Security" },
];

export const DesignPreview = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const [view, setView] = useState<"active" | "waiting" | "confirmed">("active");
  const [selected, setSelected] = useState<string | null>(SAMPLE_QUEUE[0].id);
  const [ordQuery, setOrdQuery] = useState("");
  const [ordStage, setOrdStage] = useState("all");
  const [patternFilter, setPatternFilter] = useState("needs-action");
  const [selectedRecord, setSelectedRecord] = useState<string | null>("8f21c4a0");
  const [patternModal, setPatternModal] = useState(false);
  const [patternConfirm, setPatternConfirm] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);

  const visibleOrders = SAMPLE_ORDERS.filter((row) => {
    const needle = ordQuery.trim().toLowerCase();
    const matchesText = !needle
      || row.id.toLowerCase().includes(needle)
      || row.customer.toLowerCase().includes(needle)
      || row.phone.toLowerCase().includes(needle);
    const matchesStage = ordStage === "all" || row.stage === ordStage;
    return matchesText && matchesStage;
  });

  const activeQueue = SAMPLE_QUEUE.filter((row) => {
    if (view === "active") return row.tone === "brand" || row.tone === "warn";
    if (view === "waiting") return row.tone === "info";
    return row.tone === "ok";
  });

  return (
    <div className="preview-page">
      <div className="preview-note">
        <Banner tone="warn" title="Design preview: sample data only">
          This page renders the redesigned staff console with made-up records so the design can be
          reviewed without signing in. Nothing here reads from Supabase, and no action changes real
          work. <button className="preview-link" onClick={() => navigate("/login")}>Go to sign in</button>
        </Banner>
      </div>

      {/* ── The shell, as staff see it ─────────────────────────────────── */}
      <section className="preview-section">
        <h2 className="preview-heading">1 · The console shell</h2>
        <p className="preview-lede">
          Grouped navigation with live counts, a quiet topbar for context and alerts, and a content
          column that holds one clear page header. The sidebar collapses to a 76px rail and becomes a
          slide-over below 1024px.
        </p>

        <div className="shell-demo">
          <aside className="sidebar expanded shell-demo__sidebar">
            <div className="sidebar-header">
              <BrandMark size="md" withText />
              <span className="sidebar-icon-btn" aria-hidden="true"><ChevronLeft size={16} /></span>
            </div>
            <nav className="sidebar-nav">
              <div className="nav-section">
                <span className="nav-section__label">Work</span>
                {NAV_SAMPLE.map((item) => (
                  <span key={item.label} className={`nav-item ${item.active ? "active" : ""}`}>
                    <span className="nav-icon"><item.icon size={17} /></span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </span>
                ))}
              </div>
            </nav>
            <div className="sidebar-footer">
              <span className="sidebar-role">Administrator</span>
            </div>
          </aside>

          <div className="shell-demo__content">
            <div className="topbar shell-demo__topbar">
              <div className="topbar-left">
                <div className="breadcrumbs">
                  <span className="breadcrumb-item"><span className="breadcrumb-current">Dashboard</span></span>
                </div>
              </div>
              <div className="topbar-right">
                <div className="command-trigger">
                  <Search size={16} />
                  <span className="command-placeholder">Search pages, orders, or actions…</span>
                  <kbd className="command-key">Ctrl K</kbd>
                </div>
                <span className="icon-btn" aria-hidden="true">
                  <Inbox size={17} />
                  <span className="notification-badge">3</span>
                </span>
                <span className="btn btn--primary"><Plus size={16} /> New Order</span>
              </div>
            </div>

            <div className="shell-demo__body">
              <PageHeader
                eyebrow={<><span className="live-dot" /> Live operations</>}
                title="Chapman Prestige Limited"
                subtitle="Tuesday, 6 October 2026 · every number below is read live from the records the office works on."
                actions={
                  <>
                    <Button variant="secondary" iconOnly aria-label="Refresh"><RefreshCw size={16} /></Button>
                    <SegmentedControl<"week" | "month" | "year">
                      ariaLabel="Chart range"
                      value={range}
                      onChange={setRange}
                      options={[{ value: "week", label: "7D" }, { value: "month", label: "30D" }, { value: "year", label: "1Y" }]}
                    />
                    <Button variant="primary" leadingIcon={<Plus size={16} />}>New Order</Button>
                  </>
                }
              />

              <section className="stat-grid">
                {SAMPLE_STATS.map((stat) => (
                  <StatTile
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    accent={stat.accent}
                    role={stat.role}
                    meta={stat.meta}
                    sparkline={<Sparkline data={stat.spark} color={stat.accent} />}
                  />
                ))}
              </section>

              <section className="dash-bot-grid">
                <Card>
                  <CardHeader title="Live workflow" subtitle="Where the work sits right now" />
                  <CardBody className="workflow-list">
                    {SAMPLE_WORKFLOW.map((stage) => (
                      <div className="live-bar" key={stage.label}>
                        <div className="live-bar__head">
                          <span className="live-bar__label">{stage.label}</span>
                          <span className="live-bar__right">
                            <span className="live-bar__count">{stage.count}</span>
                            <span className="live-bar__pct">{stage.value}%</span>
                          </span>
                        </div>
                        <div className="live-bar__track">
                          <div className="live-bar__fill" style={{ width: `${stage.value}%`, background: stage.color }} />
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Latest activity" subtitle="The newest records as they were entered" />
                  <CardBody tight className="act-list">
                    {[
                      { text: "Order CH-10482", meta: "Washing · Akosua Mensah", time: "09:41" },
                      { text: "Order CH-10481", meta: "Delivered · Yaw Adjei", time: "09:22" },
                      { text: "Order CH-10480", meta: "Pending · Walk-in", time: "08:57" },
                    ].map((row, i) => (
                      <div className="act-item" key={row.text} style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="act-pip" style={{ background: "var(--brand-500)" }} />
                        <div className="act-body">
                          <div className="act-row">
                            <span className="act-text">{row.text}</span>
                            <span className="act-time">{row.time}</span>
                          </div>
                          <span className="act-meta">{row.meta}</span>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Quick actions" subtitle="The tasks the office repeats most" />
                  <CardBody className="qa-grid">
                    {[
                      { label: "New Order", tone: "brand", icon: <ClipboardList size={19} /> },
                      { label: "Mobile Requests", tone: "ok", icon: <Package size={19} /> },
                      { label: "Reports", tone: "info", icon: <BarChart3 size={19} /> },
                      { label: "Staff", tone: "accent", icon: <Shield size={19} /> },
                      { label: "App Ideas", tone: "warn", icon: <MessageSquareText size={19} /> },
                      { label: "Settings", tone: "neutral", icon: <Settings size={19} /> },
                    ].map((action) => (
                      <span key={action.label} className={`qa-btn qa-btn--${action.tone}`}>
                        <span className="qa-icon">{action.icon}</span>
                        <span className="qa-label">{action.label}</span>
                        <ArrowRight size={14} className="qa-arrow" />
                      </span>
                    ))}
                  </CardBody>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* ── The queue ─────────────────────────────────────────────────── */}
      <section className="preview-section">
        <h2 className="preview-heading">2 · The Mobile Requests queue</h2>
        <p className="preview-lede">
          One list, one detail panel, one decision panel. The view control carries live counts, every
          card states the client's chosen date and what is still owed, and the decision panel is the
          only place a record changes state.
        </p>

        <SegmentedControl<"active" | "waiting" | "confirmed">
          ariaLabel="Request views"
          value={view}
          onChange={setView}
          options={[
            { value: "active", label: "Needs action", count: 2 },
            { value: "waiting", label: "Waiting for client", count: 1 },
            { value: "confirmed", label: "Approved work", count: 1 },
          ]}
          className="mr-views"
        />

        <div className="mr-workspace">
          <Card className="mr-list-panel">
            <CardHeader title="Needs action" subtitle="Requests waiting for review, confirmation or a decision" actions={<span className="tag-count">{activeQueue.length}</span>} />
            <CardBody tight className="mr-list-body">
              {activeQueue.length === 0 ? (
                <EmptyState icon={<ClipboardList size={20} />} title="No requests in this view" message="Sample view is empty. Switch to another view above." />
              ) : (
                <div className="mr-list">
                  {activeQueue.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className={`mr-request ${selected === row.id ? "is-selected" : ""}`}
                      onClick={() => setSelected(row.id)}
                    >
                      <div className="mr-request__top">
                        <span className="mr-request__id">#{row.id}</span>
                        <StatusPill tone={row.tone} dot>{row.status}</StatusPill>
                        {row.express ? <StatusPill tone="warn">Express</StatusPill> : null}
                      </div>
                      <div className="mr-request__customer">
                        <span className="mr-avatar">{row.name.charAt(0)}</span>
                        <span className="mr-request__who">
                          <strong>{row.name}</strong>
                          <small>Phone verified</small>
                        </span>
                      </div>
                      <div className="mr-request__meta">
                        <span><CalendarDays size={13} /> {row.date}</span>
                        <span><ClipboardList size={13} /> {row.items} items</span>
                        <strong>{row.total}</strong>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <aside className="mr-detail">
            <Card className="mr-detail-card">
              <div className="mr-detail-head">
                <div>
                  <span className="mr-detail-eyebrow">Laundry request · MR-4C1A08</span>
                  <h2>Akosua Mensah</h2>
                  <p>Received 6 Oct, 08:14</p>
                </div>
                <div className="mr-detail-head__actions">
                  <StatusPill tone="brand" dot>New</StatusPill>
                  <Button variant="ghost" size="sm" iconOnly aria-label="Close details"><X size={16} /></Button>
                </div>
              </div>
              <CardBody>
                <div className="meta-grid">
                  {[
                    { label: "Client's preferred date", value: "Fri, Oct 9", icon: <CalendarDays size={15} /> },
                    { label: "Collection area", value: "East Legon, Accra", icon: <Package size={15} /> },
                    { label: "Estimated total", value: "GH₵420.00", icon: <ClipboardList size={15} /> },
                    { label: "Pickup window", value: "08:00 – 11:00", icon: <Clock size={15} /> },
                  ].map((item) => (
                    <div className="meta-item" key={item.label}>
                      <span className="meta-item__icon">{item.icon}</span>
                      <div>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="mr-decision">
              <CardHeader
                title="Staff decision"
                subtitle="Confirm uses the client's selected date automatically. Propose a date only when a different option is needed."
              />
              <CardBody className="mr-decision-body">
                <label className="field">
                  <span className="field__label">Status</span>
                  <select className="select" defaultValue="confirm">
                    <option value="propose">Propose a date</option>
                    <option value="confirm">Confirm client date</option>
                    <option value="decline">Decline request</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Note for customer</span>
                  <textarea className="textarea" rows={3} placeholder="Add a helpful update or next step" />
                </label>
                <Button variant="primary" block leadingIcon={<Check size={16} />}>Send update</Button>
              </CardBody>
            </Card>
          </aside>
        </div>
      </section>

      {/* ── The order book ────────────────────────────────────────────── */}
      <section className="preview-section">
        <h2 className="preview-heading">3 · The order book</h2>
        <p className="preview-lede">
          The table screens share one frame: the page owns the viewport, the title, filters and
          pagination stay pinned, and only the list scrolls. Under 640px the header row gives way and
          each record becomes a labelled card, so no column is ever hidden behind a sideways scroll.
        </p>

        <WidthProbe>
          <div className="table-page preview-table">
            <div className="table-page__head">
            <PageHeader
              eyebrow={<><Package size={13} /> Order book</>}
              title="Orders"
              subtitle="128 total · 37 active · 9 unpaid"
              actions={
                <>
                  <Button variant="secondary" leadingIcon={<RefreshCw size={15} />}>Refresh</Button>
                  <Button leadingIcon={<Plus size={15} />}>New Order</Button>
                </>
              }
            />
          </div>

          <div className="table-page__tools">
            <div className="ord-srch">
              <Search size={13} className="ord-srch__ico" />
              <input
                className="input ord-srch__inp"
                placeholder="Search name or order ID…"
                value={ordQuery}
                onChange={(e) => setOrdQuery(e.target.value)}
                aria-label="Search orders"
              />
              <kbd className="ord-srch__kbd">/</kbd>
            </div>
            <span className="ord-fp-wrap">
              <select className="select ord-fp" value={ordStage} onChange={(e) => setOrdStage(e.target.value)} aria-label="Filter by stage">
                <option value="all">All Statuses</option>
                {Object.entries(PREVIEW_STAGE).map(([key, stage]) => (
                  <option key={key} value={key}>{stage.label}</option>
                ))}
              </select>
            </span>
            <span className="ord-fp-wrap">
              <select className="select ord-fp" aria-label="Filter by service">
                <option value="all">All Services</option>
              </select>
            </span>
            <span className="ord-fp-wrap">
              <select className="select ord-fp" aria-label="Filter by payment">
                <option value="all">All Payments</option>
              </select>
            </span>
            <button type="button" className="ord-ghost">
              <RefreshCw size={15} /> Refresh Data
            </button>
            <div className="ord-vt" role="group" aria-label="Order view">
              <button type="button" className="ord-vt__b is-active" aria-pressed="true" title="List view"><List size={14} /></button>
              <button type="button" className="ord-vt__b" aria-pressed="false" title="Pipeline view"><LayoutGrid size={14} /></button>
            </div>
          </div>

          <div className="table-page__body">
            <div className="table-page__scroll">
              <table className="data-table ord-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Stage</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="is-full">
                        <EmptyState icon={<ClipboardList size={20} />} title="No orders match" message="Clear the search or pick another stage." />
                      </td>
                    </tr>
                  ) : visibleOrders.map((row) => {
                    const stage = PREVIEW_STAGE[row.stage];
                    const pay = PREVIEW_PAY[row.payment];
                    return (
                      <tr key={row.id}>
                        <td data-label="Order" className="ord-id">{row.id}</td>
                        <td data-label="Customer">
                          <div className="ord-cust">
                            <Avatar name={row.customer} size="sm" />
                            <div>
                              <div className="ord-cust__name">{row.customer}</div>
                              <div className="ord-cust__phone">{row.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Service"><StatusPill tone="brand">{row.service}</StatusPill></td>
                        <td data-label="Items" className="ord-num">{row.items}</td>
                        <td data-label="Amount" className="ord-amount">GH₵{row.amount.toLocaleString()}</td>
                        <td data-label="Stage">
                          <span className="ord-stage">
                            <span className="ord-stage__dot" style={{ background: stage.color }} />
                            {stage.label}
                          </span>
                        </td>
                        <td data-label="Payment"><StatusPill tone={pay.tone}>{pay.label}</StatusPill></td>
                        <td data-label="Date" className="ord-dim">{row.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-page__foot">
            <div className="ord-pag">
              <span className="ord-pag__info">
                {visibleOrders.length === 0
                  ? "No results"
                  : `1 to ${visibleOrders.length} of ${visibleOrders.length}`}
              </span>
              <div className="ord-pag__right">
                <Button variant="ghost" size="sm" iconOnly aria-label="Previous page" disabled>
                  <ChevronLeft size={15} />
                </Button>
                <Button variant="ghost" size="sm" iconOnly aria-label="Next page" disabled>
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </div>
          </div>
        </WidthProbe>
      </section>

      {/* ── Components ────────────────────────────────────────────────── */}
      <section className="preview-section">
        <h2 className="preview-heading">4 · The component vocabulary</h2>
        <p className="preview-lede">
          Every page is built from these pieces, so a status, a button or an empty state can never
          drift between screens.
        </p>

        <div className="preview-gallery">
          <Card>
            <CardHeader
              title="Button hierarchy"
              subtitle="One primary per surface. The rest step down: secondary, ghost, then the dangerous one"
            />
            <CardBody className="preview-row">
              <Button variant="primary" leadingIcon={<Plus size={16} />}>New Order</Button>
              <Button variant="secondary">Refresh</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Decline</Button>
            </CardBody>
            <CardBody className="preview-row">
              <Button variant="primary" disabled>Primary, disabled</Button>
              <Button variant="secondary" disabled>Secondary, disabled</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="secondary" iconOnly aria-label="Icon only"><Search size={16} /></Button>
              <Button variant="warn">Warn, reserved</Button>
              <Button variant="ok">Confirm</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Button colour"
              subtitle="Hue says what the button is for, and the level says how loud it is: solid commits, tinted acts. Both are flat colours"
            />
            <CardBody className="preview-row">
              <Button variant="primary" leadingIcon={<Plus size={16} />}>Solid accent</Button>
              <Button variant="ok">Solid confirm</Button>
              <Button variant="warn">Solid caution</Button>
              <Button variant="danger-strong" leadingIcon={<Trash2 size={16} />}>Solid destructive</Button>
            </CardBody>
            <CardBody className="preview-row">
              <Button variant="accent" leadingIcon={<FileText size={16} />}>Accent</Button>
              <Button variant="ok-tint" leadingIcon={<Check size={16} />}>Confirm</Button>
              <Button variant="warn-tint" leadingIcon={<Clock size={16} />}>Needs a date</Button>
              <Button variant="info" leadingIcon={<Phone size={16} />}>Info</Button>
              <Button variant="danger" leadingIcon={<X size={16} />}>Decline</Button>
              <Button variant="secondary">Neutral</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="The tile family"
              subtitle="hero, standard, split, progress, compact. A row says which figure matters most instead of repeating one box"
            />
            <CardBody className="preview-tiles">
              <section className="stat-grid">
                <StatTile role="hero" label="Revenue today" value="GH\u20b56,420" accent="var(--warn-500)" icon={<DollarSign size={17} />}
                  meta="GH\u20b51,180 ahead of yesterday"
                  sparkline={<Sparkline data={[2, 4, 3, 6, 5, 8, 9, 12]} color="var(--warn-500)" />} />
                <StatTile role="split" label="Orders" value="148" accent="var(--brand-500)" icon={<ClipboardList size={17} />}
                  subValues={[{ label: "Collected", value: "96" }, { label: "Awaiting pickup", value: "52" }]} />
                <StatTile role="progress" label="Wash floor" value="37" accent="var(--info-500)" icon={<Clock size={17} />}
                  progress={0.74} progressLabel="74% of today's target" />
              </section>
              <section className="stat-grid preview-tiles">
                <StatTile role="compact" label="Delivered" value="31" accent="var(--ok-500)" />
                <StatTile role="compact" label="Ready" value="9" accent="var(--brand-500)" />
                <StatTile role="compact" label="Overdue" value="3" accent="var(--bad-500)" />
                <StatTile role="compact" label="Express" value="6" accent="var(--warn-500)" />
                <StatTile role="compact" label="Walk-in" value="4" accent="var(--brand-400)" />
              </section>
              <section className="stat-grid preview-tiles">
                <StatTile role="standard" label="Awaiting review" value="12" accent="var(--warn-500)" icon={<AlertCircle size={17} />}
                  meta="Oldest waiting 2 days" />
                <StatTile role="standard" label="Customer replies" value="7" accent="var(--info-500)" icon={<MessageSquareText size={17} />}
                  sparkline={<Sparkline data={[1, 3, 2, 5, 4, 6, 7]} color="var(--info-500)" />} />
                <StatTile role="standard" label="Staff on duty" value="6" accent="var(--brand-400)" icon={<Users size={17} />}
                  meta="2 on the wash floor" />
              </section>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status pills" subtitle="One tone vocabulary across every queue" />
            <CardBody className="preview-row">
              {PILL_TONES.map((tone) => (
                <StatusPill key={tone} tone={tone} dot>{tone}</StatusPill>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Form fields" subtitle="Shared sizing, focus ring and disabled state" />
            <CardBody className="preview-fields">
              <label className="field">
                <span className="field__label">Client</span>
                <input className="input" placeholder="Search the client register" />
                <span className="field__help">Dates and totals use tabular figures so columns line up.</span>
              </label>
              <label className="field">
                <span className="field__label">Proposed service date</span>
                <input className="input" type="date" defaultValue="2026-10-09" />
                <span className="field__error">Choose the proposed service date before saving.</span>
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Feedback & states" subtitle="Banners, empty and loading states" />
            <CardBody className="preview-stack">
              <Banner tone="ok" title="Client date approved">It remains in Approved work for the next step.</Banner>
              <Banner tone="info" title="Waiting for the client">No staff action is needed until the client answers.</Banner>
              <Banner tone="bad" title="Could not load requests">Check the connection and refresh the queue.</Banner>
              <div className="skeleton" style={{ height: 44 }} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Data table" subtitle="Sticky headers, tabular figures" />
            <CardBody>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Order</th><th>Client</th><th>Status</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "CH-10482", client: "Akosua Mensah", status: "Washing", tone: "info" as PillTone, total: "GH₵420.00" },
                      { id: "CH-10481", client: "Yaw Adjei", status: "Delivered", tone: "ok" as PillTone, total: "GH₵96.00" },
                      { id: "CH-10480", client: "Walk-in", status: "Pending", tone: "brand" as PillTone, total: "GH₵185.00" },
                    ].map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.id}</strong></td>
                        <td>{row.client}</td>
                        <td><StatusPill tone={row.tone}>{row.status}</StatusPill></td>
                        <td className="tabular">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Empty state" subtitle="Plain words, one clear next step" />
            <CardBody tight>
              <EmptyState
                icon={<Smartphone size={20} />}
                title="No requests in this view"
                message="New client requests appear here the moment they are submitted."
                action={<Button variant="secondary">Refresh queue</Button>}
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ── Mobile patterns ───────────────────────────────────────────── */}
      <section className="preview-section">
        <h2 className="preview-heading">5 · The mobile patterns</h2>
        <p className="preview-lede">
          The shapes every page composes from. Filter rows and records are shown in the width probe
          because their phone behaviour is the point: filters become one scrollable strip and each
          record becomes a card. The dialog and the confirmation are live buttons.
        </p>

        <WidthProbe>
          <div className="pattern-demo">
            <FilterBar
              search={
                <div className="search-input">
                  <Search size={14} />
                  <input className="input" placeholder="Search requests" aria-label="Search requests" />
                </div>
              }
              end={<SegmentedControl<"all" | "needs"> ariaLabel="View" value="all" onChange={() => {}} options={[{ value: "all", label: "All", count: 12 }]} />}
            >
              {["Needs action", "Waiting for client", "Approved"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`probe__btn ${patternFilter === label ? "is-active" : ""}`}
                  onClick={() => setPatternFilter(label)}
                >
                  {label}
                </button>
              ))}
            </FilterBar>

            <RecordList label="Sample requests">
              {SAMPLE_QUEUE.map((row) => (
                <RecordRow
                  key={row.id}
                  lead={<Avatar name={row.name} size="md" />}
                  title={row.name}
                  subtitle={`#${row.id.slice(0, 8)} · ${row.items} items · ${row.total}`}
                  meta={[
                    <><CalendarDays size={12} /> {row.date}</>,
                    row.express ? <><Package size={12} /> Express</> : null,
                  ].filter(Boolean) as React.ReactNode[]}
                  trail={<StatusPill tone={row.tone}>{row.status}</StatusPill>}
                  selected={selectedRecord === row.id}
                  onClick={() => setSelectedRecord(row.id)}
                />
              ))}
            </RecordList>

            <DetailView
              variant="overlay"
              onClose={() => setSelectedRecord(null)}
              title="Akosua Mensah"
              subtitle="Request MR-4C1A08 · Laundry"
              actions={<StatusPill tone="brand">New</StatusPill>}
              footer={
                <>
                  <Button variant="ghost">Decline</Button>
                  <Button variant="primary" block>Confirm date</Button>
                </>
              }
            >
              <div className="meta-grid">
                <div className="meta-item">
                  <div className="meta-item__icon"><CalendarDays size={15} /></div>
                  <div><small>Preferred date</small><strong>Fri, Oct 9</strong></div>
                </div>
                <div className="meta-item">
                  <div className="meta-item__icon"><Inbox size={15} /></div>
                  <div><small>Items</small><strong>12 pieces</strong></div>
                </div>
                <div className="meta-item">
                  <div className="meta-item__icon"><DollarSign size={15} /></div>
                  <div><small>Estimate</small><strong>GH₵420.00</strong></div>
                </div>
              </div>
            </DetailView>

            <ActionBar note="4 records selected">
              <Button variant="secondary">Export CSV</Button>
              <Button variant="primary" block>Advance stage</Button>
            </ActionBar>
          </div>
        </WidthProbe>

        <div className="preview-gallery">
          <Card>
            <CardHeader title="The dialog" subtitle="Full screen on a phone, centred on a desk" />
            <CardBody className="preview-stack">
              <p className="preview-lede" style={{ margin: 0 }}>
                Escape closes it, the page behind it cannot scroll, and focus stays inside until it
                closes. On a phone it takes the whole screen so the form and the keyboard fit.
              </p>
              <div>
                <Button variant="secondary" onClick={() => setPatternModal(true)}>Open a dialog</Button>
              </div>
              <Modal
                open={patternModal}
                onClose={() => setPatternModal(false)}
                title="Add a client note"
                subtitle="Visible to staff only"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setPatternModal(false)}>Cancel</Button>
                    <span className="modal__spacer" />
                    <Button variant="primary" onClick={() => setPatternModal(false)}>Save note</Button>
                  </>
                }
              >
                <label className="field">
                  <span className="field__label">Note</span>
                  <textarea className="textarea" rows={4} placeholder="What should the next person know?" />
                </label>
              </Modal>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="The confirmation" subtitle="One dialog for every decision" />
            <CardBody className="preview-stack">
              <p className="preview-lede" style={{ margin: 0 }}>
                Delete, archive and stage changes all ask the same way, so staff never have to work
                out whether a prompt is safe.
              </p>
              <div>
                <Button variant="danger" onClick={() => setPatternConfirm(true)}>Delete 3 orders</Button>
              </div>
              <ConfirmDialog
                open={patternConfirm}
                onClose={() => setPatternConfirm(false)}
                onConfirm={() => { setPatternConfirm(false); setConfirmDone(true); }}
                tone="danger"
                title="Delete 3 orders?"
                message="The records leave the order book and cannot be restored from here. Print or export them first if you need a copy."
                confirmLabel="Delete orders"
              />
              {confirmDone ? <Banner tone="ok" title="Confirmed">That is what the real dialog would do next.</Banner> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Loading and error" subtitle="The page keeps its shape" />
            <CardBody className="preview-stack">
              <LoadingRows rows={3} />
              <ErrorState
                message="The orders could not be read. Check the connection and try again."
                onRetry={() => setConfirmDone(false)}
              />
            </CardBody>
          </Card>
        </div>
      </section>

      <p className="preview-footnote">
        <Shield size={13} /> Sample data · <button className="preview-link" onClick={() => navigate("/login")}>sign in to use the real console</button>
      </p>
    </div>
  );
};

export default DesignPreview;
