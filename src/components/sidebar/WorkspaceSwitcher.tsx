import { useState, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import "./WorkspaceSwitcher.css";

export const WorkspaceSwitcher = () => {
  const [branchName, setBranchName] = useState("Chapman Prestige Limited");

  useEffect(() => {
    const fetchBranch = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("name")
        .eq("is_active", true)
        .single();

      if (!error && data?.name) {
        setBranchName(data.name);
      }
    };
    fetchBranch();
  }, []);

  return (
    <div className="ws-switcher">
      <div className="ws-icon">
        <Building2 size={16} />
      </div>
      <div className="ws-info">
        <div className="ws-name">{branchName}</div>
      </div>
      <ChevronDown size={16} className="rotate" />
    </div>
  );
};