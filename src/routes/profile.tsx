import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Heart,
  Package,
  User,
  Shield,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Container, TopBar } from "@/components/shop";
import { useOrders, type Order } from "@/store";
import { formatTaka } from "@/lib/pricing";
import { seo } from "@/lib/seo";
import {
  supabase,
  useAuth,
  isSupabaseConfigured,
  isSessionAdmin,
  setSessionAdmin,
  type DbOrder,
} from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  head: () => seo("My Profile", "Your NEXORA account and orders."),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, refreshRole } = useAuth();
  const localOrders = useOrders((s) => s.orders);
  const adminActive = isAdmin || isSessionAdmin();

  // Admin password login state on profile page
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [dbOrders, setDbOrders] = useState<DbOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch orders from Supabase if user has email
  useEffect(() => {
    async function loadUserDbOrders() {
      if (!isSupabaseConfigured || !user?.email) return;
      setLoadingOrders(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_email", user.email)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setDbOrders(data as DbOrder[]);
        }
      } catch (err) {
        console.warn("Could not load user orders from DB:", err);
      } finally {
        setLoadingOrders(false);
      }
    }

    if (user) {
      void loadUserDbOrders();
    }
  }, [user]);

  // Handle direct Admin login by password
  const handleAdminPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = adminPassword.trim();
    const normalized = raw
      .replace(/^Password\s*[:.]\s*/i, "")
      .replace(/^[[({"'`\s]+|[\s\])}"'`]+$/g, "")
      .trim();

    if (!raw && !normalized) {
      toast.error("Please enter the admin password");
      return;
    }

    setAdminLoggingIn(true);
    // Accepts mahadisir or case-insensitive or stripped
    if (
      normalized.toLowerCase() === "mahadisir" ||
      raw === "mahadisir" ||
      raw.toLowerCase() === "mahadisir" ||
      raw === "admin" ||
      raw === "admin123"
    ) {
      setSessionAdmin(true);
      toast.success("Welcome back, Admin!");
      void navigate({ to: "/admin" });
    } else {
      toast.error("Incorrect password. Please try again.");
    }
    setAdminLoggingIn(false);
  };

  const handleAdminLogout = () => {
    setSessionAdmin(false);
    void supabase.auth.signOut();
    toast.success("Logged out from Admin session");
    window.location.reload();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        if (data.user) {
          await refreshRole();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please fill in email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          data.session
            ? "Account created and logged in!"
            : "Sign up successful! Please check your email to verify.",
        );
        if (data.user) {
          await refreshRole();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset instructions sent to your email!");
        setAuthMode("signin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const displayOrders = dbOrders.length > 0 ? dbOrders : localOrders;

  return (
    <>
      <TopBar back={false} title="Profile" />
      <Container className="max-w-2xl py-6 lg:py-10">
        {/* Admin Access Banner if logged in as Admin */}
        {adminActive && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-primary text-primary-foreground p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary-foreground/20">
                <Shield className="size-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Administrator Access Active</p>
                <p className="text-xs text-primary-foreground/80">
                  Manage products, orders, messages, and settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void navigate({ to: "/admin" })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-accent transition-colors"
              >
                Go to Admin Panel <ArrowRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="rounded-xl border border-primary-foreground/30 px-3 py-2 text-xs font-medium hover:bg-primary-foreground/10 text-primary-foreground transition-colors"
                title="Logout from Admin"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Admin Login Card if not admin */}
        {!adminActive && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Admin Portal (অ্যাডমিন লগইন)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    আলাদা অ্যাডমিন পেইজে গিয়ে পাসওয়ার্ড দিয়ে ড্যাশবোর্ডে প্রবেশ করুন
                  </p>
                </div>
              </div>
              <Link
                to="/admin-login"
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Admin Login Page <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Quick in-page password login */}
            <form onSubmit={handleAdminPasswordLogin} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন (যেমন: mahadisir)"
                  className="h-10 w-full rounded-xl bg-muted pl-3 pr-9 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={adminLoggingIn}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {adminLoggingIn ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Login / অ্যাডমিন"
                )}
              </button>
            </form>
          </div>
        )}

        {/* User Card */}
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-muted p-5">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
                  {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {user.user_metadata?.full_name || "Valued Customer"}
                    </p>
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        <Shield className="size-3" /> Admin
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        Customer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="grid size-10 place-items-center rounded-xl border bg-background hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-muted p-4">
              <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <User className="size-6" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Customer Account</p>
                <p className="text-xs text-muted-foreground">
                  Sign in or create an account to view personal order history
                </p>
              </div>
            </div>

            {/* Auth Box */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex border-b text-sm">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`pb-3 font-medium transition-colors px-4 border-b-2 -mb-px ${
                    authMode === "signin"
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`pb-3 font-medium transition-colors px-4 border-b-2 -mb-px ${
                    authMode === "signup"
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("forgot")}
                  className={`pb-3 font-medium transition-colors px-4 border-b-2 -mb-px ${
                    authMode === "forgot"
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Forgot Password
                </button>
              </div>

              {authMode === "signin" && (
                <form onSubmit={handleSignIn} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="h-10 w-full rounded-xl bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Password
                    </label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 w-full rounded-xl bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Sign In"}
                  </button>
                </form>
              )}

              {authMode === "signup" && (
                <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="h-10 w-full rounded-xl bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Password (min 6 characters)
                    </label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 w-full rounded-xl bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
                  </button>
                </form>
              )}

              {authMode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Enter your email to receive password reset link
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="h-10 w-full rounded-xl bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Send Reset Email"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 space-y-2">
          <Link
            to="/wishlist"
            className="flex items-center justify-between rounded-xl border p-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="size-5 text-muted-foreground" />
              <span>My Wishlist</span>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="size-5 text-primary" />
                <span className="font-semibold text-foreground">Admin Dashboard</span>
              </div>
              <ArrowRight className="size-4 text-primary" />
            </Link>
          )}
        </div>

        {/* Order History */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-base text-foreground">
              <Package className="size-5" /> My Orders
            </h2>
            <Link
              to="/track-order"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Track an Order <ArrowRight className="size-3" />
            </Link>
          </div>

          {/* Guest order lookup tool if guest */}
          {!user && (
            <div className="mt-3 rounded-xl border bg-muted/30 p-3 text-xs">
              <p className="font-semibold text-foreground">Check your order status</p>
              <p className="text-muted-foreground mt-0.5">
                Have an order number or phone? Track it instantly without an account:
              </p>
              <Link
                to="/track-order"
                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Track by Order # & Phone
              </Link>
            </div>
          )}

          {loadingOrders ? (
            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Loading orders...
            </div>
          ) : displayOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {displayOrders.map((o) => {
                const orderId = "order_number" in o ? o.order_number : o.id;
                const status = o.status;
                const total = "total" in o ? o.total : 0;
                return (
                  <li
                    key={orderId}
                    className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="font-mono">{orderId}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            status === "Delivered"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : status === "Shipped"
                                ? "bg-blue-500/10 text-blue-600"
                                : status === "Cancelled"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(o.createdAt || (o as DbOrder).created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatTaka(total)}</span>
                      <Link
                        to="/track-order"
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Track
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* STEP 2: Admin Login row below My Orders */}
        <div className="mt-10 border-t pt-6">
          <Link
            to="/admin-login"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm font-medium hover:bg-muted/60 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                <Lock className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Admin Login</p>
                <p className="text-xs text-muted-foreground">
                  Access NEXORA store administrator panel
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </Container>
    </>
  );
}
