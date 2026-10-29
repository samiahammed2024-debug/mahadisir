import { useEffect, useState, useCallback } from "react";
import { type Product } from "@/data/products";
import {
  fetchUnifiedProducts,
  mapDbProductToProduct,
  getLocalProducts,
} from "@/lib/products-service";
import { type DbProduct, isSupabaseConfigured } from "@/lib/supabase";

export function useDynamicProducts() {
  const [products, setProducts] = useState<Product[]>(() =>
    getLocalProducts()
      .filter((p) => p.is_active !== false)
      .map(mapDbProductToProduct),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveFromDb, setIsLiveFromDb] = useState<boolean>(isSupabaseConfigured);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbProducts = await fetchUnifiedProducts();
      setProducts(dbProducts.filter((p) => p.is_active !== false).map(mapDbProductToProduct));
      setIsLiveFromDb(isSupabaseConfigured);
    } catch (err) {
      console.warn("Error refreshing dynamic products:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<DbProduct[]>;
      if (customEvent.detail) {
        setProducts(
          customEvent.detail.filter((p) => p.is_active !== false).map(mapDbProductToProduct),
        );
      }
    };

    window.addEventListener("nexora_products_updated", handleUpdate);
    return () => window.removeEventListener("nexora_products_updated", handleUpdate);
  }, [refresh]);

  return {
    products,
    isLoading,
    isLiveFromDb,
    refetch: refresh,
    getProductById: (id: string) => products.find((p) => p.id === id || p.slug === id),
  };
}
