import { useState, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import "./WorkspaceSwitcher.css";

export const WorkspaceSwitcher = () => {
  const [branchName, setBranchName] = useState("Chapman Prestige Limited");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        let query = supabase
          .from("branches")
          .select("id, name")
          .eq("is_active", true);

        if (userId) {
          const { data: staffData } = await supabase
            .from("staff")
            .select("branch_id")
            .eq("id", userId)
            .maybeSingle();

          if (staffData?.branch_id) {
            query = query.eq("id", staffData.branch_id);
          }
        }

        const { data, error: fetchError } = await query;

        if (!isMounted) return;

        if (fetchError) {
          console.error("Failed to fetch branches:", fetchError.message);
          setError("Could not load branch data");
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setBranches(data);
          setBranchName(data[0].name);
        } else {
          setBranches([]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error fetching branches:", err);
        setError("Something went wrong");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBranches();

    const channel = supabase
      .channel("workspace-branches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branches" },
        () => fetchBranches()
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelect = (name: string) => {
    setBranchName(name);
    setIsOpen(false);
  };

  return (
    <div className="ws-switcher">
      <button
        className="ws-trigger"
        onClick={() => branches.length > 1 && setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={loading || branches.length <= 1}
      >
        <div className="ws-icon">
          <Building2 size={16} />
        </div>
        <div className="ws-info">
          {loading ? (
            <div className="ws-skeleton" />
          ) : error ? (
            <div className="ws-name ws-error">{branchName}</div>
          ) : (
            <div className="ws-name">{branchName}</div>
          )}
        </div>
        {branches.length > 1 && (
          <ChevronDown
            size={16}
            className={`ws-chevron ${isOpen ? "open" : ""}`}
          />
        )}
      </button>

      {isOpen && branches.length > 1 && (
        <ul className="ws-dropdown" role="listbox">
          {branches.map((branch) => (
            <li
              key={branch.id}
              className={`ws-option ${branch.name === branchName ? "active" : ""}`}
              onClick={() => handleSelect(branch.name)}
              role="option"
              aria-selected={branch.name === branchName}
            >
              {branch.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};