import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet />
      </main>
      <footer className="mt-auto border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Binary Referral Commerce — bonuses only from purchases, pairs on L/R lanes.
          </p>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </a>
            <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
