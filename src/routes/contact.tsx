import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { Container, TopBar } from "@/components/shop";
import { seo } from "@/lib/seo";
import { supabase, isSupabaseConfigured, useAuth } from "@/lib/supabase";
import { addUnifiedMessage } from "@/lib/products-service";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact", "Get in touch with NEXORA customer support."),
  component: ContactPage,
});

function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spam honeypot check
    if (honeypot.trim()) {
      // Silently ignore bots
      toast.success("Thank you! Your message has been sent. We will contact you soon.");
      return;
    }

    // 30-second cooldown check
    const lastSent = sessionStorage.getItem("contact_cooldown");
    if (lastSent) {
      const elapsed = (Date.now() - parseInt(lastSent, 10)) / 1000;
      if (elapsed < 30) {
        toast.error(
          `Please wait ${Math.ceil(30 - elapsed)} seconds before sending another message.`,
        );
        return;
      }
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write your message");
      return;
    }

    setSubmitting(true);
    try {
      await addUnifiedMessage({
        id: `msg_${Date.now()}`,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        subject: subject.trim() || null,
        message: message.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      });

      sessionStorage.setItem("contact_cooldown", String(Date.now()));
      toast.success("Thank you! Your message has been sent. We will contact you soon.");
      setMessage("");
      setSubject("");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="Contact" />
      <Container className="max-w-4xl py-6 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Contact Details */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Contact us</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Have questions about your order, products, or delivery? Reach out to our customer
              support team anytime.
            </p>

            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                  <Mail className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Email
                  </p>
                  <p className="font-medium">support@nexora.com.bd</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                  <Phone className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Phone / WhatsApp
                  </p>
                  <p className="font-medium">+880 1700-000000</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Location
                  </p>
                  <p className="font-medium">Gulshan-1, Dhaka 1212, Bangladesh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold">Send us a message</h2>
            <p className="text-xs text-muted-foreground">We usually reply within 2 hours.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              {/* Spam Honeypot - hidden from real users */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label className="block font-medium text-foreground">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order inquiry, product availability, etc."
                  className="mt-1 h-10 w-full rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you today?"
                  className="mt-1 w-full rounded-xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </Container>
    </>
  );
}
