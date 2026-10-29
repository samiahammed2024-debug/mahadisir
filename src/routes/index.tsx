import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Search, Lock } from "lucide-react";
import { categoryIcons } from "@/lib/category-icons";
import { categories } from "@/data/products";
import { useDynamicProducts } from "@/hooks/use-dynamic-products";
import {
  CartIcon,
  Container,
  IconBtn,
  Img,
  ProductGrid,
  ProductSkeleton,
  SectionHeader,
} from "@/components/shop";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "Shop Smarter. Live Better.",
      "Premium electronics, fashion, home, beauty and sports products delivered across Bangladesh. Pay with bKash, Nagad, card or cash on delivery.",
    ),
  component: Index,
});

const slides = [
  {
    title: "Premium Headphones",
    sub: "Better Sound, Better Moments",
    id: "1",
    img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=700&q=75",
  },
  {
    title: "Smart Watch Series",
    sub: "Your health, on your wrist",
    id: "3",
    img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=700&q=75",
  },
  {
    title: "Casual Sneakers",
    sub: "Comfort in every step",
    id: "8",
    img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=700&q=75",
  },
];

function HeroCarousel() {
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [i]);
  return (
    <section aria-roledescription="carousel" aria-label="Featured products">
      <div
        className="relative h-44 overflow-hidden rounded-2xl bg-hero sm:h-56"
        onTouchStart={(e) => (startX.current = e.touches[0]?.clientX ?? 0)}
        onTouchEnd={(e) => {
          if (startX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
          if (Math.abs(dx) > 40)
            setI((x) => (x + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
          startX.current = null;
        }}
      >
        {slides.map((s, idx) => (
          <div
            key={s.id}
            aria-hidden={idx !== i}
            className={cn(
              "absolute inset-0 flex transition-opacity duration-700",
              idx === i ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div className="z-10 flex w-3/5 flex-col justify-center gap-2 p-5 text-hero-foreground">
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{s.title}</h2>
              <p className="text-xs text-hero-foreground/70">{s.sub}</p>
              <Link
                to="/product/$id"
                params={{ id: s.id }}
                tabIndex={idx === i ? 0 : -1}
                className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-background px-4 py-2 text-xs font-semibold text-foreground"
              >
                Shop Now <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <img
              src={s.img}
              alt={s.title}
              className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_40%)]"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show slide ${idx + 1}`}
            aria-current={idx === i}
            onClick={() => setI(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-5 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryRow() {
  return (
    <nav
      aria-label="Shop by category"
      className="grid grid-cols-5 gap-2 lg:mx-auto lg:max-w-3xl lg:gap-8"
    >
      {categories.map((c) => {
        const Icon = categoryIcons[c.slug];
        return (
          <Link
            key={c.slug}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className="group flex flex-col items-center gap-1.5 text-[11px] text-muted-foreground lg:text-sm"
          >
            <span className="grid size-14 place-items-center rounded-xl border transition-colors group-hover:border-primary group-hover:text-foreground lg:size-16">
              <Icon className="size-6 text-foreground" strokeWidth={1.4} />
            </span>
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}

function useFakeLoading() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);
  return loading;
}

function Index() {
  const loading = useFakeLoading();
  const { products: liveProducts } = useDynamicProducts();
  const deals = liveProducts.filter((p) => p.isBestDeal);
  const trending = liveProducts.filter((p) => p.isTrending);
  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-30 bg-background px-4 pt-3 lg:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-[0.15em]">NEXORA</h1>
          <div className="flex items-center">
            <IconBtn label="Admin Login" to="/admin-login">
              <Lock className="size-4" />
            </IconBtn>
            <IconBtn label="Notifications" onClick={() => undefined}>
              <Bell className="size-5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-sale" />
            </IconBtn>
            <CartIcon />
          </div>
        </div>
        <Link
          to="/search"
          className="mt-2 flex h-11 items-center gap-2 rounded-xl bg-muted px-3 text-sm text-muted-foreground"
        >
          <Search className="size-4" /> Search for products...
        </Link>
      </header>

      {/* Desktop hero */}
      <section className="hidden bg-muted lg:block">
        <Container className="grid grid-cols-2 items-center gap-10 py-16">
          <div>
            <h1 className="text-6xl font-extrabold leading-[1.05] tracking-tight">
              Upgrade Your
              <br />
              Everyday Life
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Premium quality products for a better tomorrow.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Shop Now <ArrowRight className="size-4" />
            </Link>
          </div>
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80"
            alt="Black wireless headphones"
            className="mx-auto aspect-square w-full max-w-md rounded-3xl object-cover mix-blend-multiply"
          />
        </Container>
      </section>

      <Container className="space-y-7 pt-4 lg:space-y-12 lg:pt-12">
        <div className="lg:hidden">
          <HeroCarousel />
        </div>
        <section>
          <h2 className="mb-4 hidden text-center text-xl font-bold lg:block">Shop by Category</h2>
          <CategoryRow />
        </section>
        <section className="lg:hidden">
          <SectionHeader title="Best Deals" to="/shop" search={{ filter: "deals" }} />
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, k) => (
                <ProductSkeleton key={k} />
              ))}
            </div>
          ) : (
            <ProductGrid items={deals} />
          )}
        </section>
        <section className="hidden lg:block">
          <SectionHeader title="Trending Products" to="/shop" search={{ filter: "trending" }} />
          {loading ? (
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, k) => (
                <ProductSkeleton key={k} />
              ))}
            </div>
          ) : (
            <ProductGrid items={trending} />
          )}
        </section>
        <section className="hidden lg:block">
          <SectionHeader title="Best Deals" to="/shop" search={{ filter: "deals" }} />
          <ProductGrid items={deals.slice(0, 10)} />
        </section>
      </Container>
    </>
  );
}
