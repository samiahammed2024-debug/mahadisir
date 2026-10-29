import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store";
import { COUPONS, calcTotals, formatTaka, FREE_DELIVERY_ABOVE } from "@/lib/pricing";
import { Container, EmptyState, IconBtn, QuantitySelector, TopBar } from "@/components/shop";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  head: () =>
    seo("My Cart", "Review the items in your NEXORA cart and proceed to secure checkout."),
  component: CartPage,
});

export function OrderSummary({
  items,
  coupon,
  children,
}: {
  items: { price: number; quantity: number }[];
  coupon: string | null;
  children?: React.ReactNode;
}) {
  const t = calcTotals(items, coupon ? (COUPONS[coupon] ?? 0) : 0);
  const Row = ({ l, v, bold }: { l: string; v: string; bold?: boolean }) => (
    <div
      className={
        bold
          ? "flex justify-between border-t pt-3 text-base font-bold"
          : "flex justify-between text-sm text-muted-foreground"
      }
    >
      <span>{l}</span>
      <span className={bold ? "" : "text-foreground"}>{v}</span>
    </div>
  );
  return (
    <div className="space-y-3">
      <Row l="Subtotal" v={formatTaka(t.subtotal)} />
      {t.discount > 0 && <Row l={`Coupon (${coupon})`} v={`-${formatTaka(t.discount)}`} />}
      <Row l="Delivery Charge" v={t.delivery === 0 ? "Free" : formatTaka(t.delivery)} />
      <Row l="Total" v={formatTaka(t.total)} bold />
      {children}
    </div>
  );
}

function CartPage() {
  const { items, setQty, remove, clear, coupon, setCoupon } = useCart();
  const [confirm, setConfirm] = useState(false);
  const [code, setCode] = useState(coupon ?? "");
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const apply = () => {
    const c = code.trim().toUpperCase();
    if (COUPONS[c]) {
      setCoupon(c);
      toast.success(`Coupon applied: ${COUPONS[c]}% off`);
    } else {
      setCoupon(null);
      toast.error("Invalid coupon code");
    }
  };

  return (
    <>
      <TopBar
        title="My Cart"
        right={
          items.length > 0 && (
            <IconBtn label="Clear cart" onClick={() => setConfirm(true)}>
              <Trash2 className="size-5" />
            </IconBtn>
          )
        }
      />
      <Container className="lg:pt-10">
        <h1 className="mb-6 hidden text-3xl font-bold lg:block">My Cart</h1>
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-8" />}
            title="Your cart is empty"
            text="Looks like you haven't added anything yet."
            action={
              <Link
                to="/shop"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
              >
                Start Shopping <ArrowRight className="size-4" />
              </Link>
            }
          />
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3 rounded-xl bg-muted p-3">
                  <Link
                    to="/product/$id"
                    params={{ id: i.productId }}
                    className="size-24 shrink-0 overflow-hidden rounded-lg bg-background"
                  >
                    <img
                      src={i.image}
                      alt={i.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-medium">{i.name}</h2>
                        {(i.color || i.size) && (
                          <p className="text-xs text-muted-foreground">
                            {[i.color, i.size].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${i.name}`}
                        onClick={() => {
                          remove(i.key);
                          toast(`${i.name} removed`);
                        }}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <span className="text-sm font-bold">{formatTaka(i.price * i.quantity)}</span>
                      <QuantitySelector
                        small
                        value={i.quantity}
                        onChange={(n) => setQty(i.key, n)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="mt-6 lg:mt-0">
              <div className="space-y-4 rounded-xl border p-5 lg:sticky lg:top-24">
                <h2 className="hidden font-semibold lg:block">Order Summary</h2>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    apply();
                  }}
                >
                  <label htmlFor="coupon" className="sr-only">
                    Coupon code
                  </label>
                  <input
                    id="coupon"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Coupon code (try NEXORA10)"
                    className="h-11 min-w-0 flex-1 rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    className="h-11 rounded-xl border px-4 text-sm font-medium hover:bg-muted"
                  >
                    Apply
                  </button>
                </form>
                <OrderSummary items={items} coupon={coupon} />
                {subtotal <= FREE_DELIVERY_ABOVE && (
                  <p className="text-xs text-muted-foreground">
                    Add {formatTaka(FREE_DELIVERY_ABOVE - subtotal + 1)} more for free delivery.
                  </p>
                )}
                <Link
                  to="/checkout"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Proceed to Checkout <ArrowRight className="size-4" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </Container>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              All items will be removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clear();
                toast("Cart cleared");
              }}
            >
              Clear cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
