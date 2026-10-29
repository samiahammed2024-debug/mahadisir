import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, Package, Truck, Loader2 } from "lucide-react";
import { Container, TopBar } from "@/components/shop";
import { useCart, useOrders } from "@/store";
import { COUPONS, calcTotals, formatTaka } from "@/lib/pricing";
import { seo } from "@/lib/seo";
import { supabase, isSupabaseConfigured, useAuth } from "@/lib/supabase";
import { addUnifiedOrder } from "@/lib/products-service";

export const Route = createFileRoute("/checkout")({
  head: () => seo("Checkout", "Complete your NEXORA order securely."),
  component: CheckoutPage,
});

const payments = ["Cash on Delivery", "bKash", "Nagad", "Card Payment"];

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, coupon, clear } = useCart();
  const addOrder = useOrders((s) => s.addOrder);
  const [f, setF] = useState({
    fullName: "",
    phone: "",
    address: "",
    division: "Dhaka",
    district: "Dhaka",
    area: "",
  });
  const [payment, setPayment] = useState(payments[0]!);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const t = calcTotals(items, coupon ? (COUPONS[coupon] ?? 0) : 0);

  if (placedOrderNumber) {
    return (
      <>
        <TopBar title="Order Confirmed" back={false} />
        <Container className="max-w-md py-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Order Placed Successfully!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for shopping with NEXORA. We have received your order and are preparing it for
            shipment.
          </p>

          <div className="mt-6 rounded-2xl border bg-card p-5 text-left text-xs shadow-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-bold text-foreground">{placedOrderNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold">{payment}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-bold">
              <span>Total Amount</span>
              <span>{formatTaka(t.total)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/track-order"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Truck className="size-4" /> Track Order Status
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border text-sm font-medium hover:bg-accent"
            >
              Continue Shopping
            </Link>
          </div>
        </Container>
      </>
    );
  }

  if (items.length === 0)
    return (
      <Container className="py-16 text-center">
        <p>Your cart is empty.</p>
        <Link
          to="/shop"
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm text-primary-foreground"
        >
          Shop now
        </Link>
      </Container>
    );

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.fullName.trim() || !f.address.trim())
      return toast.error("Please fill in name and address");
    if (!/^01\d{9}$/.test(f.phone.trim()))
      return toast.error("Phone must be 01XXXXXXXXX (11 digits)");

    const id = `#NX${Math.floor(100000 + Math.random() * 900000)}`;
    setIsSubmitting(true);

    try {
      // 1. If Supabase is configured, insert into orders table (RLS allows anyone to insert)
      if (isSupabaseConfigured) {
        const orderPayload = {
          order_number: id,
          customer_name: f.fullName.trim(),
          customer_phone: f.phone.trim(),
          customer_email: user?.email || null,
          customer_address: `${f.address.trim()}, ${f.area ? f.area.trim() + ", " : ""}${f.district}, ${f.division}`,
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            image: it.image,
            price: it.price,
            quantity: it.quantity,
            color: it.color || null,
            size: it.size || null,
          })),
          subtotal: t.subtotal,
          delivery_charge: t.delivery,
          total: t.total,
          payment_method: payment,
          status: "Pending",
        };

        const { error } = await supabase.from("orders").insert([orderPayload]);
        if (error) {
          console.warn("Supabase order insert warning:", error.message);
        }

        // Reduce stock in Supabase products table
        for (const item of items) {
          try {
            const { data: prod } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.productId)
              .maybeSingle();

            if (prod && typeof prod.stock === "number") {
              const newStock = Math.max(0, prod.stock - item.quantity);
              await supabase.from("products").update({ stock: newStock }).eq("id", item.productId);
            }
          } catch {
            // Ignore stock decrement errors on guest client
          }
        }
      }

      // Always save to unified admin order storage so admin sees it in real time
      await addUnifiedOrder({
        id: `ord_${Date.now()}`,
        order_number: id,
        customer_name: f.fullName.trim(),
        customer_phone: f.phone.trim(),
        customer_email: user?.email || null,
        customer_address: `${f.address.trim()}, ${f.area ? f.area.trim() + ", " : ""}${f.district}, ${f.division}`,
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          image: it.image,
          price: it.price,
          quantity: it.quantity,
          color: it.color || null,
          size: it.size || null,
        })),
        subtotal: t.subtotal,
        delivery_charge: t.delivery,
        total: t.total,
        payment_method: payment,
        status: "Pending",
        admin_note: null,
        created_at: new Date().toISOString(),
      });

      // 2. Add to local client store for instant local history
      addOrder({
        id,
        createdAt: new Date().toISOString(),
        items,
        address: f,
        payment,
        ...t,
        status: "Pending",
      });

      clear();
      toast.success(`Order ${id} placed successfully!`);
      setPlacedOrderNumber(id);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Could not complete order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (k: keyof typeof f, label: string) => (
    <label className="block text-sm">
      {label}
      <input
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        className="mt-1 h-11 w-full rounded-xl bg-muted px-3 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );

  return (
    <>
      <TopBar title="Checkout" />
      <Container className="lg:py-10">
        <form onSubmit={place} className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Delivery Address</h2>
            {field("fullName", "Full Name *")}
            {field("phone", "Phone Number * (01XXXXXXXXX)")}
            {field("address", "Address *")}
            {field("area", "Area")}
            <h2 className="pt-4 text-lg font-bold">Payment Method</h2>
            {payments.map((p) => (
              <label
                key={p}
                className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${payment === p ? "border-primary font-semibold" : ""}`}
              >
                <input type="radio" checked={payment === p} onChange={() => setPayment(p)} /> {p}
              </label>
            ))}
          </div>
          <aside className="mt-6 space-y-2 rounded-xl border p-5 text-sm lg:mt-0 lg:self-start">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatTaka(t.subtotal)}</span>
            </div>
            {t.discount > 0 && (
              <div className="flex justify-between">
                <span>Coupon</span>
                <span>-{formatTaka(t.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{t.delivery ? formatTaka(t.delivery) : "Free"}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatTaka(t.total)}</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Processing...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </aside>
        </form>
      </Container>
    </>
  );
}
