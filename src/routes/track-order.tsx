import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Container, TopBar } from "@/components/shop";
import { formatTaka } from "@/lib/pricing";
import { seo } from "@/lib/seo";
import { supabase, isSupabaseConfigured, type DbOrder } from "@/lib/supabase";
import { useOrders } from "@/store";

export const Route = createFileRoute("/track-order")({
  head: () => seo("Track Order", "Track the status of your NEXORA delivery."),
  component: TrackOrderPage,
});

const STATUS_STEPS = [
  { key: "Pending", label: "Order Placed", desc: "We have received your order." },
  { key: "Confirmed", label: "Confirmed", desc: "Your order is confirmed and queued." },
  { key: "Processing", label: "Processing", desc: "Your items are being packed." },
  { key: "Shipped", label: "Shipped", desc: "Handed over to delivery courier." },
  { key: "Delivered", label: "Delivered", desc: "Successfully delivered to your address." },
];

function TrackOrderPage() {
  const localOrders = useOrders((s) => s.orders);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [order, setOrder] = useState<DbOrder | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = orderNumber.trim();
    const cleanPhone = phone.trim();

    if (!cleanNum || !cleanPhone) {
      toast.error("Please enter both Order Number and Phone Number");
      return;
    }

    setSearching(true);
    setSearched(true);

    try {
      let found: DbOrder | null = null;

      // 1. Check in Supabase if configured
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .ilike("order_number", cleanNum)
          .eq("customer_phone", cleanPhone)
          .maybeSingle();

        if (!error && data) {
          found = data as DbOrder;
        }
      }

      // 2. Check in local storage store as fallback
      if (!found) {
        const local = localOrders.find(
          (o) =>
            o.id.toLowerCase() === cleanNum.toLowerCase() &&
            o.address?.phone?.replace(/\s/g, "") === cleanPhone.replace(/\s/g, ""),
        );
        if (local) {
          found = {
            id: local.id,
            order_number: local.id,
            customer_name: local.address.fullName,
            customer_phone: local.address.phone,
            customer_email: null,
            customer_address: `${local.address.address}, ${local.address.area ? local.address.area + ", " : ""}${local.address.district}`,
            items: local.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              image: i.image,
              price: i.price,
              quantity: i.quantity,
              color: i.color,
              size: i.size,
            })),
            subtotal: local.subtotal,
            delivery_charge: local.delivery,
            total: local.total,
            payment_method: local.payment,
            status: local.status,
            admin_note: null,
            created_at: local.createdAt,
          };
        }
      }

      setOrder(found);
      if (!found) {
        toast.error("No order found with matching details. Please verify your info.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error looking up order");
    } finally {
      setSearching(false);
    }
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    if (currentStatus === "Cancelled") return "cancelled";
    const orderIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
    const stepIndex = STATUS_STEPS.findIndex((s) => s.key === stepKey);
    if (stepIndex < orderIndex) return "completed";
    if (stepIndex === orderIndex) return "active";
    return "upcoming";
  };

  return (
    <>
      <TopBar title="Track Order" />
      <Container className="max-w-2xl py-6 lg:py-12">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Package className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Track Your Order
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your order number (e.g. #NX123456) and the phone number used at checkout
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="mt-6 rounded-2xl border bg-card p-5 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">Order Number</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="#NX123456"
                className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={searching}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Search className="size-4" /> Track Status
              </>
            )}
          </button>
        </form>

        {/* Search Result */}
        {order ? (
          <div className="mt-6 space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <div>
                <span className="text-xs text-muted-foreground">Order Number</span>
                <p className="text-lg font-bold font-mono text-foreground">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  order.status === "Delivered"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : order.status === "Shipped"
                      ? "bg-blue-500/10 text-blue-600"
                      : order.status === "Cancelled"
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {order.status}
              </span>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Delivery Progress
              </h2>
              {order.status === "Cancelled" ? (
                <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300">
                  <XCircle className="size-6 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Order Cancelled</p>
                    <p className="text-xs">
                      This order has been cancelled. If you have questions, please contact support.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                  {STATUS_STEPS.map((step) => {
                    const status = getStepStatus(step.key, order.status);
                    return (
                      <div key={step.key} className="relative flex items-start gap-3">
                        <span
                          className={`absolute -left-6 grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                            status === "completed"
                              ? "bg-primary text-primary-foreground"
                              : status === "active"
                                ? "bg-primary ring-4 ring-primary/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {status === "completed" ? "✓" : ""}
                        </span>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              status === "active" || status === "completed"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items summary */}
            <div className="border-t pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Items ({order.items?.length || 0})
              </h3>
              <div className="space-y-2">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={it.image}
                        alt={it.name}
                        className="size-8 rounded-md object-cover bg-muted"
                      />
                      <div>
                        <p className="font-medium">{it.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Qty: {it.quantity} {it.color && `· ${it.color}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">{formatTaka(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between border-t pt-2 text-sm font-bold">
                <span>Total Amount</span>
                <span>{formatTaka(order.total)}</span>
              </div>
            </div>
          </div>
        ) : searched && !searching ? (
          <div className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No order found matching order number{" "}
            <span className="font-mono font-bold text-foreground">{orderNumber}</span> and phone{" "}
            <span className="font-mono font-bold text-foreground">{phone}</span>.
          </div>
        ) : null}
      </Container>
    </>
  );
}
