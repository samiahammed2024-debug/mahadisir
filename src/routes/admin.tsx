import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Upload,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Search,
  Database,
  Filter,
  LogOut,
  Menu,
  X,
  Phone,
  MessageCircle,
  Mail,
  Printer,
  Download,
  Eye,
  EyeOff,
  TrendingUp,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { formatTaka } from "@/lib/pricing";
import { seo } from "@/lib/seo";
import {
  supabase,
  useAuth,
  setSessionAdmin,
  isSessionAdmin,
  isSupabaseConfigured,
  type DbOrder,
  type DbProduct,
  type DbMessage,
  type DbSettings,
} from "@/lib/supabase";
import {
  uploadProductImage,
  seedProductsToSupabase,
  fetchUnifiedProducts,
  saveUnifiedProduct,
  deleteUnifiedProduct,
  fetchUnifiedOrders,
  updateUnifiedOrderStatus,
  deleteUnifiedOrder,
  fetchUnifiedMessages,
  markUnifiedMessageRead,
  deleteUnifiedMessage,
} from "@/lib/products-service";

export const Route = createFileRoute("/admin")({
  head: () => seo("Admin Dashboard", "NEXORA Store Management."),
  component: AdminPage,
});

type AdminSection = "dashboard" | "products" | "orders" | "messages" | "settings" | "database";

