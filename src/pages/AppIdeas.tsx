import { useCallback, useEffect, useMemo, useState } from "react";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PermissionGuard } from "../components/PermissionGuard";
import { usePermission } from "../hooks/usePermission";
import { Banner, EmptyState, LoadingRows } from "../components/ui";
import "./AppIdeas.css";

/**
 * App Ideas
 *
 * Each idea a customer sends from the Chapman app, together with their name and
 * number, so the office can read it and reply to them. The table has existed
 * since the app could send ideas, and until now no staff screen read it, so
 * every idea a customer took the trouble to write landed nowhere.
 *
 * Nothing is deleted here and nothing is rewritten. The office moves an idea
 * along: new, reading, planned, done, or not doing.
 *
 * If the ideas table has not been created in this project yet, the page says so
 * plainly instead of pretending the list is empty.
 */

type IdeaKind = "add" | "remove" | "change";
type IdeaStatus = "new" | "reading" | "planned" | "done" | "declined";

interface AppIdea {
  id: string;
  author_name: string | null;
  phone: string | null;
  kind: IdeaKind;
  idea: string;
  status: IdeaStatus;
  created_at: string;
}

const KIND_META: Record<IdeaKind, { label: string; color: string; background: string }> = {
  add: { label: "Add", color: "#aab4ff", background: "rgba(108,114,243,0.16)" },
  remove: { label: "Remove", color: "#fb9494", background: "rgba(248,113,113,0.14)" },
  change: { label: "Change", color: "#f6c769", background: "rgba(246,199,105,0.14)" },
};

const STATUS_META: Record<IdeaStatus, { label: string; hint: string; color: string; background: string }> = {
  new: { label: "New", hint: "Nobody has read it yet", color: "#aab4ff", background: "rgba(108,114,243,0.16)" },
  reading: { label: "Reading", hint: "Being looked at now", color: "#f6c769", background: "rgba(246,199,105,0.14)" },
  planned: { label: "Planned", hint: "Agreed, waiting its turn", color: "#61d7bc", background: "rgba(97,215,188,0.14)" },
  done: { label: "Done", hint: "Built and in the app", color: "#62dd93", background: "rgba(52,211,153,0.14)" },
  declined: { label: "Not doing", hint: "Explained to the customer", color: "#9aa3b5", background: "rgba(154,163,181,0.13)" },
};

const STATUS_ORDER: IdeaStatus[] = ["new", "reading", "planned", "done", "declined"];

