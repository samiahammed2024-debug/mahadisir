import { createClient, type User, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// Read Supabase credentials from environment
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL || "";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("placeholder") &&
  supabaseUrl.startsWith("http"),
);

// Fallback dummy client if credentials aren't provided yet so app never crashes
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient(
      "https://placeholder-project.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

export type AppRole = "admin" | "user";

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
  created_at?: string;
}

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  old_price: number | null;
  discount_percent: number | null;
  images: string[] | null;
  stock: number;
  colors: string[] | null;
  sizes: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
}

export interface DbOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  items: DbOrderItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  admin_note: string | null;
  created_at: string;
}

export interface DbMessage {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DbSettings {
  id: string;
  store_name: string;
  contact_phone: string;
  delivery_charge: number;
  free_delivery_minimum: number;
  admin_passcode?: string;
  updated_at?: string;
}

export function isSessionAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return (
    sessionStorage.getItem("nexora_admin_session") === "true" ||
    localStorage.getItem("nexora_admin_session") === "true"
  );
}

export function setSessionAdmin(val: boolean) {
  if (typeof window === "undefined") return;
  if (val) {
    sessionStorage.setItem("nexora_admin_session", "true");
    localStorage.setItem("nexora_admin_session", "true");
  } else {
    sessionStorage.removeItem("nexora_admin_session");
    localStorage.removeItem("nexora_admin_session");
  }
  window.dispatchEvent(new Event("storage"));
}

/**
 * Checks whether a given user has the 'admin' role in user_roles table
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (isSessionAdmin()) return true;
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.warn("Error checking admin role:", error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.warn("Exception checking admin role:", err);
    return false;
  }
}

/**
 * React hook to manage Supabase Auth & Role state
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isSessionAdmin());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const hasSessionAdmin = isSessionAdmin();
    if (hasSessionAdmin) {
      setIsAdmin(true);
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkIsAdmin(currentSession.user.id).then((adminStatus) => {
          if (mounted) {
            setIsAdmin(adminStatus || isSessionAdmin());
            setLoading(false);
          }
        });
      } else {
        setIsAdmin(isSessionAdmin());
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const adminStatus = await checkIsAdmin(newSession.user.id);
        if (mounted) setIsAdmin(adminStatus || isSessionAdmin());
      } else {
        setIsAdmin(isSessionAdmin());
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshRole = async () => {
    if (isSessionAdmin()) {
      setIsAdmin(true);
      return true;
    }
    if (user) {
      const adminStatus = await checkIsAdmin(user.id);
      setIsAdmin(adminStatus);
      return adminStatus;
    }
    return false;
  };

  return {
    user,
    session,
    isAdmin,
    loading,
    isConfigured: isSupabaseConfigured,
    refreshRole,
  };
}