export function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, refreshRole } = useAuth();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto logout timer (60 minutes of inactivity)
  const lastActivityRef = useRef<number>(Date.now());
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    const checkInterval = setInterval(() => {
      const inactiveMinutes = (Date.now() - lastActivityRef.current) / (1000 * 60);
      if (inactiveMinutes >= 60) {
        toast.info("Session expired due to 60 minutes of inactivity.");
        setSessionAdmin(false);
        void supabase.auth.signOut();
        void navigate({ to: "/admin-login" });
      }
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearInterval(checkInterval);
    };
  }, [navigate]);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !isAdmin && !isSessionAdmin()) {
      void navigate({ to: "/admin-login" });
    }
  }, [isAdmin, authLoading, navigate]);

  // Orders State
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateRange, setOrderDateRange] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  // Products State
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productPage, setProductPage] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [inlinePriceEditId, setInlinePriceEditId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState("");
  const [seeding, setSeeding] = useState(false);

  // Product Form state
  const [pName, setPName] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pCategory, setPCategory] = useState("electronics");
  const [pNewCategory, setPNewCategory] = useState("");
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [pPrice, setPPrice] = useState("");
  const [pOldPrice, setPOldPrice] = useState("");
  const [pStock, setPStock] = useState("10");
  const [pDescription, setPDescription] = useState("");
  const [pColors, setPColors] = useState<string[]>(["Black", "Silver"]);
  const [colorInput, setColorInput] = useState("");
  const [pSizes, setPSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [pImages, setPImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [pIsActive, setPIsActive] = useState(true);
  const [pIsFeatured, setPIsFeatured] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Messages State
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread" | "read">("all");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<DbMessage | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState<DbSettings>({
    id: "default",
    store_name: "NEXORA",
    contact_phone: "+880 1700-000000",
    delivery_charge: 60,
    free_delivery_minimum: 2000,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch functions using unified storage (Supabase + Local fallback)
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchUnifiedOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchUnifiedProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const data = await fetchUnifiedMessages();
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (!error && data) {
        setSettingsForm({
          id: data.id,
          store_name: data.store_name || "NEXORA",
          contact_phone: data.contact_phone || "+880 1700-000000",
          delivery_charge: Number(data.delivery_charge ?? 60),
          free_delivery_minimum: Number(data.free_delivery_minimum ?? 2000),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initial load & Supabase Realtime Channels
  useEffect(() => {
    const hasAdminAccess = isAdmin || isSessionAdmin();
    if (!hasAdminAccess) return;

    void fetchOrders();
    void fetchProducts();
    void fetchMessages();
    void fetchSettings();

    // Listen for local order / message / product events
    const handleLocalOrderUpdate = () => void fetchOrders();
    const handleLocalMsgUpdate = () => void fetchMessages();
    const handleLocalProdUpdate = () => void fetchProducts();

    window.addEventListener("nexora_orders_updated", handleLocalOrderUpdate);
    window.addEventListener("nexora_messages_updated", handleLocalMsgUpdate);
    window.addEventListener("nexora_products_updated", handleLocalProdUpdate);

    if (!isSupabaseConfigured) {
      return () => {
        window.removeEventListener("nexora_orders_updated", handleLocalOrderUpdate);
        window.removeEventListener("nexora_messages_updated", handleLocalMsgUpdate);
        window.removeEventListener("nexora_products_updated", handleLocalProdUpdate);
      };
    }

    // Realtime channel for orders
    const ordersChannel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const newOrd = payload.new as DbOrder;
        setOrders((prev) => [newOrd, ...prev.filter((o) => o.id !== newOrd.id)]);
        setNewOrderIds((prev) => new Set(prev).add(newOrd.id));
        toast.info(`🎉 New Order Received: ${newOrd.order_number}`, {
          description: `${newOrd.customer_name} · ${formatTaka(newOrd.total)}`,
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as DbOrder;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      })
      .subscribe();

    // Realtime channel for messages
    const messagesChannel = supabase
      .channel("admin-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
          toast.info(`📩 New Message from ${newMsg.name}`, {
            description: newMsg.subject || newMsg.message.substring(0, 40),
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as DbMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("nexora_orders_updated", handleLocalOrderUpdate);
      window.removeEventListener("nexora_messages_updated", handleLocalMsgUpdate);
      window.removeEventListener("nexora_products_updated", handleLocalProdUpdate);
      void supabase.removeChannel(ordersChannel);
      void supabase.removeChannel(messagesChannel);
    };
  }, [isAdmin, fetchOrders, fetchProducts, fetchMessages, fetchSettings]);

  // Image compressor before upload (max width 1200px, max 5MB)
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only images are allowed.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File exceeds 5MB size limit.");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }),
                );
              } else {
                resolve(file);
              }
            },
            "image/webp",
            0.85,
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const compressed = await compressImage(file);
        const url = await uploadProductImage(compressed);
        uploadedUrls.push(url);
      }
      setPImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Add/Edit Product save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return toast.error("Product name is required");
    if (!pPrice || Number(pPrice) <= 0) return toast.error("Valid price is required");

    const category = isCreatingNewCat && pNewCategory.trim() ? pNewCategory.trim() : pCategory;
    const priceNum = Number(pPrice);
    const oldPriceNum = pOldPrice ? Number(pOldPrice) : null;
    const discount =
      oldPriceNum && oldPriceNum > priceNum
        ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
        : null;

    const slug =
      pSlug.trim() ||
      pName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const payload = {
      name: pName.trim(),
      slug,
      category: category.toLowerCase(),
      price: priceNum,
      old_price: oldPriceNum,
      discount_percent: discount,
      stock: Number(pStock) || 0,
      description: pDescription.trim(),
      colors: pColors,
      sizes: pSizes,
      images:
        pImages.length > 0
          ? pImages
          : [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=75",
            ],
      is_active: pIsActive,
      is_featured: pIsFeatured,
      updated_at: new Date().toISOString(),
    };

    setSavingProduct(true);
    try {
      const saved = await saveUnifiedProduct({
        ...payload,
        id: editingProduct?.id,
      });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      toast.success(
        editingProduct ? "Product updated successfully!" : "Product created successfully!",
      );
      void fetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSavingProduct(false);
    }
  };

  // Quick Inline Price Edit
  const handleSaveInlinePrice = async (productId: string) => {
    const val = Number(inlinePriceVal);
    if (isNaN(val) || val <= 0) {
      setInlinePriceEditId(null);
      return;
    }
    try {
      const existing = products.find((p) => p.id === productId);
      if (existing) {
        await saveUnifiedProduct({ ...existing, price: val });
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, price: val } : p)));
        toast.success("Price updated instantly!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setInlinePriceEditId(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (prod: DbProduct) => {
    if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) return;
    try {
      await deleteUnifiedProduct(String(prod.id));
      toast.success("Product deleted successfully");
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(prod.id)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting product");
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: DbOrder["status"],
    adminNote?: string,
  ) => {
    try {
      await updateUnifiedOrderStatus(orderId, status, adminNote);
      toast.success(`Order status updated to ${status}`);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.order_number === orderId
            ? { ...o, status, ...(adminNote !== undefined ? { admin_note: adminNote } : {}) }
            : o,
        ),
      );
      if (
        selectedOrder &&
        (selectedOrder.id === orderId || selectedOrder.order_number === orderId)
      ) {
        setSelectedOrder((prev) =>
          prev
            ? { ...prev, status, ...(adminNote !== undefined ? { admin_note: adminNote } : {}) }
            : null,
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update order");
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}? This action cannot be undone.`)) return;
    try {
      await deleteUnifiedOrder(orderId);
      toast.success(`Order ${orderNumber} deleted`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId && o.order_number !== orderId));
      if (selectedOrder?.id === orderId || selectedOrder?.order_number === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  // Export orders to CSV
  const exportOrdersToCsv = (orderList: DbOrder[]) => {
    if (orderList.length === 0) return toast.info("No orders to export");
    const headers = [
      "Order #",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Address",
      "Items Count",
      "Subtotal",
      "Delivery",
      "Total",
      "Payment",
      "Status",
      "Note",
    ];
    const rows = orderList.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleString(),
      `"${o.customer_name.replace(/"/g, '""')}"`,
      `"${o.customer_phone}"`,
      o.customer_email || "",
      `"${o.customer_address.replace(/"/g, '""')}"`,
      o.items?.length || 0,
      o.subtotal,
      o.delivery_charge,
      o.total,
      o.payment_method,
      o.status,
      `"${(o.admin_note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexora_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to CSV!");
  };

  // Print invoice
  const printInvoice = (ord: DbOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups to print invoices");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${ord.order_number}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #f4f4f5; padding: 10px; font-size: 12px; }
          td { padding: 10px; border-bottom: 1px solid #e4e4e7; }
          .total { margin-top: 20px; float: right; width: 250px; }
          .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #111; padding-top: 6px; }
          .footer { margin-top: 80px; text-align: center; color: #71717a; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">NEXORA</div>
            <div>Everyday Discovery</div>
            <div>Gulshan-1, Dhaka 1212, Bangladesh</div>
            <div>support@nexora.com.bd | +880 1700-000000</div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0;">INVOICE</h2>
            <div><strong>Order:</strong> ${ord.order_number}</div>
            <div><strong>Date:</strong> ${new Date(ord.created_at).toLocaleDateString()}</div>
            <div><strong>Status:</strong> ${ord.status}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <strong>BILL TO:</strong><br/>
            ${ord.customer_name}<br/>
            Phone: ${ord.customer_phone}<br/>
            ${ord.customer_email ? "Email: " + ord.customer_email + "<br/>" : ""}
            Address: ${ord.customer_address}
          </div>
          <div style="text-align: right;">
            <strong>PAYMENT DETAILS:</strong><br/>
            Method: ${ord.payment_method}<br/>
            Payment Status: ${ord.status === "Delivered" ? "Paid" : "Pending / COD"}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Options</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${ord.items
              .map(
                (item) => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${[item.color, item.size].filter(Boolean).join(" / ") || "—"}</td>
                <td>${item.quantity}</td>
                <td>৳${item.price.toLocaleString()}</td>
                <td style="text-align: right;">৳${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="total">
          <div class="total-row"><span>Subtotal:</span><span>৳${ord.subtotal.toLocaleString()}</span></div>
          <div class="total-row"><span>Delivery:</span><span>৳${ord.delivery_charge.toLocaleString()}</span></div>
          <div class="total-row grand"><span>Total:</span><span>৳${ord.total.toLocaleString()}</span></div>
        </div>

        <div style="clear: both;"></div>

        <div class="footer">
          Thank you for choosing NEXORA! For any inquiries, please contact our support.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Message click -> open and auto mark read
  const handleOpenMessage = async (msg: DbMessage) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      try {
        await markUnifiedMessageRead(msg.id, true);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Toggle message read/unread
  const handleToggleMessageRead = async (id: string, current: boolean) => {
    try {
      await markUnifiedMessageRead(id, !current);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: !current } : m)));
      toast.success(current ? "Marked as unread" : "Marked as read");
    } catch (e) {
      console.error(e);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteUnifiedMessage(id);
      toast.success("Message deleted");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        id: "default",
        store_name: settingsForm.store_name,
        contact_phone: settingsForm.contact_phone,
        delivery_charge: Number(settingsForm.delivery_charge),
        free_delivery_minimum: Number(settingsForm.free_delivery_minimum),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Store settings updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      return toast.error("New password must be at least 4 characters");
    }
    setChangingPassword(true);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from("settings")
          .update({ admin_passcode: newPassword, updated_at: new Date().toISOString() })
          .eq("id", "default");
      }
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {
        // ignore
      }
      toast.success("Admin password updated successfully!");
      setNewPassword("");
      setCurrentPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Seed default products
  const handleSeed = async () => {
    if (!confirm("Seed initial 15 catalog products to Supabase?")) return;
    setSeeding(true);
    try {
      const res = await seedProductsToSupabase();
      toast.success(`Seeded ${res.count} products to database!`);
      void fetchProducts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== "All" && o.status !== orderFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      const match =
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q);
      if (!match) return false;
    }
    if (orderDateRange !== "all") {
      const ordDate = new Date(o.created_at).getTime();
      const now = Date.now();
      if (orderDateRange === "today" && now - ordDate > 24 * 3600 * 1000) return false;
      if (orderDateRange === "7days" && now - ordDate > 7 * 24 * 3600 * 1000) return false;
      if (orderDateRange === "30days" && now - ordDate > 30 * 24 * 3600 * 1000) return false;
    }
    return true;
  });

  // Filtered Products
  const categoriesList = Array.from(
    new Set([
      "electronics",
      "fashion",
      "home",
      "beauty",
      "sports",
      ...products.map((p) => p.category),
    ]),
  );
  const filteredProducts = products.filter((p) => {
    if (
      productCategoryFilter !== "all" &&
      p.category.toLowerCase() !== productCategoryFilter.toLowerCase()
    )
      return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Messages
  const filteredMessages = messages.filter((m) => {
    if (messageFilter === "unread" && m.is_read) return false;
    if (messageFilter === "read" && !m.is_read) return false;
    if (messageSearch) {
      const q = messageSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Metrics
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
  const unreadMessagesCount = messages.filter((m) => !m.is_read).length;
  const totalDeliveredRevenue = orders
    .filter((o) => o.status === "Delivered")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // 7-day Sales calculation for dashboard chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayTotal = orders
      .filter((o) => o.created_at.startsWith(dayStr) && o.status !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { date: dayStr, label, total: dayTotal };
  });
  const maxDayTotal = Math.max(...last7Days.map((d) => d.total), 1000);

  const firstAdminSnippet = `-- Run in Supabase SQL Editor once after signing up:
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = '${user?.email || "YOUR_EMAIL@EXAMPLE.COM"}' LIMIT 1),
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;`;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* ---------------- FIXED LEFT SIDEBAR (DESKTOP) ---------------- */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r bg-card p-5 lg:flex">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <Link to="/" className="text-xl font-extrabold tracking-[0.2em] text-foreground">
              NEXORA
            </Link>
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              ADMIN
            </span>
          </div>

          <nav className="space-y-1.5 text-sm font-medium">
            <button
              type="button"
              onClick={() => setSection("dashboard")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                section === "dashboard"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="size-4" /> Dashboard
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSection("products")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                section === "products"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="size-4" /> Products
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${section === "products" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSection("orders")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                section === "orders"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-4" /> Orders
              </div>
              {pendingOrdersCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingOrdersCount}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${section === "orders" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSection("messages")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                section === "messages"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="size-4" /> Messages
              </div>
              {unreadMessagesCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSection("settings")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                section === "settings"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="size-4" /> Settings
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSection("database")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                section === "database"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="size-4" /> SQL / First Admin
              </div>
            </button>
          </nav>
        </div>

        <div className="border-t pt-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-4" /> View Website
          </Link>
          <button
            type="button"
            onClick={async () => {
              setSessionAdmin(false);
              await supabase.auth.signOut();
              void navigate({ to: "/admin-login" });
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ---------------- MOBILE DRAWER OVERLAY ---------------- */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex w-72 flex-col justify-between bg-card p-5 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="font-extrabold tracking-wider">NEXORA ADMIN</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1 hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="space-y-1.5 text-sm font-medium">
                {(
                  ["dashboard", "products", "orders", "messages", "settings", "database"] as const
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSection(s);
                      setMobileDrawerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 capitalize transition-colors ${
                      section === s
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{s}</span>
                    {s === "orders" && pendingOrdersCount > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                        {pendingOrdersCount}
                      </span>
                    )}
                    {s === "messages" && unreadMessagesCount > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="size-4" /> View Store
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  void navigate({ to: "/admin-login" });
                }}
                className="flex items-center gap-2 text-xs text-destructive"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="grid size-10 place-items-center rounded-xl border hover:bg-muted lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-lg font-bold capitalize text-foreground">{section}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 sm:inline-flex">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live Supabase
            </span>
            <div className="text-right text-xs">
              <p className="font-semibold text-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Administrator</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* ======================= DASHBOARD SECTION ======================= */}
          {section === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border bg-card p-4 shadow-xs">
                  <span className="text-xs font-medium text-muted-foreground">Total Products</span>
                  <p className="mt-2 text-2xl font-extrabold">{products.length}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {products.filter((p) => p.is_active).length} active in store
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-xs">
                  <span className="text-xs font-medium text-muted-foreground">Total Orders</span>
                  <p className="mt-2 text-2xl font-extrabold">{orders.length}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">All time customer orders</p>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
                  <span className="text-xs font-semibold text-amber-600">Pending Orders</span>
                  <p className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                    {pendingOrdersCount}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Needs processing</p>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-xs">
                  <span className="text-xs font-medium text-muted-foreground">Unread Messages</span>
                  <p className="mt-2 text-2xl font-extrabold">{unreadMessagesCount}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Customer inquiries</p>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-xs sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Sales (Delivered)
                  </span>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                    {formatTaka(totalDeliveredRevenue)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Sum of delivered orders</p>
                </div>
              </div>

              {/* 7-Day Sales Chart */}
              <div className="rounded-2xl border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Sales (Last 7 Days)</h2>
                    <p className="text-xs text-muted-foreground">
                      Daily revenue from completed orders
                    </p>
                  </div>
                  <TrendingUp className="size-5 text-emerald-600" />
                </div>
                <div className="mt-4 flex h-36 items-end gap-3 pt-6">
                  {last7Days.map((d) => {
                    const heightPercent = Math.max(8, Math.round((d.total / maxDayTotal) * 100));
                    return (
                      <div
                        key={d.date}
                        className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
                      >
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {d.total > 0 ? `৳${Math.round(d.total / 1000)}k` : "৳0"}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[40px] rounded-t-lg bg-primary transition-all duration-500 hover:bg-primary/80"
                        />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Orders & Messages Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Orders */}
                <div className="rounded-2xl border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-sm">Recent Orders</h3>
                    <button
                      type="button"
                      onClick={() => setSection("orders")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View all ({orders.length})
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">No orders yet.</p>
                  ) : (
                    <div className="mt-3 divide-y">
                      {orders.slice(0, 5).map((ord) => (
                        <div
                          key={ord.id}
                          className="flex items-center justify-between py-2.5 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono">{ord.order_number}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  ord.status === "Delivered"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-0.5">
                              {ord.customer_name} · {ord.customer_phone}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatTaka(ord.total)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(ord);
                                setSection("orders");
                              }}
                              className="rounded-lg border px-2 py-1 text-[11px] font-medium hover:bg-muted"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="rounded-2xl border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-sm">Recent Messages</h3>
                    <button
                      type="button"
                      onClick={() => setSection("messages")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View all ({messages.length})
                    </button>
                  </div>
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      No messages yet.
                    </p>
                  ) : (
                    <div className="mt-3 divide-y">
                      {messages.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            void handleOpenMessage(m);
                            setSection("messages");
                          }}
                          className="flex cursor-pointer items-center justify-between py-2.5 text-xs hover:bg-muted/30 rounded-lg px-2"
                        >
                          <div className="flex items-center gap-2.5">
                            {!m.is_read ? (
                              <span className="size-2 rounded-full bg-rose-500 shrink-0" />
                            ) : (
                              <span className="size-2 rounded-full bg-muted shrink-0" />
                            )}
                            <div>
                              <p
                                className={`font-semibold ${!m.is_read ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {m.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {m.subject || m.message}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= PRODUCTS SECTION ======================= */}
          {section === "products" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="h-9 w-full rounded-xl bg-muted pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="h-9 rounded-xl border bg-background px-3 text-xs capitalize outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {products.length === 0 && (
                    <button
                      type="button"
                      onClick={handleSeed}
                      disabled={seeding}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {seeding ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Database className="size-3.5" />
                      )}
                      Seed Initial 15 Products
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setPName("");
                      setPSlug("");
                      setPCategory("electronics");
                      setPNewCategory("");
                      setIsCreatingNewCat(false);
                      setPPrice("");
                      setPOldPrice("");
                      setPStock("15");
                      setPDescription("");
                      setPColors(["Black", "Silver"]);
                      setPSizes([]);
                      setPImages([]);
                      setPIsActive(true);
                      setPIsFeatured(false);
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="size-4" /> Add Product
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
                  No products found. Click "+ Add Product" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price (Click to Edit)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Featured</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredProducts.map((p) => {
                        const img =
                          p.images?.[0] ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=75";
                        return (
                          <tr key={p.id} className="hover:bg-muted/20">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={img}
                                  alt={p.name}
                                  className="size-10 rounded-lg object-cover bg-muted shrink-0"
                                />
                                <div>
                                  <p className="font-semibold text-foreground line-clamp-1">
                                    {p.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {p.slug}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 capitalize">{p.category}</td>
                            <td className="p-3">
                              {inlinePriceEditId === p.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={inlinePriceVal}
                                    onChange={(e) => setInlinePriceVal(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") void handleSaveInlinePrice(p.id);
                                      if (e.key === "Escape") setInlinePriceEditId(null);
                                    }}
                                    autoFocus
                                    className="h-7 w-20 rounded border bg-background px-2 text-xs font-bold"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleSaveInlinePrice(p.id)}
                                    className="rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlinePriceEditId(p.id);
                                    setInlinePriceVal(String(p.price));
                                  }}
                                  className="group flex items-center gap-1 font-bold hover:underline"
                                  title="Click to edit price inline"
                                >
                                  <span>{formatTaka(Number(p.price))}</span>
                                  <Edit2 className="size-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                                </button>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={p.stock === 0 ? "font-bold text-rose-600" : ""}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = { ...p, is_active: !p.is_active };
                                  await saveUnifiedProduct(updated);
                                  setProducts((prev) =>
                                    prev.map((item) => (item.id === p.id ? updated : item)),
                                  );
                                }}
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  p.is_active
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {p.is_active ? "Active" : "Hidden"}
                              </button>
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = { ...p, is_featured: !p.is_featured };
                                  await saveUnifiedProduct(updated);
                                  setProducts((prev) =>
                                    prev.map((item) => (item.id === p.id ? updated : item)),
                                  );
                                }}
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  p.is_featured
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {p.is_featured ? "Featured" : "Normal"}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setPName(p.name);
                                    setPSlug(p.slug);
                                    setPCategory(p.category);
                                    setPNewCategory("");
                                    setIsCreatingNewCat(false);
                                    setPPrice(String(p.price));
                                    setPOldPrice(p.old_price ? String(p.old_price) : "");
                                    setPStock(String(p.stock));
                                    setPDescription(p.description || "");
                                    setPColors(Array.isArray(p.colors) ? p.colors : []);
                                    setPSizes(Array.isArray(p.sizes) ? p.sizes : []);
                                    setPImages(Array.isArray(p.images) ? p.images : []);
                                    setPIsActive(p.is_active);
                                    setPIsFeatured(p.is_featured);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="grid size-7 place-items-center rounded-lg border hover:bg-accent"
                                  title="Edit Product"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteProduct(p)}
                                  className="grid size-7 place-items-center rounded-lg border hover:bg-destructive/10 hover:text-destructive"
                                  title="Delete Product"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= ORDERS SECTION ======================= */}
          {section === "orders" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    "All",
                    "Pending",
                    "Confirmed",
                    "Processing",
                    "Shipped",
                    "Delivered",
                    "Cancelled",
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderFilter(st)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        orderFilter === st
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st}{" "}
                      {st !== "All" && (
                        <span className="opacity-75">
                          ({orders.filter((o) => o.status === st).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search order #, phone..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="h-9 w-48 rounded-xl bg-muted pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring sm:w-60"
                    />
                  </div>

                  <select
                    value={orderDateRange}
                    onChange={(e) => setOrderDateRange(e.target.value)}
                    className="h-9 rounded-xl border bg-background px-2.5 text-xs outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => exportOrdersToCsv(filteredOrders)}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border bg-background px-3 text-xs font-semibold hover:bg-muted"
                    title="Export to CSV"
                  >
                    <Download className="size-3.5" /> CSV
                  </button>
                </div>
              </div>

              {loadingOrders ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
                  No orders match your filter criteria.
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredOrders.map((ord) => {
                    const isNew = newOrderIds.has(ord.id);
                    return (
                      <div
                        key={ord.id}
                        className={`flex flex-col justify-between gap-4 rounded-2xl border bg-card p-4 transition-all hover:shadow-xs sm:flex-row sm:items-center ${
                          isNew ? "ring-2 ring-emerald-500/50 bg-emerald-500/5" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold font-mono text-foreground text-sm">
                              {ord.order_number}
                            </span>
                            {isNew && (
                              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white animate-pulse">
                                NEW
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                ord.status === "Delivered"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : ord.status === "Shipped"
                                    ? "bg-indigo-500/10 text-indigo-600"
                                    : ord.status === "Processing"
                                      ? "bg-purple-500/10 text-purple-600"
                                      : ord.status === "Confirmed"
                                        ? "bg-blue-500/10 text-blue-600"
                                        : ord.status === "Cancelled"
                                          ? "bg-rose-500/10 text-rose-600"
                                          : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {ord.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ord.created_at).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-sm font-semibold">
                            {ord.customer_name} ·{" "}
                            <span className="font-mono text-xs font-normal">
                              {ord.customer_phone}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            📍 {ord.customer_address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Payment: <strong>{ord.payment_method}</strong> ·{" "}
                            {ord.items?.length || 0} item(s)
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="text-base font-extrabold">{formatTaka(ord.total)}</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                void handleUpdateOrderStatus(
                                  ord.id,
                                  e.target.value as DbOrder["status"],
                                )
                              }
                              className="h-8 rounded-lg border bg-background px-2 text-xs font-semibold outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="h-8 rounded-lg border bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================= MESSAGES SECTION ======================= */}
          {section === "messages" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  {(["all", "unread", "read"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMessageFilter(m)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        messageFilter === m
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="h-9 w-60 rounded-xl bg-muted pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {loadingMessages ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
                  No messages found.
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => void handleOpenMessage(msg)}
                      className={`cursor-pointer rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 ${
                        !msg.is_read ? "border-primary/40 bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                          {!msg.is_read ? (
                            <span className="size-2.5 rounded-full bg-rose-500 shrink-0" />
                          ) : (
                            <span className="size-2.5 rounded-full bg-muted shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-sm text-foreground">{msg.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground font-mono">
                              {msg.phone}
                            </span>
                            {msg.email && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({msg.email})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleToggleMessageRead(msg.id, msg.is_read);
                            }}
                            className="rounded-lg border px-2 py-1 text-[11px] font-medium hover:bg-accent"
                          >
                            Mark {msg.is_read ? "Unread" : "Read"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteMessage(msg.id);
                            }}
                            className="grid size-7 place-items-center rounded-lg border hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {msg.subject && (
                        <p className="mt-2 text-xs font-semibold text-foreground">
                          Subject: {msg.subject}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-foreground/80 line-clamp-2">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================= SETTINGS SECTION ======================= */}
          {section === "settings" && (
            <div className="grid gap-6 max-w-4xl lg:grid-cols-2">
              {/* Store Details Form */}
              <div className="rounded-2xl border bg-card p-6 shadow-xs">
                <h2 className="text-base font-bold text-foreground">Store Details & Delivery</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure store info saved in Supabase <code className="font-mono">settings</code>{" "}
                  table.
                </p>

                <form onSubmit={handleSaveSettings} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-medium">Store Name</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.store_name}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, store_name: e.target.value })
                      }
                      className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block font-medium">Contact Phone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.contact_phone}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, contact_phone: e.target.value })
                      }
                      className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium">Delivery Charge (৳)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.delivery_charge}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            delivery_charge: Number(e.target.value),
                          })
                        }
                        className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Free Delivery Minimum (৳)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.free_delivery_minimum}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            free_delivery_minimum: Number(e.target.value),
                          })
                        }
                        className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Save Store Settings"
                    )}
                  </button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="rounded-2xl border bg-card p-6 shadow-xs">
                <h2 className="text-base font-bold text-foreground">Change Admin Password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your Supabase authentication password securely.
                </p>

                <form onSubmit={handleChangePassword} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-medium">Current User</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || ""}
                      className="mt-1 h-9 w-full rounded-xl bg-muted/50 px-3 text-sm opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block font-medium">New Password (min 6 chars)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ======================= DATABASE SECTION ======================= */}
          {section === "database" && (
            <div className="space-y-6 max-w-4xl">
              <div className="rounded-2xl border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-base font-bold">First Admin Role Setup</h2>
                    <p className="text-xs text-muted-foreground">
                      Run this query in your Supabase SQL Editor to make your email account an
                      admin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(firstAdminSnippet);
                      toast.success("SQL copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Copy className="size-3.5" /> Copy SQL
                  </button>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 font-mono text-xs text-foreground">
                  {firstAdminSnippet}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ---------------- ORDER DETAILS DRAWER / MODAL ---------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold font-mono">Order {selectedOrder.order_number}</h3>
                <p className="text-xs text-muted-foreground">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="grid size-8 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer Info & Contact Actions */}
              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Customer Info</span>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-accent"
                    >
                      <Phone className="size-3 text-emerald-600" /> Call
                    </a>
                    <a
                      href={`https://wa.me/88${selectedOrder.customer_phone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-accent"
                    >
                      <MessageCircle className="size-3 text-emerald-600" /> WhatsApp
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold">{selectedOrder.customer_name}</p>
                <p className="text-muted-foreground">Phone: {selectedOrder.customer_phone}</p>
                {selectedOrder.customer_email && (
                  <p className="text-muted-foreground">Email: {selectedOrder.customer_email}</p>
                )}
                <p className="text-muted-foreground mt-1">
                  Address: {selectedOrder.customer_address}
                </p>
                <p className="text-muted-foreground mt-1">
                  Payment Method: <strong>{selectedOrder.payment_method}</strong>
                </p>
              </div>

              {/* Status Update */}
              <div className="flex items-center justify-between rounded-xl border p-3">
                <span className="font-semibold">Update Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    void handleUpdateOrderStatus(
                      selectedOrder.id,
                      e.target.value as DbOrder["status"],
                    )
                  }
                  className="rounded-lg border bg-background px-3 py-1.5 font-bold text-xs outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Order Items */}
              <div>
                <p className="font-bold text-foreground mb-2">
                  Order Items ({selectedOrder.items?.length || 0})
                </p>
                <div className="divide-y rounded-xl border">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.image}
                          alt={it.name}
                          className="size-10 rounded-lg object-cover bg-muted shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{it.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Qty: {it.quantity} {it.color && `· ${it.color}`}{" "}
                            {it.size && `· ${it.size}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">{formatTaka(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 rounded-xl bg-muted p-3.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatTaka(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Charge</span>
                  <span>{formatTaka(selectedOrder.delivery_charge)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-sm font-extrabold text-foreground">
                  <span>Total Amount</span>
                  <span>{formatTaka(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block font-semibold mb-1">Admin Internal Note</label>
                <textarea
                  rows={2}
                  defaultValue={selectedOrder.admin_note || ""}
                  placeholder="Notes on packing, delivery courier, or customer requests..."
                  onBlur={(e) =>
                    void handleUpdateOrderStatus(
                      selectedOrder.id,
                      selectedOrder.status,
                      e.target.value,
                    )
                  }
                  className="w-full rounded-xl bg-muted p-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t pt-4">
                <button
                  type="button"
                  onClick={() => printInvoice(selectedOrder)}
                  className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3.5 py-2 font-semibold hover:bg-muted"
                >
                  <Printer className="size-3.5" /> Print Invoice
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3.5 py-2 font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" /> Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MESSAGE DETAILS MODAL ---------------- */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base">{selectedMessage.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="grid size-8 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-muted p-3">
                <p>
                  Phone: <strong>{selectedMessage.phone || "—"}</strong>
                </p>
                {selectedMessage.email && (
                  <p className="mt-1">
                    Email: <strong>{selectedMessage.email}</strong>
                  </p>
                )}
                {selectedMessage.subject && (
                  <p className="mt-1 font-semibold text-foreground">
                    Subject: {selectedMessage.subject}
                  </p>
                )}
              </div>

              <div className="rounded-xl border p-4 bg-background whitespace-pre-wrap text-sm leading-relaxed">
                {selectedMessage.message}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedMessage.phone && (
                  <>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold hover:bg-muted"
                    >
                      <Phone className="size-3.5 text-emerald-600" /> Call
                    </a>
                    <a
                      href={`https://wa.me/88${selectedMessage.phone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold hover:bg-muted"
                    >
                      <MessageCircle className="size-3.5 text-emerald-600" /> WhatsApp
                    </a>
                  </>
                )}
                {selectedMessage.email && (
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold hover:bg-muted"
                  >
                    <Mail className="size-3.5 text-blue-600" /> Reply via Email
                  </a>
                )}
                <button
                  type="button"
                  onClick={() =>
                    void handleToggleMessageRead(selectedMessage.id, selectedMessage.is_read)
                  }
                  className="rounded-xl border px-3 py-2 font-semibold hover:bg-muted ml-auto"
                >
                  Mark {selectedMessage.is_read ? "Unread" : "Read"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteMessage(selectedMessage.id)}
                  className="rounded-xl border border-destructive/30 px-3 py-2 font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD / EDIT PRODUCT MODAL ---------------- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-base">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="grid size-8 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => {
                    setPName(e.target.value);
                    if (!pSlug) {
                      setPSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, ""),
                      );
                    }
                  }}
                  className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-medium">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCat(!isCreatingNewCat)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {isCreatingNewCat ? "Choose existing" : "+ New Category"}
                    </button>
                  </div>
                  {isCreatingNewCat ? (
                    <input
                      type="text"
                      placeholder="e.g. Jewellery, Toys"
                      value={pNewCategory}
                      onChange={(e) => setPNewCategory(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl bg-muted px-2.5 text-xs capitalize outline-none"
                    >
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-medium">URL Slug</label>
                  <input
                    type="text"
                    value={pSlug}
                    onChange={(e) => setPSlug(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium">Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-xs outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium">Old Price (৳)</label>
                  <input
                    type="number"
                    value={pOldPrice}
                    onChange={(e) => setPOldPrice(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium">Stock *</label>
                  <input
                    type="number"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl bg-muted px-3 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium">Description</label>
                <textarea
                  rows={3}
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-muted p-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Colors as chips */}
              <div>
                <label className="block font-medium">Colors (Chips)</label>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-xl bg-muted p-2">
                  {pColors.map((col, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-[11px] font-medium border shadow-2xs"
                    >
                      {col}
                      <button
                        type="button"
                        onClick={() => setPColors(pColors.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add color..."
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && colorInput.trim()) {
                          e.preventDefault();
                          setPColors([...pColors, colorInput.trim()]);
                          setColorInput("");
                        }
                      }}
                      className="h-7 w-24 bg-transparent px-1 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (colorInput.trim()) {
                          setPColors([...pColors, colorInput.trim()]);
                          setColorInput("");
                        }
                      }}
                      className="rounded bg-primary px-2 py-0.5 text-[10px] text-primary-foreground font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Sizes as chips */}
              <div>
                <label className="block font-medium">Sizes (Chips)</label>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-xl bg-muted p-2">
                  {pSizes.map((sz, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-[11px] font-medium border shadow-2xs"
                    >
                      {sz}
                      <button
                        type="button"
                        onClick={() => setPSizes(pSizes.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="e.g. S, M, L..."
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && sizeInput.trim()) {
                          e.preventDefault();
                          setPSizes([...pSizes, sizeInput.trim()]);
                          setSizeInput("");
                        }
                      }}
                      className="h-7 w-24 bg-transparent px-1 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (sizeInput.trim()) {
                          setPSizes([...pSizes, sizeInput.trim()]);
                          setSizeInput("");
                        }
                      }}
                      className="rounded bg-primary px-2 py-0.5 text-[10px] text-primary-foreground font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Upload with Drag & Drop and Previews */}
              <div>
                <label className="block font-medium mb-1">Product Images (1st is Main Image)</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleFileUpload(e.dataTransfer.files);
                  }}
                  className="rounded-xl border-2 border-dashed bg-muted/30 p-4 text-center hover:bg-muted/50 transition-colors"
                >
                  <Upload className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drag & drop images here (max 5MB, auto-compressed to 1200px)
                  </p>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                    {uploadingImage ? <Loader2 className="size-3 animate-spin" /> : "Choose Files"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => void handleFileUpload(e.target.files)}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image Previews */}
                {pImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {pImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border aspect-square bg-muted"
                      >
                        <img src={img} alt="Product preview" className="size-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute left-1 top-1 rounded bg-primary px-1 py-0.5 text-[8px] font-bold text-primary-foreground">
                            MAIN
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPImages(pImages.filter((_, i) => i !== idx))}
                          className="absolute right-1 top-1 grid size-5 place-items-center rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsActive}
                    onChange={(e) => setPIsActive(e.target.checked)}
                  />
                  <span className="font-semibold">Active (Visible on store)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsFeatured}
                    onChange={(e) => setPIsFeatured(e.target.checked)}
                  />
                  <span className="font-semibold">Featured / Best Deal</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border px-4 py-2 font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingProduct ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : editingProduct ? (
                    "Save Changes"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
