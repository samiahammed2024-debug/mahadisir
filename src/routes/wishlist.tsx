import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/store";
import { Container, EmptyState, IconBtn, ProductGrid, TopBar } from "@/components/shop";
import { seo } from "@/lib/seo";
import { useDynamicProducts } from "@/hooks/use-dynamic-products";

export const Route = createFileRoute("/wishlist")({
  head: () => seo("Wishlist", "Products you've saved on NEXORA."),
  component: WishlistPage,
});

function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const clear = useWishlist((s) => s.clear);
  const { products } = useDynamicProducts();
  const items = ids
    .map((id) => products.find((p) => p.id === id || p.slug === id))
    .filter((p): p is (typeof products)[number] => !!p);
  return (
    <>
      <TopBar
        back={false}
        title="Wishlist"
        right={
          items.length > 0 && (
            <IconBtn
              label="Clear wishlist"
              onClick={() => {
                clear();
                toast("Wishlist cleared");
              }}
            >
              <Trash2 className="size-5" />
            </IconBtn>
          )
        }
      />
      <Container className="lg:pt-10">
        <h1 className="mb-6 hidden text-3xl font-bold lg:block">Wishlist</h1>
        {items.length === 0 ? (
          <EmptyState
            icon={<Heart className="size-8" />}
            title="Your wishlist is empty"
            text="Tap the heart on any product to save it here."
            action={
              <Link
                to="/shop"
                className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
              >
                Browse products
              </Link>
            }
          />
        ) : (
          <ProductGrid items={items} showAdd />
        )}
      </Container>
    </>
  );
}
