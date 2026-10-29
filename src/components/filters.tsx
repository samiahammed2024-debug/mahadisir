import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/pricing";
import { Star } from "lucide-react";

export interface Filters {
  sort: string;
  min: number;
  max: number;
  minRating: number;
}

export const PRICE_MAX = 80000;
export const defaultFilters: Filters = { sort: "popularity", min: 0, max: PRICE_MAX, minRating: 0 };

const sorts = [
  ["popularity", "Popularity"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["newest", "Newest"],
  ["rating", "Rating"],
] as const;

export function FilterPanel({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Sort by</legend>
        <div className="flex flex-wrap gap-2">
          {sorts.map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={value.sort === k}
              onClick={() => onChange({ ...value, sort: k })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                value.sort === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 flex w-full justify-between text-sm font-semibold">
          Price range
          <span className="font-normal text-muted-foreground">
            {formatTaka(value.min)} – {formatTaka(value.max)}
          </span>
        </legend>
        <Slider
          min={0}
          max={PRICE_MAX}
          step={100}
          value={[value.min, value.max]}
          onValueChange={([min, max]) =>
            onChange({ ...value, min: min ?? 0, max: max ?? PRICE_MAX })
          }
          aria-label="Price range"
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Rating</legend>
        <div className="flex flex-wrap gap-2">
          {[0, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={value.minRating === r}
              onClick={() => onChange({ ...value, minRating: r })}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs",
                value.minRating === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {r === 0 ? (
                "Any"
              ) : (
                <>
                  <Star className="size-3 fill-star text-star" /> {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
