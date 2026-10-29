import {
  supabase,
  isSupabaseConfigured,
  type DbProduct,
  type DbOrder,
  type DbMessage,
} from "./supabase";
import { products as defaultProducts, type Product, type CategorySlug } from "@/data/products";

export function getDefaultDbProducts(): DbProduct[] {
  return defaultProducts.map((p, idx) => ({
    id: p.id || `prod_${idx + 1}`,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    price: p.price,
    old_price: p.oldPrice,
    discount_percent: p.discountPercent,
    images: p.images,
    stock: p.stock,
    colors: p.colors.map((c) => c.name),
    sizes: p.sizes,
    is_active: true,
    is_featured: p.isBestDeal || p.isTrending,
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export function mapDbProductToProduct(db: DbProduct): Product {
  const defaultColors = [
    { name: "Default", value: "#1a1a1a" },
    { name: "Silver", value: "#9ca3af" },
  ];

  const colors =
    Array.isArray(db.colors) && db.colors.length > 0
      ? db.colors.map((c) => {
          if (typeof c === "string") {
            const isHex = c.startsWith("#");
            return {
              name: isHex ? "Color" : c,
              value: isHex ? c : "#1a1a1a",
            };
          }
          return defaultColors[0]!;
        })
      : defaultColors;

  return {
    id: String(db.id),
    name: db.name,
    slug: db.slug || db.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category: (db.category as CategorySlug) || "electronics",
    sub: db.category || "General",
    price: Number(db.price),
    oldPrice: db.old_price ? Number(db.old_price) : Number(db.price),
    discountPercent:
      db.discount_percent ??
      (db.old_price && Number(db.old_price) > Number(db.price)
        ? Math.round(((Number(db.old_price) - Number(db.price)) / Number(db.old_price)) * 100)
        : 0),
    rating: 4.8,
    reviewCount: 36,
    description: db.description || "",
    colors,
    sizes: Array.isArray(db.sizes) ? db.sizes : [],
    images:
      Array.isArray(db.images) && db.images.length > 0
        ? db.images
        : [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=75",
          ],
    stock: Number(db.stock ?? 10),
    isBestDeal: Boolean(db.is_featured),
    isTrending: Boolean(db.is_featured),
    createdAt: db.created_at || new Date().toISOString(),
  };
}

/**
 * Deleted product IDs blacklist tracking (persisted in localStorage)
 */
export function getDeletedProductIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("nexora_deleted_product_ids");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Error reading deleted product ids:", e);
  }
  return [];
}

export function addDeletedProductId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedProductIds();
    const strId = String(id);
    if (!ids.includes(strId)) {
      ids.push(strId);
      localStorage.setItem("nexora_deleted_product_ids", JSON.stringify(ids));
    }
  } catch (e) {
    console.warn("Error saving deleted product id:", e);
  }
}

/**
 * Get products from localStorage (with auto-initialization and deleted blacklist check)
 */
export function getLocalProducts(): DbProduct[] {
  if (typeof window === "undefined") return getDefaultDbProducts();
  const deletedIds = new Set(getDeletedProductIds());

  try {
    const catalogVersion = localStorage.getItem("nexora_catalog_version");
    const raw = localStorage.getItem("nexora_unified_products");

    // Version migration to Islamic & Panjabi Lifestyle
    if (catalogVersion === "islamic_lifestyle_v2" && raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p) => !deletedIds.has(String(p.id)));
      }
    }
  } catch (e) {
    console.warn("Error reading local products:", e);
  }

  // First time or version upgrade: initialize with default Islamic products, excluding deleted
  const defaults = getDefaultDbProducts().filter((p) => !deletedIds.has(String(p.id)));
  localStorage.setItem("nexora_catalog_version", "islamic_lifestyle_v2");
  localStorage.setItem("nexora_unified_products", JSON.stringify(defaults));
  return defaults;
}

export function setLocalProducts(products: DbProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("nexora_catalog_version", "islamic_lifestyle_v2");
  localStorage.setItem("nexora_unified_products", JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("nexora_products_updated", { detail: products }));
}

