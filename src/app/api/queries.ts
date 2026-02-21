import { useQuery } from "@tanstack/react-query";
import { getAttributes } from "./request";

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
