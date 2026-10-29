import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { categories } from "@/data/products";
import { Container, Img, TopBar } from "@/components/shop";
import { categoryIcons } from "@/lib/category-icons";
import { seo } from "@/lib/seo";
import { useDynamicProducts } from "@/hooks/use-dynamic-products";

export const Route = createFileRoute("/categories")({
  head: () =>
    seo(
      "All Categories",
      "Explore NEXORA categories: Electronics, Fashion, Home, Beauty and Sports.",
    ),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { products } = useDynamicProducts();
  return (
    <>
      <TopBar title="Categories" back={false} />
      <Container className="lg:pt-10">
        <h1 className="mb-6 hidden text-3xl font-bold lg:block">Categories</h1>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = categoryIcons[c.slug];
            const count = products.filter((p) => p.category === c.slug).length;
            return (
              <li key={c.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group relative block h-40 overflow-hidden rounded-2xl bg-hero lg:h-56"
                >
                  <Img
                    src={c.image}
                    alt={`${c.name} products`}
                    className="absolute inset-0 size-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="relative flex h-full flex-col justify-end p-5 text-hero-foreground">
                    <Icon className="mb-2 size-6" strokeWidth={1.5} />
                    <h2 className="text-xl font-bold">{c.name}</h2>
                    <p className="flex items-center justify-between text-xs text-hero-foreground/80">
                      {c.description} · {count} items{" "}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
