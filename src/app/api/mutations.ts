import { useMutation } from "@tanstack/react-query";
import {
  createAttribute,
  createCarousel,
  createCategory,
  createPlatformCompany,
  updatePlatformCompany,
  saveMarketingBrand,
  saveMarketingTemplate,
  sendMarketingTestEmail,
  createMarketingCampaign,
  markCampaignRecipient,
  updateMercadoPagoSettings,
  createCover,
  createFeaturedProduct,
  createProduct,
  createSale,
  createUser,
  deleteSale,
  deleteAttribute,
  deleteCarousel,
  deleteCategory,
  deleteCover,
  deleteContact,
  deleteFeaturedProduct,
  deleteImage,
  deleteProduct,
  deleteUser,
  moveImages,
  renameImage,
  createPromoCode,
  deletePromoCode,
  togglePromoCode,
  updatePromoCode,
  reorderCategories,
  reorderCategoryProducts,
  reorderCovers,
  updatedAttribute,
  updatedCarousel,
  updatedCategory,
  updateContactRead,
  updateCover,
  updatedProduct,
  updateProductStock,
  updateProductVisibility,
  updateSaleStatus,
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
      // El cambio se propaga a los productos que usan el atributo (nombre, valores, variantes).
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["carousels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
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

export const useMutationReorderCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

// * CÓDIGOS PROMOCIONALES

const usePromoCodeMutation = <TVariables,>(mutationFn: (variables: TVariables) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
  });
};

export const useMutationCreatePromoCode = () => usePromoCodeMutation(createPromoCode);
export const useMutationUpdatePromoCode = () => usePromoCodeMutation(updatePromoCode);
export const useMutationTogglePromoCode = () => usePromoCodeMutation(togglePromoCode);
export const useMutationDeletePromoCode = () => usePromoCodeMutation(deletePromoCode);

export const useMutationReorderCategoryProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderCategoryProducts,
    onSuccess: (_data, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["products", "by-category", categoryId] });
    },
  });
};

export const useMutationUpdatedCategory =() => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

// * COVERS (portadas)

export const useMutationCreateCover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["covers"] });
    },
  });
};

export const useMutationUpdateCover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["covers"] });
    },
  });
};

export const useMutationReorderCovers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderCovers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["covers"] });
    },
  });
};

export const useMutationDeleteCover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["covers"] });
    },
  });
};

// * IMAGES

export const useMutationImages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

export const useMutationRenameImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renameImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      // La imagen renombrada puede ser la de algún producto: su URL cambió
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["carousels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
    },
  });
};

export const useMutationMoveImages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      // Las URLs cambian de carpeta: productos, portadas y carruseles las referencian.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["covers"] });
      queryClient.invalidateQueries({ queryKey: ["carousels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
    },
  });
};

export const useMutationDeleteImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      // Puede haber quitado la imagen de la galería secundaria de un producto
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["carousels"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
    },
  });
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

// * Plataforma

export const useMutationCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlatformCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
    },
  });
};

export const useMutationUpdateMercadoPagoSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMercadoPagoSettings,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["platform", "mercadopago", id] });
    },
  });
};

export const useMutationUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlatformCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

// * Marketing

export const useMutationSaveMarketingBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMarketingBrand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketing"] }),
  });
};

export const useMutationSaveMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMarketingTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketing"] }),
  });
};

export const useMutationSendMarketingTest = () => useMutation({ mutationFn: sendMarketingTestEmail });

export const useMutationCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMarketingCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["marketing", "audience"] });
    },
  });
};

export const useMutationMarkRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markCampaignRecipient,
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
    },
  });
};

// * Contacts

export const useMutationContactRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateContactRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

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
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

export const useMutationUpdatedProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

export const useMutationUpdateProductStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

export const useMutationUpdateProductVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductVisibility,
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
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

//* Carrusel

/** Crear o editar un carrusel cambia qué productos quedan disponibles. */
const invalidateCarousels = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["carousels"] });
  queryClient.invalidateQueries({ queryKey: ["available-products"] });
};

export const useMutationCarousel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCarousel,
    onSuccess: () => invalidateCarousels(queryClient),
  });
};

export const useMutationUpdatedCarousel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatedCarousel,
    onSuccess: () => invalidateCarousels(queryClient),
  });
};

export const useMutationDeleteCarousel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCarousel,
    onSuccess: () => invalidateCarousels(queryClient),
  });
};

//* Productos destacados

export const useMutationFeaturedProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFeaturedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      // La tabla de productos muestra la marca "star".
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useMutationDeleteFeaturedProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFeaturedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

// * Ventas

export const useMutationCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};

export const useMutationUpdateSaleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSaleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
};

export const useMutationDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
    },
  });
};
