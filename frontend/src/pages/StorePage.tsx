import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilterStore } from "@/stores/filterStore";
import { useUIStore } from "@/stores/uiStore";
import { useDebounce } from "@/hooks/useDebounce";
import { ProductGrid } from "@/components/store/ProductGrid";
import { FilterSidebar } from "@/components/store/FilterSidebar";
import { FilterChips } from "@/components/store/FilterChips";
import { LayoutGrid, List, Filter } from "lucide-react";
import type { Product } from "@/types";

interface ProductsApiResponse {
  products: Product[];
  categories: [string, string][];
  total_count: number;
  page: number;
  page_size: number;
}

export function StorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    search,
    setSearch,
    categories,
    stores,
    sellers,
    priceRange,
    sortBy,
    onSale,
    page,
    pageSize,
    setPage,
  } = useFilterStore();
  const { productLayoutMode, toggleProductLayoutMode } = useUIStore();
  const debouncedSearch = useDebounce(search, 300);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (categories.length) params.set("categories", categories.join(","));
  if (stores.length) params.set("stores", stores.join(","));
  if (sellers.length) params.set("sellers", sellers.join(","));
  if (priceRange[0] > 0) params.set("min_price", String(priceRange[0]));
  if (priceRange[1] < 10000) params.set("max_price", String(priceRange[1]));
  if (onSale) params.set("on_sale", "true");
  params.set("sort", sortBy);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  const { data, isLoading } = useQuery<ProductsApiResponse>({
    queryKey: ["products", debouncedSearch, categories, stores, sellers, priceRange, sortBy, onSale, page, pageSize],
    queryFn: async () => {
      const { data: res } = await api.get(`/api/products/?${params.toString()}`);
      return res;
    },
  });

  const products = data?.products ?? [];
  const totalCount = data?.total_count ?? 0;
  const totalPages = data ? Math.ceil(data.total_count / data.page_size) : 0;

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Shop</h1>
        <p className="mt-2 text-muted-foreground text-base sm:text-lg max-w-2xl">
          Browse products from our stores. Every purchase supports the referral network.
        </p>
      </motion.section>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {sidebarOpen ? "Hide filters" : "Show filters"}
            </Button>
          </div>
          <div
            className={`border rounded-lg p-4 lg:border-0 lg:p-0 lg:bg-transparent ${sidebarOpen ? "block" : "hidden lg:block"}`}
          >
            <FilterSidebar />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-stretch sm:items-center">
            <form
              className="flex-1 min-w-0 max-w-md"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </form>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleProductLayoutMode}
                aria-label={productLayoutMode === "grid" ? "Switch to list view" : "Switch to grid view"}
              >
                {productLayoutMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <FilterChips />

          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${totalCount} product${totalCount === 1 ? "" : "s"}`}
          </p>

          {isLoading ? (
            <div
              className={
                productLayoutMode === "list"
                  ? "space-y-3"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
              }
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={
                    productLayoutMode === "list"
                      ? "h-28 rounded-lg bg-muted animate-pulse"
                      : "rounded-lg overflow-hidden bg-muted animate-pulse"
                  }
                >
                  {productLayoutMode === "grid" && <div className="aspect-square bg-muted/80" />}
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-6 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed p-12 text-center"
            >
              <p className="text-muted-foreground">No products match your filters.</p>
              <Button variant="outline" className="mt-4" onClick={() => useFilterStore.getState().resetFilters()}>
                Clear filters
              </Button>
            </motion.div>
          ) : (
            <>
              <ProductGrid products={products} layout={productLayoutMode} />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
