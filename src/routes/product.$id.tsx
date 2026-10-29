import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Heart, PackageSearch, Share2, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { getProduct, products } from "@/data/products";
import {
  CartIcon,
  Container,
  EmptyState,
  PriceTag,
  ProductCard,
  QuantitySelector,
  RatingStars,
  useWishToggle,
} from "@/components/shop";
import { cartKey, useCart } from "@/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

import { getProductByIdOrSlug } from "@/lib/products-service";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const product = (await getProductByIdOrSlug(params.id)) || getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo(
          loaderData.product.name,
          `${loaderData.product.name} for ৳${loaderData.product.price.toLocaleString("en-US")} at NEXORA. ${loaderData.product.description}`,
          loaderData.product.images[0],
        )
      : {
          meta: [{ title: "Product unavailable | NEXORA" }, { name: "robots", content: "noindex" }],
        },
  notFoundComponent: () => (
    <EmptyState
      icon={<PackageSearch className="size-8" />}
      title="Product not found"
      text="This product may have been removed."
      action={
        <Link
          to="/shop"
          className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          Browse products
        </Link>
      }
    />
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  return <ProductView key={product.id} />;
}

function ProductView() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const [img, setImg] = useState(0);
  const [color, setColor] = useState(product.colors[0]?.name);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const startX = useRef<number | null>(null);
  const { has, toggle } = useWishToggle(product);
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.some((i) => i.key === cartKey(product.id, color, size)));
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 8);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const onAdd = () => {
    if (inCart) {
      void navigate({ to: "/cart" });
      return;
    }
    if (product.stock === 0) {
      toast.error("Out of stock");
      return;
    }
    add({
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? "",
      price: product.price,
      quantity: qty,
      color,
      size,
    });
    toast.success("Added to cart", { description: `${product.name} × ${qty}` });
  };

  return (
    <div className="pb-28 lg:pb-0">
      <Container className="px-0 lg:grid lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-10">
        {/* Gallery */}
        <section aria-label="Product images" className="relative lg:sticky lg:top-24 lg:self-start">
          <div
            className="relative aspect-square overflow-hidden bg-muted lg:rounded-2xl"
            onTouchStart={(e) => (startX.current = e.touches[0]?.clientX ?? 0)}
            onTouchEnd={(e) => {
              if (startX.current === null) return;
              const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
              const n = product.images.length;
              if (Math.abs(dx) > 40) setImg((x) => (x + (dx < 0 ? 1 : n - 1)) % n);
              startX.current = null;
            }}
          >
            <img
              src={product.images[img]}
              alt={`${product.name} – image ${img + 1}`}
              className="size-full object-cover mix-blend-multiply"
            />
            <div className="absolute inset-x-0 top-0 flex justify-between p-3 lg:hidden">
              <button
                type="button"
                aria-label="Go back"
                onClick={() =>
                  window.history.length > 1 ? window.history.back() : navigate({ to: "/" })
                }
                className="grid size-10 place-items-center rounded-full bg-background/90 shadow-sm"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={has ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={has}
                  onClick={toggle}
                  className="grid size-10 place-items-center rounded-full bg-background/90 shadow-sm"
                >
                  <Heart className={cn("size-5", has && "fill-sale text-sale")} />
                </button>
                <button
                  type="button"
                  aria-label="Share"
                  onClick={share}
                  className="grid size-10 place-items-center rounded-full bg-background/90 shadow-sm"
                >
                  <Share2 className="size-5" />
                </button>
                <div className="rounded-full bg-background/90 shadow-sm">
                  <CartIcon />
                </div>
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="absolute inset-x-0 bottom-8 flex justify-center gap-1.5 lg:bottom-4">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => setImg(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === img ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 hidden gap-3 lg:flex">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show image ${i + 1}`}
                  onClick={() => setImg(i)}
                  className={cn(
                    "size-20 overflow-hidden rounded-xl bg-muted ring-offset-2",
                    i === img && "ring-2 ring-primary",
                  )}
                >
                  <img src={src} alt="" className="size-full object-cover mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Info */}
        <section className="relative -mt-5 rounded-t-3xl bg-background px-4 pt-6 lg:mt-0 lg:px-0 lg:pt-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 hidden text-xs text-muted-foreground lg:block"
          >
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>{" "}
            /{" "}
            <Link
              to="/category/$slug"
              params={{ slug: product.category }}
              className="capitalize hover:text-foreground"
            >
              {product.category}
            </Link>{" "}
            / {product.name}
          </nav>
          <h1 className="text-2xl font-bold lg:text-4xl">{product.name}</h1>
          <div className="mt-2">
            <RatingStars rating={product.rating} count={product.reviewCount} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <PriceTag price={product.price} oldPrice={product.oldPrice} size="lg" />
            {product.discountPercent > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                -{product.discountPercent}%
              </span>
            )}
          </div>
          <p
            className={cn(
              "mt-2 text-xs",
              product.stock === 0
                ? "text-destructive"
                : product.stock <= 5
                  ? "text-sale"
                  : "text-success",
            )}
          >
            {product.stock === 0
              ? "Out of stock"
              : product.stock <= 5
                ? `Only ${product.stock} left`
                : "In stock"}
          </p>

          {product.colors.length > 0 && (
            <fieldset className="mt-6">
              <legend className="text-sm">
                <span className="text-muted-foreground">Color:</span>{" "}
                <span className="font-medium">{color}</span>
              </legend>
              <div className="mt-2 flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={color === c.name}
                    onClick={() => setColor(c.name)}
                    className={cn(
                      "size-9 rounded-full border ring-offset-2 transition",
                      color === c.name && "ring-2 ring-primary",
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </fieldset>
          )}

          {product.sizes.length > 0 && (
            <fieldset className="mt-5">
              <legend className="text-sm">
                <span className="text-muted-foreground">Size:</span>{" "}
                <span className="font-medium">{size}</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "h-10 min-w-12 rounded-xl border px-3 text-sm",
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <QuantitySelector value={qty} onChange={setQty} />
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold">Description</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="size-4" /> Delivery ৳80 · Free above ৳5,000 · 3-5 days
          </p>

          <div className="mt-6 hidden gap-3 lg:flex">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="size-4" /> {inCart ? "Go to Cart" : "Add to Cart"}
            </button>
            <button
              type="button"
              aria-label={has ? "Remove from wishlist" : "Add to wishlist"}
              onClick={toggle}
              className="grid size-12 place-items-center rounded-xl border hover:bg-muted"
            >
              <Heart className={cn("size-5", has && "fill-sale text-sale")} />
            </button>
            <button
              type="button"
              aria-label="Share"
              onClick={share}
              className="grid size-12 place-items-center rounded-xl border hover:bg-muted"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </section>
      </Container>

      {related.length > 0 && (
        <Container className="mt-10">
          <h2 className="mb-3 text-lg font-bold">Related Products</h2>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
            {related.map((p) => (
              <div key={p.id} className="w-40 shrink-0 lg:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </Container>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.99]"
        >
          <ShoppingCart className="size-4" /> {inCart ? "Go to Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
