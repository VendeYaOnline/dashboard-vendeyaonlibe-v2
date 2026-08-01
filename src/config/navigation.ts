import {
  BarChart3,
  FolderTree,
  ImageIcon,
  Images,
  MessageSquare,
  Package,
  Settings2,
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
  { href: "/productos-destacados", label: "Productos star", icon: Star },
  { href: "/carrusel", label: "Carrusel", icon: Images },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/atributos", label: "Atributos", icon: Settings2 },
  { href: "/galeria", label: "Galería", icon: ImageIcon },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/analisis", label: "Análisis", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
];

/** Ruta a la que se entra tras iniciar sesión. */
export const DEFAULT_ROUTE = "/ventas";

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Espectador",
};

export const getNavItemsForRole = (role?: string): NavItem[] =>
  NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
