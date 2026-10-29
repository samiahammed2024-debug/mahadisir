import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/data/products";
import { filterProducts } from "@/lib/pricing";
import {
  Container,
  EmptyState,
  IconBtn,
  ProductGrid,
  ProductSkeleton,
  TopBar,
} from "@/components/shop";
import { FilterPanel, defaultFilters, type Filters } from "@/components/filters";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function Catalog({
  title,
  items,
  subs,
  subKey = "sub",
}: {
  title: string;
  items: Product[];
  subs: string[];
  subKey?: "sub" | "category";
}) {
  const [chip, setChip] = useState("All");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setChip("All");
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [title]);

  const shown = useMemo(() => {
    const base =
      chip === "All"
        ? items
        : items.filter(
            (p) => (subKey === "sub" ? p.sub : p.category) === chip.toLowerCase() || p.sub === chip,
          );
    return filterProducts([...base], filters);
  }, [items, chip, filters, subKey]);

  const active = JSON.stringify(filters) !== JSON.stringify(defaultFilters);

  return (
    <>
      <TopBar
        title={title}
        right={
          <>
            <IconBtn label="Search" to="/search">
              <Search className="size-5" />
            </IconBtn>
            <IconBtn
              label="Filter and sort"
              onClick={() => {
                setDraft(filters);
                setOpen(true);
              }}
            >
              <SlidersHorizontal className="size-5" />
              {active && <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />}
            </IconBtn>
          </>
        }
      />
      <Container className="lg:pt-8">
        <div className="hidden items-baseline justify-between lg:flex">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{shown.length} products</p>
        </div>
        <div
          role="tablist"
          aria-label="Filter by type"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2 lg:mx-0 lg:mt-4 lg:px-0"
        >
          {["All", ...subs].map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={chip === s}
              type="button"
              onClick={() => setChip(s)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-medium transition-colors",
                chip === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3 lg:mt-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24 rounded-xl border p-5">
              <FilterPanel value={filters} onChange={setFilters} />
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                className="mt-6 h-10 w-full rounded-xl border text-sm font-medium hover:bg-muted"
              >
                Reset
              </button>
            </div>
          </aside>
          <div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 6 }, (_, k) => (
                  <ProductSkeleton key={k} />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <EmptyState
                icon={<PackageSearch className="size-8" />}
                title="No products found"
                text="Try another filter or reset your choices."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setFilters(defaultFilters);
                      setChip("All");
                    }}
                    className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
                  >
                    Reset filters
                  </button>
                }
              />
            ) : (
              <div className="[&>div]:lg:grid-cols-3 [&>div]:xl:grid-cols-4">
                <ProductGrid items={shown} />
              </div>
            )}
          </div>
        </div>
      </Container>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="text-left">
              <DrawerTitle>Filter & Sort</DrawerTitle>
            </DrawerHeader>
            <div className="px-4">
              <FilterPanel value={draft} onChange={setDraft} />
            </div>
            <DrawerFooter className="flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraft(defaultFilters);
                  setFilters(defaultFilters);
                  setOpen(false);
                }}
                className="h-12 flex-1 rounded-xl border text-sm font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(draft);
                  setOpen(false);
                }}
                className="h-12 flex-1 rounded-xl bg-primary text-sm font-medium text-primary-foreground"
              >
                Apply
              </button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function CategoryNotFound() {
  return (
    <EmptyState
      icon={<PackageSearch className="size-8" />}
      title="Category not found"
      text="This category doesn't exist."
      action={
        <Link
          to="/categories"
          className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          All categories
        </Link>
      }
    />
  );
}
