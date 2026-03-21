import { useMutation } from "@tanstack/react-query";
import {
  createAttribute,
  createCategory,
  createProduct,
  createUser,
  deleteAttribute,
  deleteCategory,
  deleteContact,
  deleteImage,
  deleteProduct,
  deleteUser,
  updatedAttribute,
  updatedCategory,
  updatedProduct,
  updatedUser,
  uploadImages,
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

// * IMAGES

export const useMutationImages = () => {
  return useMutation({ mutationFn: uploadImages });
};

export const useMutationDeleteImage = () => {
  return useMutation({ mutationFn: deleteImage });
};

// * USERS

export const useMutationUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useMutationUpdatedUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useMutationDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// * Contacts

export const useMutationDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

//* Products

export const useMutationProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useMutationUpdatedProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useMutationDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
