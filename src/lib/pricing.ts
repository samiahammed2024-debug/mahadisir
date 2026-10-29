export const DELIVERY_CHARGE = 80;
export const FREE_DELIVERY_ABOVE = 5000;
export const COUPONS: Record<string, number> = { NEXORA10: 10 };

export const formatTaka = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

export function calcTotals(items: { price: number; quantity: number }[], couponPercent = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Math.round((subtotal * couponPercent) / 100);
  const delivery = subtotal === 0 || subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

export function filterProducts<
  T extends { price: number; rating: number; reviewCount: number; createdAt: string },
>(list: T[], opts: { sort: string; min: number; max: number; minRating: number }) {
  const out = list.filter(
    (p) => p.price >= opts.min && p.price <= opts.max && p.rating >= opts.minRating,
  );
  const sorters: Record<string, (a: T, b: T) => number> = {
    popularity: (a, b) => b.reviewCount - a.reviewCount,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    rating: (a, b) => b.rating - a.rating,
  };
  return out.sort(sorters[opts.sort] ?? sorters["popularity"]!);
}
