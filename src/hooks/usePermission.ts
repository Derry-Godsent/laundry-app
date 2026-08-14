import { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore
import { supabase } from "../lib/supabaseClient";

const PATH_TO_PERMISSION: Record<string, string> = {
  "/dashboard": "dashboard",
  "/orders": "orders",
  "/clients": "clients",
  "/settings": "settings",
  "/system": "system",
  "/payments": "payments",
  "/receipt": "receipt",
  "/services": "services",
  "/staff": "staff",
  "/new-order": "new-order",
  "/security": "security",
};

interface CacheEntry {
  canView: boolean;
  canEdit: boolean;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(userId: string, path: string): string {
  return `${userId}:${path}`;
}

function getPermissionKey(path: string): string {
  const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
  return PATH_TO_PERMISSION[normalized] || PATH_TO_PERMISSION[path] || path.replace(/^\//, "").replace(/\//g, "-");
}

export const usePermission = (path: string) => {
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadPermission = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!signal.aborted && isMountedRef.current) {
          setCanView(false);
          setCanEdit(false);
          setLoading(false);
        }
        return;
      }

      const cacheKey = getCacheKey(session.user.id, path);
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (!signal.aborted && isMountedRef.current) {
          setCanView(cached.canView);
          setCanEdit(cached.canEdit);
          setLoading(false);
        }
        return;
      }

      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (staffError) throw staffError;

      const role = staffData?.role?.toLowerCase() || "worker";
      const permissionKey = getPermissionKey(path);

      const { data: rolePerms, error: permError } = await supabase
        .from("role_permissions")
        .select("can_view, can_edit")
        .eq("role", role)
        .eq("page", permissionKey)
        .maybeSingle();

      if (permError) throw permError;

      const userCanView = rolePerms?.can_view === true;
      const userCanEdit = rolePerms?.can_edit === true;

      cache.set(cacheKey, { canView: userCanView, canEdit: userCanEdit, timestamp: Date.now() });

      if (!signal.aborted && isMountedRef.current) {
        setCanView(userCanView);
        setCanEdit(userCanEdit);
        setLoading(false);
      }
    } catch (err) {
      if (!signal.aborted && isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setCanView(false);
        setCanEdit(false);
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    isMountedRef.current = true;
    loadPermission();

    const { data: authListener } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        cache.clear();
        if (isMountedRef.current) {
          setCanView(false);
          setCanEdit(false);
          setLoading(false);
        }
      }
    });

    const handleRefresh = () => {
      cache.clear();
      loadPermission();
    };
    
    window.addEventListener("permissions-updated", handleRefresh);

    return () => {
      isMountedRef.current = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener("permissions-updated", handleRefresh);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [loadPermission]);

  const permission = canEdit ? "edit" : (canView ? "view" : "none");

  return { permission, canView, canEdit, loading, error };
};