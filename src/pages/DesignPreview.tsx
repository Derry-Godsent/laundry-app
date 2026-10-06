import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, CalendarDays, Check, CheckCircle2, ChevronLeft, ClipboardList,
  Clock, DollarSign, Inbox, LayoutDashboard, Package, Plus, RefreshCw, Search, Shield,
  Settings, Smartphone, Sparkles, Users, X,
} from "lucide-react";
import {
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Sparkline,
  StatTile,
  StatusPill,
} from "../components/ui";
import type { PillTone } from "../components/ui";
import "./DesignPreview.css";

/* ───────────────────────────────────────────────────────────────────────────
   DESIGN PREVIEW
   A credential-free walkthrough of the redesigned staff console: the shell, the
   dashboard grid, the Mobile Requests queue and the component vocabulary — all
   rendered from sample records so nothing here touches Supabase.

   It exists so the redesign can be reviewed (and screenshotted) before anyone
   signs in. Delete this page and its `/preview` route once the redesign has
   been signed off in production.
   ─────────────────────────────────────────────────────────────────────────── */

const SAMPLE_STATS = [
  { label: "Total Orders", value: "1,248", accent: "var(--brand-500)", icon: <ClipboardList size={19} />, delta: { value: 12, label: "18 recorded today" }, spark: [4, 6, 5, 9, 7, 11, 10, 14] },
  { label: "In Progress", value: "37", accent: "var(--info-500)", icon: <Clock size={19} />, meta: "9 still awaiting review", spark: [3, 5, 4, 6, 5, 7, 6, 8] },
  { label: "Completed Today", value: "14", accent: "var(--ok-500)", icon: <CheckCircle2 size={19} />, delta: { value: -4, label: "against yesterday" }, spark: [8, 7, 9, 6, 8, 7, 6, 5] },
  { label: "Revenue Today", value: "₵6,420", accent: "var(--gold-500)", icon: <DollarSign size={19} />, delta: { value: 23, label: "₵1,180 against yesterday" }, spark: [2, 4, 3, 6, 5, 8, 9, 12] },
];

const SAMPLE_WORKFLOW = [
  { label: "Received & Sorted", value: 42, count: 41, color: "var(--brand-500)" },
  { label: "Washing", value: 26, count: 25, color: "var(--info-500)" },
  { label: "Ironing", value: 18, count: 17, color: "var(--gold-500)" },
  { label: "Ready for Delivery", value: 9, count: 9, color: "var(--ok-500)" },
  { label: "Delivered", value: 5, count: 5, color: "var(--violet-500)" },
];

const SAMPLE_QUEUE = [
  { id: "8f21c4a0", name: "Akosua Mensah", status: "New", tone: "brand" as PillTone, date: "Fri, Oct 9", items: 12, total: "₵420.00", express: true },
  { id: "1c90be73", name: "Kwame Boateng", status: "Reviewing", tone: "warn" as PillTone, date: "Sat, Oct 10", items: 6, total: "₵185.00", express: false },
  { id: "44d7a192", name: "Efua Sarpong", status: "Waiting for client", tone: "info" as PillTone, date: "Mon, Oct 12", items: 21, total: "₵780.00", express: false },
  { id: "92be05f1", name: "Yaw Adjei", status: "Approved", tone: "ok" as PillTone, date: "Tue, Oct 13", items: 4, total: "₵96.00", express: false },
];

const PILL_TONES: PillTone[] = ["neutral", "brand", "gold", "ok", "warn", "bad", "info", "violet"];

const NAV_SAMPLE = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, badge: undefined as number | undefined },
  { icon: Package, label: "Orders", badge: 1248 },
  { icon: Inbox, label: "Mobile Requests", badge: 5 },
  { icon: Sparkles, label: "Service Requests", badge: 2 },
  { icon: Users, label: "Staff" },
  { icon: Shield, label: "Security" },
];

export const DesignPreview = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const [view, setView] = useState<"active" | "waiting" | "confirmed">("active");
  const [selected, setSelected] = useState<string | null>(SAMPLE_QUEUE[0].id);

  const activeQueue = SAMPLE_QUEUE.filter((row) => {
    if (view === "active") return row.tone === "brand" || row.tone === "warn";
    if (view === "waiting") return row.tone === "info";
    return row.tone === "ok";
  });

  return (
    <div className="preview-page">
      <div className="preview-note">
        <Banner tone="warn" title="Design preview — sample data only">
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
              <div className="brand">
                <span className="brand__mark">CP</span>
                <span className="brand__text">
                  <strong>Chapman Prestige</strong>
                  <small>Operations console</small>
                </span>
              </div>
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
                title="Chapman Prestige"
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
                    delta={stat.delta}
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
                      { label: "Staff", tone: "violet", icon: <Shield size={19} /> },
                      { label: "App Ideas", tone: "gold", icon: <Sparkles size={19} /> },
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
            <CardHeader title="Needs action" subtitle="Requests waiting for Chapman to review, confirm or decline" actions={<span className="tag-count">{activeQueue.length}</span>} />
            <CardBody tight className="mr-list-body">
              {activeQueue.length === 0 ? (
                <EmptyState icon={<ClipboardList size={20} />} title="No requests in this view" message="Sample view is empty — switch to another view above." />
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
                        {row.express ? <StatusPill tone="gold">Express</StatusPill> : null}
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
                  <span className="mr-detail-eyebrow">Laundry request · #8f21c4a0</span>
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
                    { label: "Estimated total", value: "₵420.00", icon: <ClipboardList size={15} /> },
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
                subtitle="Confirm uses the client's selected date automatically. Propose a date only when Chapman must offer a different option."
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

      {/* ── Components ────────────────────────────────────────────────── */}
      <section className="preview-section">
        <h2 className="preview-heading">3 · The component vocabulary</h2>
        <p className="preview-lede">
          Every page is built from these pieces, so a status, a button or an empty state can never
          drift between screens.
        </p>

        <div className="preview-gallery">
          <Card>
            <CardHeader title="Buttons" subtitle="Primary, secondary, ghost, dangerous and gold" />
            <CardBody className="preview-row">
              <Button variant="primary" leadingIcon={<Plus size={16} />}>New Order</Button>
              <Button variant="secondary">Refresh</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Decline</Button>
              <Button variant="ok">Confirm date</Button>
              <Button variant="gold">Upgrade</Button>
              <Button variant="secondary" iconOnly aria-label="Icon only"><Search size={16} /></Button>
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
              <Banner tone="ok" title="Client date approved">It remains in Approved work for the next Chapman step.</Banner>
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
                      { id: "CH-10482", client: "Akosua Mensah", status: "Washing", tone: "info" as PillTone, total: "₵420.00" },
                      { id: "CH-10481", client: "Yaw Adjei", status: "Delivered", tone: "ok" as PillTone, total: "₵96.00" },
                      { id: "CH-10480", client: "Walk-in", status: "Pending", tone: "brand" as PillTone, total: "₵185.00" },
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

      <p className="preview-footnote">
        <Sparkles size={13} /> Sample data · <button className="preview-link" onClick={() => navigate("/login")}>sign in to use the real console</button>
      </p>
    </div>
  );
};

export default DesignPreview;
