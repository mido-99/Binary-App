import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  category_display: string;
  markup_price: string;
  store_name: string;
  discount_percent?: string;
  sale_price?: string;
};

type ApiResponse = { products: Product[]; categories: [string, string][] };

export function StorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  params.set("sort", sort);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["products", search, category, sort],
    queryFn: async () => {
      const { data } = await api.get(`/api/products/?${params.toString()}`);
      return data;
    },
  });

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  return (
    <div className="space-y-10">
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

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 flex-wrap items-stretch sm:items-end"
      >
        <form
          className="flex flex-wrap gap-3 items-center flex-1 min-w-0"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md"
          />
        </form>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="">All categories</option>
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </motion.section>

      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-6 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed p-12 text-center"
          >
            <p className="text-muted-foreground">No products match your filters.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
            >
              Clear filters
            </Button>
          </motion.div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8" role="list">
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <motion.li
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                >
                  <Link to={`/item/${product.id}`}>
                    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                      <Card className="overflow-hidden h-full group cursor-pointer">
                        <div className="aspect-square bg-muted/50 flex items-center justify-center text-muted-foreground text-5xl font-heading font-bold group-hover:bg-muted transition-colors">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                        <CardContent className="p-5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {product.category_display}
                          </span>
                          <h2 className="mt-2 font-heading text-xl font-bold group-hover:text-primary transition-colors">
                            {product.name}
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                            {product.description || "No description."}
                          </p>
                          <div className="mt-4 flex items-baseline justify-between gap-2 flex-wrap">
                            <div className="flex items-baseline gap-2">
                              <span className="font-heading text-2xl font-bold">
                                ${product.sale_price ?? product.markup_price}
                              </span>
                              {product.sale_price != null && (
                                <span className="text-sm text-muted-foreground line-through">${product.markup_price}</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{product.store_name}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}
