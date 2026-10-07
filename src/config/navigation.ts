import {
  BarChart3,
  Boxes,
  Contact,
  FolderTree,
  ImageIcon,
  Megaphone,
  Images,
  LayoutTemplate,
  MessageSquare,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Vistas de pago: la tienda las paga en vendeyaonline.com y el superadmin las
 * activa en Plataforma. Deben coincidir con PAID_FEATURES del backend
 * (src/modules/platform/features.js), que también bloquea sus endpoints.
 */
export const PAID_FEATURES = {
  marketing: {
    label: "Marketing",
    description: "Envía promociones a tus clientes por correo y WhatsApp con el estilo de tu marca.",
  },
} as const;

export type PaidFeature = keyof typeof PAID_FEATURES;

/** Dónde se contratan las vistas de pago. */
export const PAID_FEATURES_URL = "https://vendeyaonline.com";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles con acceso. Sin definir = todos los roles autenticados. */
  roles?: string[];
  /**
   * Día en que la vista sale a producción ("AAAA-MM-DD", hora de Colombia).
   * Durante NEW_BADGE_DAYS días el menú la marca como "Nuevo"; después la
   * etiqueta desaparece sola. Ponerlo en toda vista nueva.
   */
  releasedAt?: string;
  /** Vista de pago: si la empresa no la tiene activa, se muestra con candado. */
  feature?: PaidFeature;
}

/** Días que una vista nueva lleva la etiqueta "Nuevo". */
export const NEW_BADGE_DAYS = 3;

/** Fuente única de la navegación: la usan el sidebar y el título de cada página. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/ventas", label: "Ventas recibidas", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Contact, roles: ["admin", "editor"], releasedAt: "2026-10-06" },
  { href: "/marketing", label: "Marketing", icon: Megaphone, roles: ["admin", "editor"], feature: "marketing" },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/inventario", label: "Inventario", icon: Boxes, releasedAt: "2026-10-06" },
  { href: "/productos-destacados", label: "Productos destacados", icon: Star },
  { href: "/promociones", label: "Códigos promocionales", icon: TicketPercent },
  { href: "/carrusel", label: "Carrusel", icon: Images },
  { href: "/portadas", label: "Portadas", icon: LayoutTemplate },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/atributos", label: "Atributos", icon: Settings2 },
  { href: "/galeria", label: "Galería", icon: ImageIcon },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/analisis", label: "Análisis", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  // Administración de la plataforma (empresas, planes): solo el superadministrador.
  { href: "/plataforma", label: "Plataforma", icon: ShieldCheck, roles: ["superadmin"] },
];

/**
 * Rol de quien administra la plataforma. No pertenece a ninguna empresa, así
 * que solo ve las secciones que lo nombran explícitamente (Plataforma).
 */
export const SUPERADMIN_ROLE = "superadmin";

/** Ruta a la que se entra tras iniciar sesión. */
export const DEFAULT_ROUTE = "/ventas";

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadministrador",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Espectador",
};

/** true si la vista es de pago y la empresa no la tiene activa. */
export const isLockedNavItem = (item: NavItem, features: readonly string[] | undefined) =>
  Boolean(item.feature) && !(features ?? []).includes(item.feature as string);

/** true mientras la vista esté dentro de sus NEW_BADGE_DAYS días desde `releasedAt`. */
export const isNewNavItem = (item: NavItem, now = new Date()) => {
  if (!item.releasedAt) return false;
  const released = new Date(`${item.releasedAt}T00:00:00-05:00`).getTime();
  const elapsed = now.getTime() - released;
  return elapsed >= 0 && elapsed < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
};

export const getNavItemsForRole = (role?: string): NavItem[] =>
  role === SUPERADMIN_ROLE
    ? NAV_ITEMS.filter((item) => item.roles?.includes(SUPERADMIN_ROLE))
    : NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

/** Ruta inicial tras iniciar sesión según el rol. */
export const getHomeRoute = (role?: string) =>
  role === SUPERADMIN_ROLE ? "/plataforma" : DEFAULT_ROUTE;

/** true si el rol puede ver la ruta (para redirigir si entra por URL). */
export const canAccessRoute = (role: string | undefined, pathname: string) =>
  getNavItemsForRole(role).some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