/**
 * Unified fetch for Products (Supabase prioritized + Local Fallback & Seed)
 */
export async function fetchUnifiedProducts(): Promise<DbProduct[]> {
  const deletedIds = new Set(getDeletedProductIds());

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const filtered = (data as DbProduct[]).filter((p) => !deletedIds.has(String(p.id)));
        setLocalProducts(filtered);
        return filtered;
      }
    } catch (e) {
      console.warn("Could not fetch products from Supabase:", e);
    }
  }
  return getLocalProducts();
}

/**
 * Save or Update product in both Supabase and LocalStorage
 */
export async function saveUnifiedProduct(
  product: Partial<DbProduct> & { name: string; price: number },
): Promise<DbProduct> {
  const currentList = getLocalProducts();
  const id = product.id ? String(product.id) : `prod_${Date.now()}`;
  const slug =
    product.slug ||
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const fullProduct: DbProduct = {
    id,
    name: product.name,
    slug: slug || `item-${Date.now()}`,
    description: product.description || "",
    category: product.category || "panjabi",
    price: Number(product.price),
    old_price: product.old_price ? Number(product.old_price) : null,
    discount_percent: product.discount_percent ?? null,
    images:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=75",
          ],
    stock: Number(product.stock ?? 10),
    colors: Array.isArray(product.colors) ? product.colors : ["White", "Black"],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    is_active: product.is_active ?? true,
    is_featured: product.is_featured ?? false,
    created_at: product.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existingIndex = currentList.findIndex(
    (p) => String(p.id) === String(id) || p.slug === slug,
  );
  let updatedList: DbProduct[];
  if (existingIndex >= 0) {
    updatedList = [...currentList];
    updatedList[existingIndex] = fullProduct;
  } else {
    updatedList = [fullProduct, ...currentList];
  }
  setLocalProducts(updatedList);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("products").upsert(fullProduct, { onConflict: "id" });
    } catch (e) {
      console.warn("Failed to persist product to Supabase:", e);
    }
  }

  return fullProduct;
}

/**
 * Delete product permanently from both Supabase and LocalStorage
 */
export async function deleteUnifiedProduct(id: string): Promise<void> {
  const strId = String(id);
  addDeletedProductId(strId);

  const currentList = getLocalProducts();
  const updatedList = currentList.filter(
    (p) => String(p.id) !== strId && p.slug !== strId,
  );
  setLocalProducts(updatedList);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("products").delete().eq("id", strId);
    } catch (e) {
      console.warn("Failed to delete product from Supabase:", e);
    }
  }
}

/**
 * Unified Orders Storage
 */
export function getLocalOrders(): DbOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("nexora_orders_cache");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Error reading local orders:", e);
  }
  return [];
}

export function saveLocalOrders(orders: DbOrder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("nexora_orders_cache", JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("nexora_orders_updated", { detail: orders }));
}

export async function fetchUnifiedOrders(): Promise<DbOrder[]> {
  const local = getLocalOrders();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Merge Supabase with local (deduplicate by order_number or id)
        const map = new Map<string, DbOrder>();
        (data as DbOrder[]).forEach((o) => map.set(o.order_number || o.id, o));
        local.forEach((o) => {
          const key = o.order_number || o.id;
          if (!map.has(key)) map.set(key, o);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        saveLocalOrders(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Failed to fetch orders from Supabase:", e);
    }
  }
  return local;
}

export async function addUnifiedOrder(order: DbOrder): Promise<void> {
  const current = getLocalOrders();
  const updated = [
    order,
    ...current.filter((o) => o.id !== order.id && o.order_number !== order.order_number),
  ];
  saveLocalOrders(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("orders").insert([order]);
    } catch (e) {
      console.warn("Failed to insert order to Supabase:", e);
    }
  }
}

