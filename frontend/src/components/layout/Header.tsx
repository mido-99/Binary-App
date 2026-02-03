import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

const logoUrl = "/media/logo/valor.jpg";

export function Header() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 no-underline text-foreground">
          <motion.img
            src={logoUrl}
            alt="Binary Referral"
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
          <div className="hidden sm:block">
            <span className="font-heading text-lg font-bold tracking-tight block">Binary Referral</span>
            <span className="text-xs text-muted-foreground block">Shop · Referral earnings</span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              Shop
            </Button>
          </Link>
          {user ? (
            <div className="relative ml-2" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <User className="h-5 w-5" />
              </Button>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border bg-card py-1 shadow-lg"
                >
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Dashboard
                  </Link>
                  <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted opacity-70">
                    <span className="rounded p-1">🔔</span>
                    Notifications
                  </button>
                  <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted opacity-70">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </button>
                  <div className="my-1 border-t" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full">
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
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full")}
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
