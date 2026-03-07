import { useQuery } from "@tanstack/react-query";
import { getAttributes, getCategories, getImages } from "./request";

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
