import { createFileRoute } from "@tanstack/react-router";
import { Container, TopBar } from "@/components/shop";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seo("About Us", "NEXORA is a Bangladeshi online store for premium everyday products."),
  component: () => (
    <>
      <TopBar title="About" />
      <Container className="max-w-2xl py-6 lg:py-16">
        <h1 className="text-3xl font-bold">Shop Smarter. Live Better.</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          NEXORA brings premium electronics, fashion, home, beauty and sports products to customers
          across Bangladesh, with cash on delivery, bKash, Nagad and card payments.
        </p>
      </Container>
    </>
  ),
});
