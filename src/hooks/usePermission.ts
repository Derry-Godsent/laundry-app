import { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";

// 📍 Map routes to exact permission keys in your Supabase role_permissions table
const PATH_TO_PERMISSION: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/orders': 'orders',
  '/clients': 'clients',
  '/settings': 'settings',
  '/security': 'security',
  '/payments': 'payments',
  '/receipts': 'receipts',
  '/services': 'services',
  '/staff': 'staff',
  '/new-order': 'new-order'
};

export const usePermission = (path: string) => {
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPermission = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            setPermission('view');
            setLoading(false);
          }
          return;
        }

        // 1️⃣ Get user role
        const { data: staffData } = await supabase
          .from("staff")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = staffData?.role?.toLowerCase() || "staff";

        // 2️⃣ Fetch live permissions from DB
        const { data: rolePerms } = await supabase
          .from("role_permissions")
          .select("permissions")
          .eq("role", role)
          .maybeSingle();

        const allowedPermissions = new Set(rolePerms?.permissions || []);

        // 3️⃣ Match path to DB key with flexible fallback
        const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        const permissionKey = 
          PATH_TO_PERMISSION[normalizedPath] || 
          PATH_TO_PERMISSION[path] || 
          `${path.replace(/\//g, '-')}`;
          
        const canEdit = allowedPermissions.has(permissionKey);
        
        if (isMounted) {
          setPermission(canEdit ? 'edit' : 'view');
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

    loadPermission();

    // 🔄 Listen for Security UI updates
    const handleRefresh = () => loadPermission();
    window.addEventListener('permissions-updated', handleRefresh);

    // 🧹 Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener('permissions-updated', handleRefresh);
    };
  }, [path]);

  return { permission, loading, canEdit: permission === 'edit' };
};