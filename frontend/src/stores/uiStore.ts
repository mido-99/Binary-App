import { create } from "zustand";

type Theme = "light" | "dark";
type LayoutMode = "grid" | "list";

interface UIState {
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  mobileMenuOpen: boolean;
  theme: Theme;
  productLayoutMode: LayoutMode;
  setSidebarOpen: (v: boolean) => void;
  setCartDrawerOpen: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  setTheme: (v: Theme) => void;
  setProductLayoutMode: (v: LayoutMode) => void;
  toggleSidebar: () => void;
  toggleCartDrawer: () => void;
  toggleMobileMenu: () => void;
  toggleProductLayoutMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  cartDrawerOpen: false,
  mobileMenuOpen: false,
  theme: "light",
  productLayoutMode: "grid",

  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setCartDrawerOpen: (v) => set({ cartDrawerOpen: v }),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
  setTheme: (v) => set({ theme: v }),
  setProductLayoutMode: (v) => set({ productLayoutMode: v }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCartDrawer: () => set((s) => ({ cartDrawerOpen: !s.cartDrawerOpen })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  toggleProductLayoutMode: () =>
    set((s) => ({ productLayoutMode: s.productLayoutMode === "grid" ? "list" : "grid" })),
}));
