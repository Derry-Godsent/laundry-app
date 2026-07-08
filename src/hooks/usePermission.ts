import { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";
import { getUserPermission, PermissionLevel } from "../lib/permissions";

export const usePermission = (path: string) => {
  const [permission, setPermission] = useState<PermissionLevel>('view');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            setPermission('view');
            setLoading(false);
          }
          return;
        }

        // Query staff table directly. staff.id is guaranteed to match auth.users.id
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (staffError) {
          console.warn("Staff role fetch error:", staffError);
        }

        const role = staffData?.role?.toLowerCase() || "staff";
        const perm = getUserPermission(path, role);
        
        if (isMounted) {
          setPermission(perm);
          setLoading(false);
        }
      } catch (err) {
        console.error("Permission check failed:", err);
        if (isMounted) {
          setPermission('view');
          setLoading(false);
        }
      }
    };

    checkPermission();

    return () => { isMounted = false; };
  }, [path]);

  return { permission, loading, canEdit: permission === 'edit' };
};