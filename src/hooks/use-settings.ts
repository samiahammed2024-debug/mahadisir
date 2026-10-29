import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, type DbSettings } from "@/lib/supabase";

const defaultSettings: DbSettings = {
  id: "default",
  store_name: "NEXORA",
  contact_phone: "+880 1700-000000",
  delivery_charge: 60,
  free_delivery_minimum: 2000,
};

export function useSettings() {
  const [settings, setSettings] = useState<DbSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (error) {
        console.warn("Could not load settings:", error.message);
      } else if (data) {
        setSettings({
          id: data.id,
          store_name: data.store_name || "NEXORA",
          contact_phone: data.contact_phone || "+880 1700-000000",
          delivery_charge: Number(data.delivery_charge ?? 60),
          free_delivery_minimum: Number(data.free_delivery_minimum ?? 2000),
        });
      }
    } catch (e) {
      console.warn("Exception loading settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
}
