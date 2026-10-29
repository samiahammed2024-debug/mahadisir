import { Link, useNavigate, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Heart,
  Home,
  LayoutGrid,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
  User,
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { formatTaka } from "@/lib/pricing";
import { useCart, useWishlist } from "@/store";
import { cn } from "@/lib/utils";
import { isSessionAdmin } from "@/lib/supabase";

export function Img({
  src,
  alt,
  className,
}: {
  src?: string | undefined;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        "transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

export function PriceTag({
  price,
  oldPrice,
  size = "sm",
}: {
  price: number;
  oldPrice?: number;
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("font-bold", size === "lg" ? "text-2xl" : "text-sm")}>
        {formatTaka(price)}
      </span>
      {oldPrice && oldPrice > price && (
        <span
          className={cn(
            "text-muted-foreground line-through",
            size === "lg" ? "text-base" : "text-xs",
          )}
        >
          {formatTaka(oldPrice)}
        </span>
      )}
    </div>
  );
}

export function RatingStars({ rating, count }: { rating: number; count?: number }) {
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="size-4 fill-star text-star" aria-hidden />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground">({fmt(count)} reviews)</span>}
    </div>
  );
}

export function useWishToggle(product: Product) {
  const has = useWishlist((s) => s.ids.includes(product.id));
  const toggle = useWishlist((s) => s.toggle);
  return {
    has,
    toggle: () => {
      const added = toggle(product.id);
      toast(added ? "Added to wishlist" : "Removed from wishlist", { description: product.name });
    },
  };
}

export function ProductCard({
  product,
  showAdd,
}: {
  product: Product;
  showAdd?: boolean | undefined;
}) {
  const { has, toggle } = useWishToggle(product);
  const add = useCart((s) => s.add);
  return (
    <article className="group relative flex flex-col">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block rounded-xl focus-visible:outline-offset-4"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Img
            src={product.images[0]}
            alt={product.name}
            className="size-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
          {product.stock === 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] font-semibold text-background">
              Out of Stock
            </span>
          ) : product.discountPercent > 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
              -{product.discountPercent}%
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 truncate text-sm font-medium">{product.name}</h3>
        <PriceTag price={product.price} oldPrice={product.oldPrice} />
      </Link>
      <button
        type="button"
        onClick={toggle}
        aria-label={
          has ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`
        }
        aria-pressed={has}
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 shadow-sm transition-transform hover:scale-110 active:scale-95"
      >
        <Heart className={cn("size-4", has ? "fill-sale text-sale" : "text-foreground")} />
      </button>
      {showAdd && (
        <button
          type="button"
          disabled={product.stock === 0}
          onClick={() => {
            if (product.stock === 0) return;
            add({
              productId: product.id,
              name: product.name,
              image: product.images[0] ?? "",
              price: product.price,
              quantity: 1,
              color: product.colors[0]?.name,
              size: product.sizes[0],
            });
            toast.success("Added to cart", { description: product.name });
          }}
          className="mt-2 h-9 rounded-xl border text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      )}
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-xl bg-muted" />
      <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

export function ProductGrid({
  items,
  showAdd,
}: {
  items: Product[];
  showAdd?: boolean | undefined;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} showAdd={showAdd} />
      ))}
    </div>
  );
}

export function SectionHeader({
  title,
  to,
  search,
}: {
  title: string;
  to?: LinkProps["to"];
  search?: Record<string, string>;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold lg:text-xl">{title}</h2>
      {to && (
        <Link
          to={to}
          search={search as never}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          See All →
        </Link>
      )}
    </div>
  );
}

export function QuantitySelector({
  value,
  onChange,
  small,
}: {
  value: number;
  onChange: (n: number) => void;
  small?: boolean;
}) {
  const s = small ? "size-7" : "size-10";
  return (
    <div className="inline-flex items-center rounded-full border bg-background">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={cn("grid place-items-center rounded-full disabled:opacity-40", s)}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn("grid place-items-center rounded-full disabled:opacity-40", s)}
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center page-enter">
      <div className="grid size-20 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h2 className="mt-5 text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function TopBar({
  title,
  back = true,
  right,
}: {
  title?: ReactNode;
  back?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-transparent bg-background/95 px-4 backdrop-blur lg:hidden">
      {back && (
        <button
          type="button"
          aria-label="Go back"
          onClick={() =>
            window.history.length > 1 ? window.history.back() : navigate({ to: "/" })
          }
          className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
      <div className="flex shrink-0 items-center gap-1">
        {right}
        <IconBtn label="Admin" to={isSessionAdmin() ? "/admin" : "/admin-login"}>
          <Lock className="size-4" />
        </IconBtn>
      </div>
    </header>
  );
}

export function IconBtn({
  label,
  children,
  onClick,
  to,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  to?: LinkProps["to"];
}) {
  const cls =
    "relative grid size-10 place-items-center rounded-full transition-colors hover:bg-muted";
  if (to)
    return (
      <Link to={to} aria-label={label} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function CartIcon() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <IconBtn label={`Cart, ${count} items`} to="/cart">
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
          {count}
        </span>
      )}
    </IconBtn>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = (to: string) =>
    to === "/"
      ? path === "/"
      : path.startsWith(to) || (to === "/categories" && path.startsWith("/category/"));
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => {
          const on = active(to);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  on ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", on && "fill-foreground")}
                  strokeWidth={on ? 2.2 : 1.6}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const desktopLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function DesktopNav() {
  return (
    <header className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur lg:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <Link to="/" className="text-xl font-extrabold tracking-[0.2em]">
          NEXORA
        </Link>
        <nav aria-label="Main" className="flex gap-8 text-sm">
          {desktopLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="text-muted-foreground transition-colors hover:text-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <IconBtn label="Search" to="/search">
            <Search className="size-5" />
          </IconBtn>
          <IconBtn label="Wishlist" to="/wishlist">
            <Heart className="size-5" />
          </IconBtn>
          <IconBtn label="Account" to="/profile">
            <User className="size-5" />
          </IconBtn>
          <CartIcon />
          <Link
            to={isSessionAdmin() ? "/admin" : "/admin-login"}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            title={isSessionAdmin() ? "Admin Panel" : "Admin Login"}
          >
            <Lock className="size-3.5" />
            <span>{isSessionAdmin() ? "Admin Panel" : "Admin"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 hidden border-t bg-muted lg:block">
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-10 px-8 py-12 text-sm">
        <div>
          <p className="text-xl font-extrabold tracking-[0.2em]">NEXORA</p>
          <p className="mt-2 text-muted-foreground">Shop Smarter. Live Better.</p>
          <div className="mt-4 flex gap-2">
            {[Facebook, Instagram, Youtube].map((I, i) => (
              <a
                key={i}
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label={["Facebook", "Instagram", "YouTube"][i]}
                className="grid size-9 place-items-center rounded-full border bg-background hover:bg-primary hover:text-primary-foreground"
              >
                <I className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                Shop
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-foreground">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-foreground">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Customer Support</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-foreground">
                My Orders
              </Link>
            </li>
            <li>Delivery: ৳80, free above ৳5,000</li>
            <li>support@nexora.com.bd</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">We Accept</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md bg-bkash px-2.5 py-1 text-xs font-bold text-primary-foreground">
              bKash
            </span>
            <span className="rounded-md bg-nagad px-2.5 py-1 text-xs font-bold text-primary-foreground">
              Nagad
            </span>
            <span className="rounded-md border bg-background px-2.5 py-1 text-xs font-bold italic">
              VISA
            </span>
            <span className="rounded-md border bg-background px-2.5 py-1 text-xs font-bold">
              Mastercard
            </span>
          </div>
        </div>
      </div>
      <p className="border-t py-5 text-center text-xs text-muted-foreground">
        © 2026 NEXORA. All rights reserved.
      </p>
    </footer>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/8801700000000?text=Hi%20NEXORA%2C%20I%20need%20help"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with support on WhatsApp"
      className="fixed bottom-20 right-4 z-40 grid size-12 place-items-center rounded-full bg-whatsapp text-primary-foreground shadow-lg transition-transform hover:scale-110 lg:bottom-6 lg:right-6"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 lg:px-8", className)}>{children}</div>;
}
