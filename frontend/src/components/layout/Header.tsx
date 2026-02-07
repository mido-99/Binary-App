import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Moon,
  Menu,
  ShoppingCart,
  Sun,
  User,
  Heart,
  Package,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const logoUrl = "/media/logo/valor.jpg";

export function Header() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { mobileMenuOpen, toggleMobileMenu, toggleCartDrawer } = useUIStore();
  const { data: wishlistData } = useQuery<{ products: unknown[] }>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get("/api/wishlist/");
      return data;
    },
    enabled: !!user,
  });
  const wishlistCount = wishlistData?.products?.length ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => toggleMobileMenu()}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-3 no-underline text-foreground">
            <motion.img
              src={logoUrl}
              alt="Binary Referral"
              className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
              loading="lazy"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            />
            <div className="hidden sm:block">
              <span className="font-heading text-lg font-bold tracking-tight block">Binary Referral</span>
              <span className="text-xs text-muted-foreground block">Shop · Referral earnings</span>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm" className="rounded-md">
              Shop
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-md">
                Categories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/">All categories</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/?category=electronics">Electronics</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/?category=fashion">Fashion</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/?category=home">Home & Living</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/?category=sports">Sports & Outdoors</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/?category=beauty">Beauty</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/?category=other">Other</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/stores">
            <Button variant="ghost" size="sm" className="rounded-md flex items-center gap-1.5">
              <Store className="h-4 w-4" />
              Stores
            </Button>
          </Link>
          <Link to="/sellers">
            <Button variant="ghost" size="sm" className="rounded-md flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Sellers
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
<Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => toggleCartDrawer()}
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>

          {user && (
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Wishlist, ${wishlistCount} items`}>
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-haspopup="true" aria-expanded={menuOpen}>
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/account" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                    <User className="h-4 w-4" />
                    My account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wishlist" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="rounded-full">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t bg-card overflow-hidden"
          >
            <div className="container px-4 py-4 space-y-2">
              <Link to="/" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                Shop
              </Link>
              <Link to="/stores" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                Stores
              </Link>
              <Link to="/sellers" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                Sellers
              </Link>
              <Link to="/cart" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
              {user && (
                <>
                  <Link to="/account" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                    My account
                  </Link>
                  <Link to="/orders" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                    Orders
                  </Link>
                  <Link to="/wishlist" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                    Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                  </Link>
                  <Link to="/dashboard" className="block py-2 text-sm font-medium" onClick={() => toggleMobileMenu()}>
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="block w-full text-left py-2 text-sm font-medium text-destructive"
                    onClick={() => {
                      toggleMobileMenu();
                      handleLogout();
                    }}
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