export async function updateUnifiedOrderStatus(
  id: string,
  status: DbOrder["status"],
  adminNote?: string,
): Promise<void> {
  const current = getLocalOrders();
  const updated = current.map((o) =>
    o.id === id || o.order_number === id
      ? { ...o, status, admin_note: adminNote !== undefined ? adminNote : o.admin_note }
      : o,
  );
  saveLocalOrders(updated);

  if (isSupabaseConfigured) {
    try {
      const updateData: { status: DbOrder["status"]; admin_note?: string } = { status };
      if (adminNote !== undefined) updateData.admin_note = adminNote;
      await supabase.from("orders").update(updateData).or(`id.eq.${id},order_number.eq.${id}`);
    } catch (e) {
      console.warn("Failed to update order status in Supabase:", e);
    }
  }
}

export async function deleteUnifiedOrder(id: string): Promise<void> {
  const current = getLocalOrders();
  const updated = current.filter((o) => o.id !== id && o.order_number !== id);
  saveLocalOrders(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("orders").delete().or(`id.eq.${id},order_number.eq.${id}`);
    } catch (e) {
      console.warn("Failed to delete order from Supabase:", e);
    }
  }
}

/**
 * Unified Messages Storage
 */
export function getLocalMessages(): DbMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("nexora_messages_cache");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Error reading local messages:", e);
  }
  return [];
}

export function saveLocalMessages(msgs: DbMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("nexora_messages_cache", JSON.stringify(msgs));
  window.dispatchEvent(new CustomEvent("nexora_messages_updated", { detail: msgs }));
}

export async function fetchUnifiedMessages(): Promise<DbMessage[]> {
  const local = getLocalMessages();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const map = new Map<string, DbMessage>();
        (data as DbMessage[]).forEach((m) => map.set(m.id, m));
        local.forEach((m) => {
          if (!map.has(m.id)) map.set(m.id, m);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        saveLocalMessages(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Failed to fetch messages from Supabase:", e);
    }
  }
  return local;
}

export async function addUnifiedMessage(msg: DbMessage): Promise<void> {
  const current = getLocalMessages();
  const updated = [msg, ...current.filter((m) => m.id !== msg.id)];
  saveLocalMessages(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("messages").insert([msg]);
    } catch (e) {
      console.warn("Failed to insert message into Supabase:", e);
    }
  }
}

export async function markUnifiedMessageRead(id: string, isRead: boolean): Promise<void> {
  const current = getLocalMessages();
  const updated = current.map((m) => (m.id === id ? { ...m, is_read: isRead } : m));
  saveLocalMessages(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("messages").update({ is_read: isRead }).eq("id", id);
    } catch (e) {
      console.warn("Failed to update message in Supabase:", e);
    }
  }
}

export async function deleteUnifiedMessage(id: string): Promise<void> {
  const current = getLocalMessages();
  const updated = current.filter((m) => m.id !== id);
  saveLocalMessages(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("messages").delete().eq("id", id);
    } catch (e) {
      console.warn("Failed to delete message in Supabase:", e);
    }
  }
}

/**
 * Find product by ID or Slug from local catalog or Supabase
 */
export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | undefined> {
  const list = getLocalProducts();
  const local = list.find((p) => String(p.id) === String(idOrSlug) || p.slug === idOrSlug);
  if (local) return mapDbProductToProduct(local);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (!error && data) {
        return mapDbProductToProduct(data as DbProduct);
      }
    } catch {
      // Fallback
    }
  }

  const staticMatch = defaultProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  return staticMatch;
}

/**
 * Upload an image to the Supabase "product-images" storage bucket.
 * Returns public URL of the uploaded image.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured yet. Please enter an Image URL directly or configure Supabase storage.",
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Seed initial catalog from default products to Supabase products table
 */
export async function seedProductsToSupabase(): Promise<{ count: number }> {
  const defaults = getDefaultDbProducts();
  setLocalProducts(defaults);

  if (!isSupabaseConfigured) {
    return { count: defaults.length };
  }

  const rows = defaults.map((p) => ({
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    price: p.price,
    old_price: p.old_price,
    discount_percent: p.discount_percent,
    images: p.images,
    stock: p.stock,
    colors: p.colors,
    sizes: p.sizes,
    is_active: true,
    is_featured: p.is_featured,
  }));

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "slug" })
    .select();

  if (error) {
    console.warn("Supabase upsert warning:", error.message);
  }

  return { count: data?.length || rows.length };
}
