"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Store, UserCircle, X } from "lucide-react";
import { Button, Chip, cn } from "@heroui/react";
import { logoutUser } from "@/app/api/request";
import { useAuthStore } from "@/store/auth.store";
import { getNavItemsForRole, ROLE_LABELS } from "@/config/navigation";

export function DashboardSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user: authUser } = useAuthStore();

  const navItems = getNavItemsForRole(authUser?.role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // continuar con el logout aunque falle la petición
    } finally {
      localStorage.removeItem("access_token");
      logout();
      router.push("/login");
    }
  };

  return (
    <>
      {/* Barra superior sólo en móvil */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Store className="size-6 text-accent" />
          <span className="text-lg font-semibold">VendeYa</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onPress={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden items-center gap-2 px-5 py-5 lg:flex">
          <Store className="size-6 text-accent" />
          <span className="text-lg font-semibold">VendeYa</span>
        </div>

        {authUser && (
          <div className="flex items-center gap-3 border-y border-sidebar-border px-4 py-3 lg:border-t-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <UserCircle className="size-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{authUser.username}</p>
              <p className="truncate text-xs text-muted">{authUser.email}</p>
            </div>
            <Chip size="sm" variant="soft" color="accent">
              {ROLE_LABELS[authUser.role] ?? authUser.role}
            </Chip>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-gradient text-accent-foreground shadow-[var(--accent-shadow)]"
                    : "hover:bg-surface-secondary",
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
          <Button
            variant="ghost"
            fullWidth
            className="justify-start gap-3 text-danger"
            isDisabled={isLoggingOut}
            onPress={handleLogout}
          >
            <LogOut className="size-5" />
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </Button>
          <p className="px-3 text-xs text-muted">
            © {new Date().getFullYear()} VendeYaOnline
          </p>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-backdrop lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
