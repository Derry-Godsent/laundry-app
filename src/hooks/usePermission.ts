import { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";

// Map paths to permission keys (configure once, never touch again)
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
  '/new-order': 'new-order',
  // Add new paths here only when adding new pages
};

export const usePermission = (path: string) => {
  console.log('🔍 Path received:', path);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
  
const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
const permissionKey = PATH_TO_PERMISSION[normalizedPath] || PATH_TO_PERMISSION[path] || `${path.replace(/\//g, '-')}_access`;

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

        // 1️⃣ Get user's role from staff table
        const { data: staffData } = await supabase
          .from("staff")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = staffData?.role?.toLowerCase() || "staff";


        // 2️⃣ Fetch dynamic permissions for this role from DB
        const { data: rolePerms } = await supabase
          .from("role_permissions")
          .select("permissions")
          .eq("role", role)
          .maybeSingle();

        const allowedPermissions = new Set(rolePerms?.permissions || []);

        // 3️⃣ Determine permission level for this path
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

    // 4️⃣ Listen for Security UI updates (the bridge!)
    const handleRefresh = () => loadPermission();
    window.addEventListener('permissions-updated', handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('permissions-updated', handleRefresh);
    };
  }, [path]);

  return { permission, loading, canEdit: permission === 'edit' };

  // Add inside useEffect, after loadPermission()
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

    // Get role
    const { data: staffData } = await supabase
      .from("staff")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const role = staffData?.role?.toLowerCase() || "staff";

    // Get permissions from DB
    const { data: rolePerms, error: permsError } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("role", role)
      .maybeSingle();

    // 🔍 DEBUG LOGS - Remove these after testing
    console.log('🔐 Permission Debug:', {
      path,
      permissionKey: PATH_TO_PERMISSION[path],
      role,
      dbPermissions: rolePerms?.permissions,
      hasMatch: rolePerms?.permissions?.includes(PATH_TO_PERMISSION[path])
    });

    const allowedPermissions = new Set(rolePerms?.permissions || []);
    const permissionKey = PATH_TO_PERMISSION[path] || `${path.replace('/', '')}_access`;
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

// Cleanup in return:
return () => {
  isMounted = false;
  window.removeEventListener('permissions-updated', handleRefresh);
  supabase.removeChannel(channel);
};
};