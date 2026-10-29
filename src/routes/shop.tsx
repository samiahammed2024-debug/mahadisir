import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { categories } from "@/data/products";
import { Catalog } from "@/components/catalog";
import { seo } from "@/lib/seo";
import { useDynamicProducts } from "@/hooks/use-dynamic-products";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({ filter: z.enum(["deals", "trending"]).optional() }),
  head: () =>
    seo(
      "Shop All Products",
      "Browse every NEXORA product — electronics, fashion, home, beauty and sports at the best prices in Bangladesh.",
    ),
  component: ShopPage,
});

function ShopPage() {
  const { filter } = Route.useSearch();
  const { products } = useDynamicProducts();
  const items =
    filter === "deals"
      ? products.filter((p) => p.isBestDeal)
      : filter === "trending"
        ? products.filter((p) => p.isTrending)
        : products;
  const title =
    filter === "deals" ? "Best Deals" : filter === "trending" ? "Trending Products" : "Shop";
  return (
    <Catalog title={title} items={items} subs={categories.map((c) => c.name)} subKey="category" />
  );
}
