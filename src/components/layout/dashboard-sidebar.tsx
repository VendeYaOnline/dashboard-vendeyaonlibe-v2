"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Menu, UserCircle, X } from "lucide-react";
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
      {/* Barra superior sólo en móvil/tablet: menú a la izquierda, logo a la derecha */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-3 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileMenuOpen}
          onPress={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
        <Link href="/" aria-label="VendeYa" className="flex items-center">
          <Image src="/logo.svg" alt="VendeYa" width={36} height={36} priority className="size-9" />
        </Link>
      </header>

      <aside
        className={cn(
          "fixed left-0 top-14 z-40 flex h-[calc(100%-3.5rem)] w-64 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:top-0 lg:h-full lg:max-w-none",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden items-center gap-3 px-5 py-5 lg:flex">
          <Image src="/logo.svg" alt="" width={32} height={32} className="size-8" />
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
