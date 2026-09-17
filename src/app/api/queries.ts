import { keepPreviousData, useQuery } from "@tanstack/react-query";

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
  getAttributes,
  getCarousels,
  getCategories,
  getContacts,
  getCovers,
  getFeaturedProducts,
  getImages,
  getProducts,
  getProductsByCategory,
  getSales,
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
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["images", validPage, search, categoryId],
    queryFn: () => getImages(validPage, search, limit, categoryId),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
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

export const useQueryContacts = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["contacts", validPage, search],
    queryFn: () => getContacts(validPage, search),
    ...LIST_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};

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
) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["available-products", validPage, search, categoryIds],
    queryFn: () => getProductsByCategory(validPage, search, categoryIds),
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
export const useQuerySales = (currentPage: number, date: string, status: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["sales", validPage, date, status],
    queryFn: () => getSales(validPage, { date, status }),
    ...SALES_QUERY_OPTIONS,
    enabled: currentPage > 0,
  });
};
