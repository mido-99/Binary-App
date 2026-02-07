import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilterStore, SORT_OPTIONS } from "@/stores/filterStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  className?: string;
}

export function FilterSidebar({ className }: FilterSidebarProps) {
  const {
    categories,
    setCategories,
    stores,
    setStores,
    sellers,
    setSellers,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
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

  const categoryChoices = [
    { value: "electronics", label: "Electronics" },
    { value: "fashion", label: "Fashion" },
    { value: "home", label: "Home & Living" },
    { value: "sports", label: "Sports & Outdoors" },
    { value: "beauty", label: "Beauty" },
    { value: "other", label: "Other" },
  ];

  const toggleCategory = (value: string) => {
    if (categories.includes(value)) {
      setCategories(categories.filter((c) => c !== value));
    } else {
      setCategories([...categories, value]);
    }
  };

  const toggleStore = (id: number) => {
    if (stores.includes(id)) {
      setStores(stores.filter((s) => s !== id));
    } else {
      setStores([...stores, id]);
    }
  };

  const toggleSeller = (id: number) => {
    if (sellers.includes(id)) {
      setSellers(sellers.filter((s) => s !== id));
    } else {
      setSellers([...sellers, id]);
    }
  };

  const storeList = storesData?.stores ?? [];
  const sellerList = sellersData?.sellers ?? [];

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Price range</Label>
        <div className="mt-2 flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            min={0}
            step={1}
            value={priceRange[0] === 0 ? "" : priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
            className="h-9"
          />
          <Input
            type="number"
            placeholder="Max"
            min={0}
            step={1}
            value={priceRange[1] >= 10000 ? "" : priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
            className="h-9"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Category</Label>
        <div className="mt-2 space-y-2">
          {categoryChoices.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={categories.includes(cat.value)}
                onChange={() => toggleCategory(cat.value)}
                className="rounded border-input"
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      {storeList.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Store</Label>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {storeList.map((store) => (
              <label key={store.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={stores.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                  className="rounded border-input"
                />
                <span className="truncate">{store.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {sellerList.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Seller</Label>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {sellerList.map((seller) => (
              <label key={seller.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={sellers.includes(seller.id)}
                  onChange={() => toggleSeller(seller.id)}
                  className="rounded border-input"
                />
                <span className="truncate">{seller.email}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
            className="rounded border-input"
          />
          On sale only
        </label>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
