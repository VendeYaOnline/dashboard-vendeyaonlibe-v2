import {
  BarChart3,
  FolderTree,
  ImageIcon,
  Images,
  LayoutTemplate,
  MessageSquare,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles con acceso. Sin definir = todos los roles autenticados. */
  roles?: string[];
}

/** Fuente única de la navegación: la usan el sidebar y el título de cada página. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/ventas", label: "Ventas recibidas", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/productos-destacados", label: "Productos destacados", icon: Star },
  { href: "/carrusel", label: "Carrusel", icon: Images },
  { href: "/portadas", label: "Portadas", icon: LayoutTemplate },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/atributos", label: "Atributos", icon: Settings2 },
  { href: "/galeria", label: "Galería", icon: ImageIcon },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/analisis", label: "Análisis", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin", "superadmin"] },
  // Administración de la plataforma (empresas, planes): solo el superadministrador.
  { href: "/plataforma", label: "Plataforma", icon: ShieldCheck, roles: ["superadmin"] },
];

/** Rol de quien administra la plataforma (todas las empresas). Hereda lo de admin. */
export const SUPERADMIN_ROLE = "superadmin";

export const isAdminRole = (role?: string) => role === "admin" || role === SUPERADMIN_ROLE;

/** Ruta a la que se entra tras iniciar sesión. */
export const DEFAULT_ROUTE = "/ventas";

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadministrador",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Espectador",
};

export const getNavItemsForRole = (role?: string): NavItem[] =>
  NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
