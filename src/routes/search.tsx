import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock, PackageSearch, Search, X } from "lucide-react";
import { Container, EmptyState, ProductGrid } from "@/components/shop";
import { useSearchHistory } from "@/store";
import { seo } from "@/lib/seo";
import { useDynamicProducts } from "@/hooks/use-dynamic-products";
import type { Product } from "@/data/products";

export const Route = createFileRoute("/search")({
  head: () =>
    seo("Search Products", "Search NEXORA for headphones, sneakers, smart watches, bags and more."),
  component: SearchPage,
});

const popular = ["iPhone", "Laptop", "T-shirt", "Shoes", "Bag", "Watch"];
const aliases: Record<string, string[]> = {
  iphone: ["smartphone"],
  bag: ["backpack"],
  watch: ["smart watch"],
  shoes: ["sneakers", "running shoes"],
  "t-shirt": ["t-shirt"],
};

function searchProducts(q: string, list: Product[]) {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  const terms = [term, ...(aliases[term] ?? [])];
  return list.filter((p) => {
    const hay = `${p.name} ${p.category} ${p.sub}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  });
}

function SearchPage() {
  const navigate = useNavigate();
  const { products: liveProducts } = useDynamicProducts();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { recent, addRecent, removeRecent, clearRecent } = useSearchHistory();

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const results = useMemo(() => searchProducts(debounced, liveProducts), [debounced, liveProducts]);
  const run = (term: string) => {
    setQ(term);
    setDebounced(term);
    addRecent(term);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-background lg:top-16">
        <Container className="flex items-center gap-2 py-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={() =>
              window.history.length > 1 ? window.history.back() : navigate({ to: "/" })
            }
            className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </button>
          <form
            role="search"
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              run(q);
              inputRef.current?.blur();
            }}
          >
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-11 w-full rounded-xl bg-muted pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQ("");
                  setDebounced("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full hover:bg-background"
              >
                <X className="size-4" />
              </button>
            )}
          </form>
        </Container>
      </div>
      <Container className="pt-2">
        {!q.trim() ? (
          <div className="max-w-2xl space-y-8">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent Searches</h2>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No recent searches.</p>
              ) : (
                <ul>
                  {recent.map((r) => (
                    <li
                      key={r}
                      className="flex items-center gap-3 border-b border-border/60 last:border-0"
                    >
                      <Clock className="size-4 text-muted-foreground" aria-hidden />
                      <button
                        type="button"
                        onClick={() => run(r)}
                        className="flex-1 py-3 text-left text-sm"
                      >
                        {r}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${r}`}
                        onClick={() => removeRecent(r)}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="mb-3 text-sm font-semibold">Popular Searches</h2>
              <div className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => run(p)}
                    className="rounded-full border px-4 py-1.5 text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : q !== debounced ? (
          <p className="py-6 text-sm text-muted-foreground" aria-live="polite">
            Searching…
          </p>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="size-8" />}
            title="No products found"
            text={`We couldn't find anything for "${debounced}". Try a different word.`}
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
              {results.length} results for "{debounced}"
            </p>
            <ProductGrid items={results} />
          </>
        )}
      </Container>
    </>
  );
}
