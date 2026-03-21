"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Star,
  Images,
  FolderTree,
  Package,
  BarChart3,
  MessageSquare,
  Settings2,
  Users,
  ImageIcon,
  Menu,
  X,
  Store,
  LogOut,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/app/api/request";
import { useAuthStore } from "@/store/auth.store";

interface DashboardSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: "ventas-recibidas", label: "Ventas recibidas", icon: ShoppingCart },
  { id: "productos-start", label: "Productos start", icon: Star },
  { id: "carrusel", label: "Carrusel", icon: Images },
  { id: "categorias", label: "Categorias", icon: FolderTree },
  { id: "productos", label: "Productos", icon: Package },
  { id: "analisis", label: "Análisis", icon: BarChart3 },
  { id: "mensajes", label: "Mensajes", icon: MessageSquare },
  { id: "atributos", label: "Atributos", icon: Settings2 },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "galeria", label: "Galería", icon: ImageIcon },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Espectador",
};

export function DashboardSidebar({
  activeView,
  onViewChange,
}: DashboardSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { logout, user: authUser } = useAuthStore();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // continuar con el logout aunque falle la petición
    } finally {
      logout();
      router.push("/login");
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-sidebar-foreground" />
          <span className="font-semibold text-lg text-sidebar-foreground">
            VendeYa
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}

          {/* User info card */}
          {authUser && (
            <div className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/40">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
                  <UserCircle className="h-5 w-5 text-sidebar-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {authUser.username}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {authUser.email}
                  </p>
                  <span className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-sidebar-primary/15 text-sidebar-primary">
                    {ROLE_LABELS[authUser.role] ?? authUser.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={cn(
                      "cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-3 py-4 space-y-3">
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start gap-3 text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </Button>
            <p className="text-xs text-sidebar-foreground/60 px-3">
              © {new Date().getFullYear()} VendeYaOnline
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
