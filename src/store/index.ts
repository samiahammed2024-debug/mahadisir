import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string | undefined;
  size?: string | undefined;
}

interface CartState {
  items: CartItem[];
  coupon: string | null;
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCoupon: (c: string | null) => void;
}

export const cartKey = (id: string, color?: string, size?: string) =>
  [id, color ?? "", size ?? ""].join("|");

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      add: (item) =>
        set((s) => {
          const key = cartKey(item.productId, item.color, item.size);
          const existing = s.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(99, i.quantity + item.quantity) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, key }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(99, qty)) } : i,
          ),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    { name: "nexora-cart", skipHydration: true },
  ),
);

interface WishlistState {
  ids: string[];
  toggle: (id: string) => boolean;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const has = get().ids.includes(id);
        set({ ids: has ? get().ids.filter((x) => x !== id) : [...get().ids, id] });
        return !has;
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "nexora-wishlist", skipHydration: true },
  ),
);

interface SearchState {
  recent: string[];
  addRecent: (t: string) => void;
  removeRecent: (t: string) => void;
  clearRecent: () => void;
}

export const useSearchHistory = create<SearchState>()(
  persist(
    (set) => ({
      recent: ["headphones", "sneakers", "smart watch", "backpack"],
      addRecent: (t) => {
        const term = t.trim().toLowerCase();
        if (!term) return;
        set((s) => ({ recent: [term, ...s.recent.filter((r) => r !== term)].slice(0, 8) }));
      },
      removeRecent: (t) => set((s) => ({ recent: s.recent.filter((r) => r !== t) })),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: "nexora-search", skipHydration: true },
  ),
);

export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  address: {
    fullName: string;
    phone: string;
    address: string;
    division: string;
    district: string;
    area: string;
  };
  payment: string;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
}

interface OrdersState {
  orders: Order[];
  savedAddress: Order["address"] | null;
  addOrder: (o: Order) => void;
  saveAddress: (a: Order["address"]) => void;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      savedAddress: null,
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      saveAddress: (a) => set({ savedAddress: a }),
    }),
    { name: "nexora-orders", skipHydration: true },
  ),
);

export function rehydrateStores() {
  void useCart.persist.rehydrate();
  void useWishlist.persist.rehydrate();
  void useSearchHistory.persist.rehydrate();
  void useOrders.persist.rehydrate();
}
