import { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { getUserPermission, PermissionLevel } from "../lib/permissions";

export const usePermission = (path: string) => {
  const [permission, setPermission] = useState<PermissionLevel>('view');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setPermission('view');
          setLoading(false);
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const role = roleData?.role || "staff";
        setPermission(getUserPermission(path, role));
      } catch (err) {
        console.error("Permission check error:", err);
        setPermission('view');
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [path]);

  return { permission, loading, canEdit: permission === 'edit' };
};