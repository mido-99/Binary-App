import { create } from "zustand";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
  { value: "name", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

interface FilterState {
  search: string;
  categories: string[];
  stores: number[];
  sellers: number[];
  priceRange: [number, number];
  sortBy: SortValue;
  onSale: boolean;
  page: number;
  pageSize: number;
  setSearch: (v: string) => void;
  setCategories: (v: string[]) => void;
  setStores: (v: number[]) => void;
  setSellers: (v: number[]) => void;
  setPriceRange: (v: [number, number]) => void;
  setSortBy: (v: SortValue) => void;
  setOnSale: (v: boolean) => void;
  setPage: (v: number) => void;
  resetFilters: () => void;
}

const defaultState = {
  search: "",
  categories: [],
  stores: [],
  sellers: [],
  priceRange: [0, 10000] as [number, number],
  sortBy: "newest" as SortValue,
  onSale: false,
  page: 1,
  pageSize: 24,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultState,

  setSearch: (v) => set({ search: v, page: 1 }),
  setCategories: (v) => set({ categories: v, page: 1 }),
  setStores: (v) => set({ stores: v, page: 1 }),
  setSellers: (v) => set({ sellers: v, page: 1 }),
  setPriceRange: (v) => set({ priceRange: v, page: 1 }),
  setSortBy: (v) => set({ sortBy: v, page: 1 }),
  setOnSale: (v) => set({ onSale: v, page: 1 }),
  setPage: (v) => set({ page: v }),

  resetFilters: () => set(defaultState),
}));
