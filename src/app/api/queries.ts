import { useQuery } from "@tanstack/react-query";
import {
  getAttributes,
  getCarousels,
  getCategories,
  getContacts,
  getFeaturedProducts,
  getImages,
  getProducts,
  getProductsByCategory,
  getUsers,
} from "./request";

export const useQueryAttribute = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["attributes", validPage, search],
    queryFn: () => getAttributes(validPage, search),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: currentPage > 0,
  });
};

export const useQueryCategories = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["categories", validPage, search],
    queryFn: () => getCategories(validPage, search),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: currentPage > 0,
  });
};

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
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: currentPage > 0,
  });
};

export const useQueryUsers = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["users", validPage, search],
    queryFn: () => getUsers(validPage, search),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: currentPage > 0,
  });
};

export const useQueryContacts = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["contacts", validPage, search],
    queryFn: () => getContacts(validPage, search),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
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
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: enabled && currentPage > 0,
  });
};

export const useQueryCarousels = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["carousels", validPage, search],
    queryFn: () => getCarousels(validPage, search),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
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
    enabled: enabled && currentPage > 0,
  });
};

export const useQueryFeaturedProducts = (currentPage: number, search: string) => {
  const validPage = currentPage > 0 ? currentPage : 1;
  return useQuery({
    queryKey: ["featured-products", validPage, search],
    queryFn: () => getFeaturedProducts(validPage, search),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: currentPage > 0,
  });
};
