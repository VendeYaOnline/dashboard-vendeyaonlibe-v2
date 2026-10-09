import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { MetaCatalogFilters } from "@/interfaces/catalog";
import type { InventoryFilters } from "@/interfaces/inventory";
import type { CustomersFilters } from "@/interfaces/customers";
import type { ContactsFilter } from "@/interfaces/marketing";
import type { ContactStatusFilter } from "@/interfaces/contacts";
import type { AnalyticsPeriod } from "@/interfaces/analytics";

/**
 * Opciones comunes de los listados paginados: la caché se considera fresca
 * durante 10 minutos (las mutaciones la invalidan) y, al cambiar de página o
 * de filtro, se conserva la página anterior en pantalla mientras llega la
 * nueva en vez de vaciar la tabla.
 */
const LIST_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 10,
  placeholderData: keepPreviousData,
} as const;

/**
 * Las ventas llegan desde la tienda sin pasar por el panel: la caché se
 * muestra al instante y, si tiene más de un minuto, se refresca en segundo
 * plano sin vaciar la tabla.
 */
const SALES_QUERY_OPTIONS = {
  ...LIST_QUERY_OPTIONS,
  staleTime: 1000 * 60,
} as const;
import {
  getAnalytics,
  getCompanyUsers,
  getSuperadmins,
  getMetaCatalogSummary,
  getInventory,
  getCustomers,
  getFeatures,
  getMarketing,
  getMarketingAudience,
  getMarketingCampaign,
  getMarketingCampaigns,
  getMarketingContacts,
  getMarketingLimits,
  getWhatsappSettings,
  getMyWhatsappSettings,
  getAttributes,
  getPlan,
  getMercadoPagoSettings,
  getPlatformCompanies,
  getPlatformConfig,
  getCarousels,
  getCategories,
  getCategoryProducts,
  getContacts,
  getPromoCodes,
  getCovers,
  getFeaturedProducts,
  getImages,
  getProducts,
  getProductsByCategory,
  getSales,
  getSale,
  getUsers,
} from "./request";

export const useQueryAttribute = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["attributes", validPage, search],
    queryFn: () => getAttributes(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/**
 * Tope del backend para `limit`. Los selectores del formulario de producto
 * necesitan la lista completa, no la primera página de 10.
 */
const SELECTOR_LIMIT = 100;

/** Todos los atributos de la empresa, para los selectores de formularios. */
export const useQueryAllAttributes = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["attributes", "all"],
    queryFn: () => getAttributes(1, "", SELECTOR_LIMIT),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled,
  });

export const useQueryCovers = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["covers", validPage, search],
    queryFn: () => getCovers(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

export const useQueryCategories = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["categories", validPage, search],
    queryFn: () => getCategories(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/** Todas las categorías de la empresa, para los selectores de formularios. */
export const useQueryAllCategories = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => getCategories(1, "", SELECTOR_LIMIT),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled,
  });

export const useQueryImages = (
  currentPage: number,
  search: string,
  limit: number,
  categoryId: string | undefined = undefined,
  /** false = no pedir aún (p. ej. selector de imágenes cerrado). */
  enabled: boolean = true,
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["images", validPage, search, categoryId],
    queryFn: () => getImages(validPage, search, limit, categoryId),
    ...LIST_QUERY_OPTIONS,
    enabled: enabled && currentPage > 0,
  });
};

export const useQueryUsers = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["users", validPage, search],
    queryFn: () => getUsers(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/** Métricas del panel: se refrescan cada 5 min o al invalidar ventas/productos. */
export const useQueryAnalytics = (period: AnalyticsPeriod) =>
  useQuery({
    queryKey: ["analytics", period],
    queryFn: () => getAnalytics(period),
    ...LIST_QUERY_OPTIONS,
    staleTime: 1000 * 60 * 5,
  });

/** Inventario por variante con filtros (la página anterior sigue visible mientras carga). */
export const useQueryInventory = (filters: InventoryFilters) =>
  useQuery({
    queryKey: ["inventory", filters],
    queryFn: () => getInventory(filters),
    ...LIST_QUERY_OPTIONS,
    staleTime: 1000 * 60 * 2,
  });

/**
 * Cuántos productos saldrán en el catálogo para Meta con esos filtros. Sin
 * caché útil: el inventario cambia, así que cada vez que se abre se vuelve a calcular.
 */
export const useQueryMetaCatalogSummary = (filters: MetaCatalogFilters, enabled: boolean) =>
  useQuery({
    queryKey: ["meta-catalog-summary", filters],
    queryFn: () => getMetaCatalogSummary(filters),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    staleTime: 0,
    gcTime: 1000 * 30,
    retry: false,
    enabled,
  });

/** Clientes armados a partir de las ventas (admin y editor). */
export const useQueryCustomers = (filters: CustomersFilters) =>
  useQuery({
    queryKey: ["customers", filters],
    queryFn: () => getCustomers(filters),
    ...LIST_QUERY_OPTIONS,
    staleTime: 1000 * 60 * 2,
  });

/** Marketing: marca, plantillas y productos que usan. */
export const useQueryMarketing = () =>
  useQuery({
    queryKey: ["marketing"],
    queryFn: getMarketing,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

/** A cuántos clientes llega cada grupo por canal, y el cupo de correos del mes. */
export const useQueryMarketingAudience = () =>
  useQuery({ queryKey: ["marketing", "audience"], queryFn: getMarketingAudience, staleTime: 1000 * 60 });

/** Historial de campañas; mientras alguna se está enviando, se actualiza cada 3 s. */
export const useQueryMarketingCampaigns = () =>
  useQuery({
    queryKey: ["marketing", "campaigns"],
    queryFn: getMarketingCampaigns,
    refetchInterval: (query) =>
      query.state.data?.campaigns.some((campaign) => campaign.status === "sending") ? 3000 : false,
  });

export const useQueryMarketingCampaign = (id: string | null) =>
  useQuery({
    queryKey: ["marketing", "campaign", id],
    queryFn: () => getMarketingCampaign(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.campaign.status === "sending" ? 3000 : false),
  });

/** Notificaciones por cliente (último envío por canal y espera de 7 días). */
export const useQueryMarketingContacts = (filters: { page: number; search: string; filter: ContactsFilter }) =>
  useQuery({
    queryKey: ["marketing", "contacts", filters],
    queryFn: () => getMarketingContacts(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

/** Superadmin: límites globales de Marketing. */
export const useQueryMarketingLimits = (enabled = true) =>
  useQuery({ queryKey: ["platform", "marketing-limits"], queryFn: getMarketingLimits, enabled });

/** WhatsApp Cloud API de la propia tienda (Marketing). */
export const useQueryMyWhatsappSettings = (enabled = true) =>
  useQuery({ queryKey: ["marketing", "whatsapp"], queryFn: getMyWhatsappSettings, enabled });

/** Superadmin: WhatsApp Cloud API de una tienda. */
export const useQueryWhatsappSettings = (companyId: string | null) =>
  useQuery({
    queryKey: ["platform", "whatsapp", companyId],
    queryFn: () => getWhatsappSettings(companyId as string),
    enabled: Boolean(companyId),
  });

/** Vistas de pago activas de la empresa (menú y vistas bloqueadas). */
export const useQueryFeatures = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["features"],
    queryFn: getFeatures,
    enabled,
    staleTime: 1000 * 60 * 5,
  });

/** Plan y uso de la empresa (tope de productos e imágenes). */
export const useQueryPlan = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["plan"],
    queryFn: getPlan,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled,
  });

export const useQueryPlatformConfig = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["platform", "config"],
    queryFn: getPlatformConfig,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    enabled,
  });

