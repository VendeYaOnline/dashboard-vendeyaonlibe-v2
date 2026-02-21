import { useMutation } from "@tanstack/react-query";
import { createAttribute, deleteAttribute, updatedAttribute } from "./request";
import { useQueryClient } from "@tanstack/react-query";

export const useMutationAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });
};

export const useMutationUpdatedAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });
};

export const useMutationDeleteAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });
};
