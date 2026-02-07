import { useFilterStore } from "@/stores/filterStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  fashion: "Fashion",
  home: "Home & Living",
  sports: "Sports & Outdoors",
  beauty: "Beauty",
  other: "Other",
};

export function FilterChips() {
  const {
    search,
    setSearch,
    categories,
    setCategories,
    stores,
    setStores,
    sellers,
    setSellers,
    priceRange,
    setPriceRange,
    onSale,
    setOnSale,
    resetFilters,
  } = useFilterStore();

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data } = await api.get<{ stores: { id: number; name: string }[] }>("/api/stores/");
      return data;
    },
  });
  const { data: sellersData } = useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { data } = await api.get<{ sellers: { id: number; email: string }[] }>("/api/sellers/");
      return data;
    },
  });

  const storeNames = Object.fromEntries((storesData?.stores ?? []).map((s) => [s.id, s.name]));
  const sellerEmails = Object.fromEntries((sellersData?.sellers ?? []).map((s) => [s.id, s.email]));

  const hasAny =
    search.length > 0 ||
    categories.length > 0 ||
    stores.length > 0 ||
    sellers.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    onSale;

  if (!hasAny) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (search) {
    chips.push({ key: "search", label: `Search: "${search}"`, onRemove: () => setSearch("") });
  }
  categories.forEach((c) => {
    chips.push({
      key: `cat-${c}`,
      label: CATEGORY_LABELS[c] ?? c,
      onRemove: () => setCategories(categories.filter((x) => x !== c)),
    });
  });
  stores.forEach((id) => {
    chips.push({
      key: `store-${id}`,
      label: storeNames[id] ?? `Store ${id}`,
      onRemove: () => setStores(stores.filter((x) => x !== id)),
    });
  });
  sellers.forEach((id) => {
    chips.push({
      key: `seller-${id}`,
      label: sellerEmails[id] ?? `Seller ${id}`,
      onRemove: () => setSellers(sellers.filter((x) => x !== id)),
    });
  });
  if (priceRange[0] > 0 || priceRange[1] < 10000) {
    chips.push({
      key: "price",
      label: `$${priceRange[0]} – $${priceRange[1] >= 10000 ? "∞" : priceRange[1]}`,
      onRemove: () => setPriceRange([0, 10000]),
    });
  }
  if (onSale) {
    chips.push({ key: "sale", label: "On sale", onRemove: () => setOnSale(false) });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded-full p-0.5 hover:bg-muted"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={resetFilters}
        className="text-xs font-medium text-muted-foreground hover:text-foreground underline"
      >
        Clear all
      </button>
    </div>
  );
}
