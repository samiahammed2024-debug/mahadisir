import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCategory } from "@/data/products";
import { Catalog, CategoryNotFound } from "@/components/catalog";
import { seo } from "@/lib/seo";
import { useDynamicProducts } from "@/hooks/use-dynamic-products";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo(
          loaderData.category.name,
          `Shop ${loaderData.category.name.toLowerCase()} at NEXORA — ${loaderData.category.description.toLowerCase()} with fast delivery in Bangladesh.`,
          loaderData.category.image,
        )
      : {
          meta: [{ title: "Category not found | NEXORA" }, { name: "robots", content: "noindex" }],
        },
  notFoundComponent: CategoryNotFound,
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { products } = useDynamicProducts();
  return (
    <Catalog
      title={category.name}
      subs={category.subs}
      items={products.filter((p) => p.category === category.slug)}
    />
  );
}