const formatMoment = (value: string) =>
  new Date(value).toLocaleString("en-GH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** A table that does not exist answers with one of these two codes. */
const isMissingTable = (error: { code?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205");

function AppIdeasContent() {
  const { canEdit } = usePermission("/app-ideas");
  const [ideas, setIdeas] = useState<AppIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [filter, setFilter] = useState<IdeaStatus | "all">("new");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: readError } = await supabase
      .from("chapman_app_ideas")
      .select("id, author_name, phone, kind, idea, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (readError) {
      if (isMissingTable(readError)) {
        setNotReady(true);
        setIdeas([]);
      } else {
        setError(`Could not load ideas: ${readError.message}`);
        setIdeas([]);
      }
    } else {
      setNotReady(false);
      setIdeas((data ?? []) as AppIdea[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadIdeas();

    const channel = supabase
      .channel("staff-app-ideas")
      .on("postgres_changes", { event: "*", schema: "public", table: "chapman_app_ideas" }, () => { void loadIdeas(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadIdeas]);

  const counts = useMemo(() => {
    const base: Record<IdeaStatus, number> = { new: 0, reading: 0, planned: 0, done: 0, declined: 0 };
    ideas.forEach((idea) => { base[idea.status] = (base[idea.status] ?? 0) + 1; });
    return base;
  }, [ideas]);

  const visible = useMemo(
    () => (filter === "all" ? ideas : ideas.filter((idea) => idea.status === filter)),
    [ideas, filter],
  );

  const moveIdea = useCallback(async (idea: AppIdea, status: IdeaStatus) => {
    if (!canEdit || idea.status === status) return;
    setSavingId(idea.id);
    setSavedMessage(null);

    const { error: writeError } = await supabase
      .from("chapman_app_ideas")
      .update({ status })
      .eq("id", idea.id);

    if (writeError) {
      setError(`Could not move that idea: ${writeError.message}`);
    } else {
      setIdeas((current) => current.map((row) => (row.id === idea.id ? { ...row, status } : row)));
      setSavedMessage(`Moved to ${STATUS_META[status].label.toLowerCase()}.`);
    }
    setSavingId(null);
  }, [canEdit]);

  return (
    <div className="ai-page">
      <header className="ai-header">
        <div>
          <span className="ai-eyebrow"><Sparkles size={13} /> FROM THE CUSTOMER APP</span>
          <h1>App Ideas</h1>
          <p>
            Every idea a customer sends from the app, with their name and number, so you can
            reply to the person who wrote it. Move an idea along as you decide what to do
            with it.
          </p>
        </div>
        <button className="ai-refresh" onClick={() => { void loadIdeas(); }} disabled={loading}>
          <RefreshCw size={14} className={loading ? "ai-spin" : undefined} /> Refresh
        </button>
      </header>

      {notReady ? (
        <div className="ai-notready">
          <Lightbulb size={22} />
          <h2>Ideas are not switched on in this project yet</h2>
          <p>
            Customers can write ideas in the app, but the place that stores them has not been
            created in this Supabase project, so nothing has been saved yet and there is
            nothing to show here. Run the statement file <strong>docs/customers-birthdays-and-ideas.sql</strong>
            {" "}once, section 5, and ideas will start arriving on this page.
          </p>
        </div>
      ) : (
        <>
          <div className="ai-summary">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                className={`ai-summary-card ${filter === status ? "active" : ""} ${status}`}
                onClick={() => setFilter(status)}
                title={STATUS_META[status].hint}
              >
                <span>{STATUS_META[status].label}</span>
                <strong>{counts[status] ?? 0}</strong>
              </button>
            ))}
            <button className={`ai-summary-card all ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              <span>All ideas</span>
              <strong>{ideas.length}</strong>
            </button>
          </div>

          {savedMessage ? <Banner tone="ok" role="status">{savedMessage}</Banner> : null}
          {error ? <Banner tone="bad" role="alert">{error}</Banner> : null}

          <div className="ai-panel">
            <div className="ai-list-heading">
              <div>
                <h2>{filter === "all" ? "Every idea" : `${STATUS_META[filter].label} ideas`}</h2>
                <p>{filter === "all" ? "Newest first." : STATUS_META[filter].hint}</p>
              </div>
              <span>{visible.length}</span>
            </div>

            {loading ? (
              <LoadingRows rows={4} label="Reading ideas" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={<Lightbulb size={20} />}
                title="Nothing here yet"
                message="The app tells a customer when an idea is sent, so anything sent will appear here by itself."
              />
            ) : (
              <div className="ai-list">
                {visible.map((idea) => (
                  <article key={idea.id} className="ai-idea">
                    <div className="ai-idea-top">
                      <span className="ai-kind" style={{ color: KIND_META[idea.kind]?.color, background: KIND_META[idea.kind]?.background }}>
                        {KIND_META[idea.kind]?.label ?? idea.kind}
                      </span>
                      <span className="ai-status" style={{ color: STATUS_META[idea.status]?.color, background: STATUS_META[idea.status]?.background }}>
                        {STATUS_META[idea.status]?.label ?? idea.status}
                      </span>
                    </div>

                    <p className="ai-text">{idea.idea}</p>

                    <div className="ai-meta">
                      <span>{idea.author_name?.trim() || "Name not given"}</span>
                      <span>{idea.phone?.trim() || "No number"}</span>
                      <span>{formatMoment(idea.created_at)}</span>
                    </div>

                    {canEdit && (
                      <div className="ai-actions">
                        {STATUS_ORDER.map((status) => (
                          <button
                            key={status}
                            className={`ai-move ${idea.status === status ? "current" : ""}`}
                            onClick={() => { void moveIdea(idea, status); }}
                            disabled={savingId === idea.id || idea.status === status}
                          >
                            {STATUS_META[status].label}
                          </button>
                        ))}
                        {savingId === idea.id && <span className="ai-saving">Saving...</span>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export const AppIdeas = () => (
  <PermissionGuard>
    <AppIdeasContent />
  </PermissionGuard>
);

export default AppIdeas;