/** Configuración de Mercado Pago de una empresa (solo superadmin). */
export const useQueryMercadoPagoSettings = (companyId: string | null) =>
  useQuery({
    queryKey: ["platform", "mercadopago", companyId],
    queryFn: () => getMercadoPagoSettings(companyId as string),
    refetchOnWindowFocus: false,
    enabled: Boolean(companyId),
  });

/** Superadministradores (solo el propietario): `enabled` evita pedirlos a quien no lo es. */
export const useQuerySuperadmins = (enabled: boolean) =>
  useQuery({
    queryKey: ["platform", "superadmins"],
    queryFn: getSuperadmins,
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled,
  });

/** Usuarios de una empresa (superadmin); null = sin consultar. */
export const useQueryCompanyUsers = (companyId: string | null) =>
  useQuery({
    queryKey: ["platform", "company-users", companyId],
    queryFn: () => getCompanyUsers(companyId as string),
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: companyId !== null,
  });

export const useQueryPlatformCompanies = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["platform", "companies"],
    queryFn: getPlatformCompanies,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    enabled,
  });

export const useQueryContacts = (
  currentPage: number,
  search: string,
  status: ContactStatusFilter = "all",
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["contacts", validPage, search, status],
    queryFn: () => getContacts(validPage, search, status),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/**
 * Códigos promocionales. El estado (vigente, vencido...) depende de la hora,
 * así que se refresca al volver a la pestaña tras un minuto.
 */
export const useQueryPromoCodes = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["promo-codes", validPage, search],
    queryFn: () => getPromoCodes(validPage, search),
    ...SALES_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/**
 * Productos de una categoría en su orden de la tienda (modal de orden).
 * Bajo "products" para que crear/editar/eliminar productos lo refresque.
 */
export const useQueryCategoryProducts = (categoryId: string | null) =>
  useQuery({
    queryKey: ["products", "by-category", categoryId],
    queryFn: () => getCategoryProducts(categoryId as string),
    refetchOnWindowFocus: false,
    enabled: categoryId !== null,
  });

export const useQueryProducts = (
  currentPage: number,
  search: string,
  enabled: boolean = true,
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["products", validPage, search],
    queryFn: () => getProducts(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: enabled && currentPage > 0,
  });
};

export const useQueryCarousels = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["carousels", validPage, search],
    queryFn: () => getCarousels(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/**
 * Productos disponibles para asignar a un carrusel (los que aún no
 * pertenecen a ninguno). Sin staleTime porque la disponibilidad cambia
 * cada vez que se crea o edita un carrusel.
 */
export const useQueryAvailableProducts = (
  currentPage: number,
  search: string,
  categoryIds: string[],
  enabled: boolean = true,
  carouselId?: string,
  discount: "all" | "with" | "without" = "all",
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["available-products", validPage, search, categoryIds, carouselId ?? null, discount],
    queryFn: () => getProductsByCategory(validPage, search, categoryIds, carouselId, discount),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled: enabled && currentPage > 0,
  });
};

export const useQueryFeaturedProducts = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["featured-products", validPage, search],
    queryFn: () => getFeaturedProducts(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

/** `date` en formato DD/MM/YYYY (ver getSales en request.ts). */
export const useQuerySales = (
  currentPage: number,
  date: string,
  status: string,
  search: string = "",
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["sales", validPage, date, status, search],
    queryFn: () => getSales(validPage, { date, status, search }),
    ...SALES_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

export const useQuerySale = (id: string) =>
  useQuery({
    queryKey: ["sales", id],
    queryFn: () => getSale(id),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
    enabled: Boolean(id),
  });
