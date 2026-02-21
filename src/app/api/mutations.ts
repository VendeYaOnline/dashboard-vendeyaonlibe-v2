import { useMutation } from "@tanstack/react-query";
import {
  createAttribute,
  createCategory,
  deleteAttribute,
  deleteCategory,
  updatedAttribute,
  updatedCategory,
} from "./request";
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

export const useMutationCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useMutationDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useMutationUpdatedCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
