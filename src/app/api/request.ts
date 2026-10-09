import type { CoverPayload, Covers } from "@/interfaces/covers";
import type { InventoryFilters, InventoryResponse } from "@/interfaces/inventory";
import type { CustomersFilters, CustomersResponse } from "@/interfaces/customers";
import type { PaidFeature } from "@/config/navigation";
import type {
  ContactsFilter,
  CreateCampaignResponse,
  MarketingContactsResponse,
  CampaignChannel,
  CampaignSegment,
  MarketingAudience,
  MarketingBrand,
  MarketingCampaign,
  MarketingCampaignDetail,
  MarketingPreviewRequest,
  MarketingResponse,
  MarketingTemplate,
  MarketingTemplateDraft,
} from "@/interfaces/marketing";
import { Attribute, Attributes } from "@/interfaces/attributes";
import { axiosConfig } from "./config";
import { Categories, CategoryProductsResponse } from "@/interfaces/categories";
import type { PromoCodePayload, PromoCodesResponse } from "@/interfaces/promo-codes";
import { Images } from "@/interfaces/images";
import { UserRequest } from "@/interfaces/users";
import { ContactRequest, ContactStatusFilter, Contacts } from "@/interfaces/contacts";
import type { AnalyticsPeriod, AnalyticsResponse } from "@/interfaces/analytics";
import type {
  CreateCompanyPayload,
  PlanResponse,
  MercadoPagoSettings,
  MercadoPagoSettingsPayload,
  PlatformCompaniesResponse,
  PlatformConfig,
  UpdateCompanyPayload,
  MarketingLimits,
  WhatsappSettings,
  WhatsappSettingsPayload,
} from "@/interfaces/platform";
import { ProductRequest } from "@/interfaces/products";
import { CarouselPayload, CarouselRequest } from "@/interfaces/carousel";
import { FeaturedProductRequest } from "@/interfaces/featured-products";
import { CreateSalePayload, Sale, SaleRequest } from "@/features/ventas/types";

// ? Login User
export const loginUser = async (data: { email: string; password: string; remember: boolean }) => {
  return axiosConfig.post("/login-user", data);
};

/** Comprueba la cookie o token vigente antes de mostrar el panel. */
export const verifySession = async () =>
  (await axiosConfig.get<{ user: { username: string; email: string; role: string } }>("/verify-token")).data;

// ------------------------------------
// * Attributes
// ------------------------------------

// ? Get Attributes
export const getAttributes = async (
  page: number,
  search: string = "",
  limit?: number,
) => {
  const limitParam = limit ? `&limit=${limit}` : "";
  return (
    await axiosConfig.get<Attributes>(
      `/get-attributes?page=${page}&search=${search}${limitParam}`,
    )
  ).data;
};

// ? Create Attribute
export const createAttribute = async (data: Attribute) => {
  return axiosConfig.post("/create-attribute", data);
};

// ? Update Attribute
export const updatedAttribute = async ({ id, ...data }: Attribute) => {
  return axiosConfig.put<{ message: string; updatedProducts: number }>(`/update-attribute/${id}`, data);
};

// ? Delete Attribute
export const deleteAttribute = async (idElement: string) => {
  return axiosConfig.delete(`/delete-attribute/${idElement}`);
};

// ------------------------------------
// * Categories
// ------------------------------------

export const createCategory = async (data: { name: string; image: string | null }) => {
  return axiosConfig.post("/create-category", data);
};

export const getCategories = async (
  page: number,
  search: string = "",
  limit?: number,
) => {
  const limitParam = limit ? `&limit=${limit}` : "";
  const result = (
    await axiosConfig.get<Categories>(
      `/get-categories?page=${page}&search=${search}${limitParam}`,
    )
  ).data;

  return result;
};

export const deleteCategory = async (idElement: string) => {
  return axiosConfig.delete(`/delete-category/${idElement}`);
};

export const updatedCategory = async (data: { id: string; name: string; image: string | null }) => {
  return axiosConfig.put(`/updated-category/${data.id}`, { name: data.name, image: data.image });
};

//* Imagenes

export const getImages = async (
  page: number,
  search: string,
  limit: number,
  categoryId?: string,
) => {
  const params = new URLSearchParams({
    page: String(page),
    search,
    limit: String(limit),
  });
  if (categoryId) {
    params.append("categoryId", categoryId);
  }
  const result = (
    await axiosConfig.get<Images>(`/get-images?${params.toString()}`)
  ).data;
  return result;
};

/**
 * El backend recibe los archivos en el campo `images` (multer.array) y la
 * categoría por query string, no en el body.
 */
export const uploadImages = async ({
  categoryId,
  formData,
}: {
  categoryId: string;
  formData: FormData;
}) => {
  // Sin categoría se sube a la raíz de la galería.
  return axiosConfig.post(
    categoryId ? `/upload-images?categoryId=${encodeURIComponent(categoryId)}` : "/upload-images",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

/** Sólo cambia el nombre del archivo; la categoría (carpeta) la conserva el backend. */
export interface MoveImagesResponse {
  message: string;
  category: { id: string; name: string };
  moved: { key: string; newKey: string; url: string; unchanged?: boolean }[];
  failed: { key: string; code: string; message: string }[];
  updatedProducts: number;
}

/** Mueve una o varias imágenes a la carpeta de otra categoría. */
export const moveImages = async ({ keys, categoryId }: { keys: string[]; categoryId: string }) => {
  return axiosConfig.put<MoveImagesResponse>("/move-images", { keys, categoryId });
};

export const renameImage = async ({
  key,
  newName,
}: {
  key: string;
  newName: string;
}) => {
  return axiosConfig.put<{
    message: string;
    key: string;
    url: string;
    updatedProducts: number;
  }>("/rename-image", { key, newName });
};

// La clave de S3 viaja por query string: DELETE /delete-image?key=...
export const deleteImage = async (key: string) => {
  return axiosConfig.delete<{ message: string; updatedProducts: number }>(
    `/delete-image?key=${encodeURIComponent(key)}`,
  );
};

// * Users

export const getUsers = async (page: number, search: string = "") => {
  const result = (
    await axiosConfig.get<UserRequest>(
      `/get-users?page=${page}&search=${search}`,
    )
  ).data;

  return result;
};

export const createUser = async (data: {
  username: string;
  email: string;
  password: string;
  role: string;
}) => {
  return axiosConfig.post("/create-user", data);
};

export const updatedUser = async ({
  id,
  data,
}: {
  id: string;
  /** `password` opcional: si va vacía o falta, se conserva la actual. */
  data: { username: string; email: string; role: string; password?: string };
}) => {
  return axiosConfig.put(`/updated-user/${id}`, data);
};

export const deleteUser = async (idElement: string) => {
  return axiosConfig.delete(`/delete-user/${idElement}`);
};

// * Contacts

export const getContacts = async (
  page: number,
  search: string = "",
  status: ContactStatusFilter = "all",
) => {
  const params = new URLSearchParams({ page: String(page), search, status });
  return (await axiosConfig.get<ContactRequest>(`/get-contacts?${params}`)).data;
};

/** Marca un mensaje como leído / no leído. */
export const updateContactRead = async ({ id, isRead }: { id: string; isRead: boolean }) => {
  return axiosConfig.patch<{ message: string; contact: Contacts }>(
    `/update-contact-read/${id}`,
    { is_read: isRead },
  );
};

export const deleteContact = async (idElement: string) => {
  return axiosConfig.delete(`/delete-contact/${idElement}`);
};

// * Analytics

export const getAnalytics = async (period: AnalyticsPeriod) => {
  return (await axiosConfig.get<AnalyticsResponse>(`/get-analytics?period=${period}`)).data;
};

// * Inventario

export const getInventory = async ({ page, search, status, categoryId, staleDays, sort }: InventoryFilters) => {
  const params = new URLSearchParams({ page: String(page), sort });
  if (search) params.set("search", search);
  if (status !== "all") params.set("status", status);
  if (categoryId !== "all") params.set("categoryId", categoryId);
  if (staleDays) params.set("staleDays", String(staleDays));
  return (await axiosConfig.get<InventoryResponse>(`/get-inventory?${params}`)).data;
};

export const getCustomers = async ({ page, search, segment, payment, pending, sort }: CustomersFilters) => {
  const params = new URLSearchParams({ page: String(page), sort });
  if (search) params.set("search", search);
  if (segment !== "all") params.set("segment", segment);
  if (payment !== "all") params.set("payment", payment);
  if (pending) params.set("pending", "1");
  return (await axiosConfig.get<CustomersResponse>(`/get-customers?${params}`)).data;
};

// * Marketing (vista de pago)

export const getMarketing = async () => (await axiosConfig.get<MarketingResponse>("/marketing")).data;

export const saveMarketingBrand = async (brand: MarketingBrand) =>
  (await axiosConfig.put<{ message: string; brand: MarketingBrand }>("/marketing/brand", brand)).data;

export const saveMarketingTemplate = async ({ slot, template }: { slot: number; template: MarketingTemplateDraft }) =>
  (await axiosConfig.put<{ message: string; template: MarketingTemplate }>(`/marketing/templates/${slot}`, template)).data;

export const previewMarketingEmail = async (body: MarketingPreviewRequest) =>
  (await axiosConfig.post<{ subject: string; html: string }>("/marketing/preview", body)).data;

export const sendMarketingTestEmail = async (body: MarketingPreviewRequest) =>
  (await axiosConfig.post<{ message: string; to: string; test: { used: number; limit: number } }>("/marketing/test-email", body)).data;

export const getMarketingAudience = async () => (await axiosConfig.get<MarketingAudience>("/marketing/audience")).data;

export const getMarketingCampaigns = async () =>
  (await axiosConfig.get<{ campaigns: MarketingCampaign[] }>("/marketing/campaigns")).data;

export const getMarketingCampaign = async (id: string) =>
  (await axiosConfig.get<MarketingCampaignDetail>(`/marketing/campaigns/${id}`)).data;

/** `request_id`: uno por confirmación; repetirlo no crea otra campaña (doble clic). */
export const createMarketingCampaign = async (body: { slot: number; segment: CampaignSegment; channel: CampaignChannel; request_id: string }) =>
  (await axiosConfig.post<CreateCampaignResponse>("/marketing/campaigns", body)).data;

export const markCampaignRecipient = async ({
  campaignId,
  recipientId,
  status,
}: {
  campaignId: string;
  recipientId: string;
  status: "opened" | "contacted" | "pending";
}) => (await axiosConfig.patch(`/marketing/campaigns/${campaignId}/recipients/${recipientId}`, { status })).data;

export const getMarketingContacts = async ({ page, search, filter }: { page: number; search: string; filter: ContactsFilter }) => {
  const params = new URLSearchParams({ page: String(page), filter });
  if (search) params.set("search", search);
  return (await axiosConfig.get<MarketingContactsResponse>(`/marketing/contacts?${params}`)).data;
};

// Superadmin: límites globales de Marketing y WhatsApp Cloud API por tienda.
export const getMarketingLimits = async () =>
  (await axiosConfig.get<{ limits: MarketingLimits }>("/platform/marketing-limits")).data;

export const updateMarketingLimits = async (limits: MarketingLimits) =>
  (await axiosConfig.put<{ message: string; limits: MarketingLimits }>("/platform/marketing-limits", limits)).data;

export const getWhatsappSettings = async (companyId: string) =>
  (await axiosConfig.get<WhatsappSettings>(`/platform/companies/${companyId}/whatsapp`)).data;

export const updateWhatsappSettings = async ({ id, data }: { id: string; data: WhatsappSettingsPayload }) =>
  (await axiosConfig.put<{ message: string; settings: WhatsappSettings }>(`/platform/companies/${id}/whatsapp`, data)).data;

// WhatsApp Cloud API de la propia tienda (Marketing).
export const getMyWhatsappSettings = async () => (await axiosConfig.get<WhatsappSettings>("/marketing/whatsapp")).data;

export const updateMyWhatsappSettings = async (data: WhatsappSettingsPayload) =>
  (await axiosConfig.put<{ message: string; settings: WhatsappSettings }>("/marketing/whatsapp", data)).data;

export const testMyWhatsappSettings = async () =>
  (await axiosConfig.post<{ ok: boolean; display_phone: string | null; verified_name: string | null }>("/marketing/whatsapp/test")).data;

export const testWhatsappSettings = async (companyId: string) =>
  (await axiosConfig.post<{ ok: boolean; display_phone: string | null; verified_name: string | null }>(
    `/platform/companies/${companyId}/whatsapp/test`,
  )).data;

// * Plan / Plataforma

export const getPlan = async () => (await axiosConfig.get<PlanResponse>("/get-plan")).data;

/** Vistas de pago activas de la propia empresa (liviano: lo usa el menú). */
export const getFeatures = async () =>
  (await axiosConfig.get<{ features: PaidFeature[] }>("/get-features")).data;

export const getPlatformConfig = async () =>
  (await axiosConfig.get<PlatformConfig>("/platform/config")).data;

export const getPlatformCompanies = async () =>
  (await axiosConfig.get<PlatformCompaniesResponse>("/platform/companies")).data;

export const createPlatformCompany = async (data: CreateCompanyPayload) =>
  axiosConfig.post("/platform/companies", data);

export const updatePlatformCompany = async ({ id, data }: { id: string; data: UpdateCompanyPayload }) =>
  axiosConfig.put(`/platform/companies/${id}`, data);

export const getMercadoPagoSettings = async (companyId: string) =>
  (await axiosConfig.get<MercadoPagoSettings>(`/platform/companies/${companyId}/mercadopago`)).data;

export const updateMercadoPagoSettings = async ({ id, data }: { id: string; data: MercadoPagoSettingsPayload }) =>
  axiosConfig.put<{ message: string; settings: MercadoPagoSettings }>(`/platform/companies/${id}/mercadopago`, data);

export const logoutUser = async () => {
  return axiosConfig.post("/logout-user");
};

// * Productos

export const getProducts = async (page: number, search: string = "") => {
  const result = (
    await axiosConfig.get<ProductRequest>(
      `/get-products?page=${page}&search=${search}`,
    )
  ).data;

  return result;
};

/**
 * Devuelve únicamente los productos que NO pertenecen a ningún carrusel,
 * por eso se usa como fuente del selector de productos del carrusel.
 */
export const getProductsByCategory = async (
  page: number,
  search: string = "",
  categoryIds: string[] = [],
  /** Al editar un carrusel, incluye también sus propios productos. */
  carouselId?: string,
  discount: "all" | "with" | "without" = "all",
) => {
  const params = new URLSearchParams({ page: String(page), search });
  categoryIds.forEach((id) => params.append("categoryId", id));
  if (carouselId) params.append("carouselId", carouselId);
  if (discount !== "all") params.append("discount", discount);

  const result = (
    await axiosConfig.get<ProductRequest>(
      `/get-products-category?${params.toString()}`,
    )
  ).data;

  return result;
};

export const createProduct = async (data: FormData) => {
  return axiosConfig.post("/create-product", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updatedProduct = async ({
  id,
  data,
}: {
  id: string;
  data: FormData;
}) => {
  return axiosConfig.put(`/updated-product/${id}`, data);
};

/** Actualización rápida de inventario: por variante o cantidad general. */
export const updateProductStock = async ({
  id,
  ...data
}: {
  id: string;
  variants?: { variant_key: string; quantity: number }[];
  quantity?: number;
}) => {
  return axiosConfig.patch<{ message: string; quantity: number; stock: boolean }>(
    `/update-product-stock/${id}`,
    data,
  );
};

/** Oculta o vuelve a mostrar un producto en la tienda. */
export const updateProductVisibility = async ({ id, hidden }: { id: string; hidden: boolean }) => {
  return axiosConfig.patch<{ message: string; hidden: boolean }>(
    `/update-product-visibility/${id}`,
    { hidden },
  );
};

export const deleteProduct = async (idElement: string) => {
  return axiosConfig.delete(`/delete-product/${idElement}`);
};

// * Carrusel

export const getCarousels = async (page: number, search: string = "") => {
  const result = (
    await axiosConfig.get<CarouselRequest>(
      `/get-carousels?page=${page}&search=${search}`,
    )
  ).data;

  return result;
};

export const createCarousel = async (data: CarouselPayload) => {
  return axiosConfig.post("/create-carousel", data);
};

export const updatedCarousel = async ({
  id,
  ...data
}: CarouselPayload & { id: string }) => {
  return axiosConfig.put(`/updated-carousel/${id}`, data);
};

export const deleteCarousel = async (idElement: string) => {
  return axiosConfig.delete(`/delete-carousel/${idElement}`);
};

// * Productos destacados

export const getFeaturedProducts = async (page: number, search: string = "") => {
  const result = (
    await axiosConfig.get<FeaturedProductRequest>(
      `/get-featured-products?page=${page}&search=${search}`,
    )
  ).data;

  return result;
};

export const createFeaturedProduct = async (productId: string) => {
  return axiosConfig.post("/create-featured-product", { product_id: productId });
};

export const deleteFeaturedProduct = async (idElement: string) => {
  return axiosConfig.delete(`/delete-featured-product/${idElement}`);
};

// * Ventas

export const createSale = async (payload: CreateSalePayload) => {
  return axiosConfig.post("/create-sale", payload);
};

/**
 * El backend espera la fecha como `DD/MM/YYYY` (parte manualmente el string
 * por "/" en `getSales`), no ISO — ver sales.controller.js.
 */
export const getSales = async (
  page: number,
  filters: { date?: string; status?: string; search?: string } = {},
) => {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.date) params.append("date", filters.date);
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);

  return (await axiosConfig.get<SaleRequest>(`/get-sales?${params.toString()}`))
    .data;
};

/** Venta individual, usada por la ruta /ventas/[id]. */
export const getSale = async (id: string) =>
  (await axiosConfig.get<Sale>(`/get-sale/${encodeURIComponent(id)}`)).data;

/** Cambia el estado del pedido (único campo editable de una venta). */
export const updateSaleStatus = async ({ id, status }: { id: string; status: string }) => {
  return axiosConfig.put<{ message: string; status: string }>(`/updated-sale/${id}`, { status });
};

export const deleteSale = async (idElement: string) => {
  return axiosConfig.delete(`/delete-sale/${idElement}`);
};


// * COVERS (portadas)

export const getCovers = async (page: number, search: string = "") => {
  return (
    await axiosConfig.get<Covers>(`/get-covers?page=${page}&search=${search}`)
  ).data;
};

export const createCover = async (data: CoverPayload) => {
  return axiosConfig.post("/create-cover", data);
};

export const updateCover = async ({ id, ...data }: CoverPayload & { id: string }) => {
  return axiosConfig.put(`/update-cover/${id}`, data);
};

/** Nuevo orden de todas las portadas (posición = índice en el array). */
/** Nuevo orden de todas las categorías (posición = índice en el array). */
export const reorderCategories = async (ids: string[]) => {
  return axiosConfig.put("/reorder-categories", { ids });
};

// * CÓDIGOS PROMOCIONALES

export const getPromoCodes = async (page: number, search: string = "") =>
  (
    await axiosConfig.get<PromoCodesResponse>(
      `/get-promo-codes?page=${page}&search=${encodeURIComponent(search)}`,
    )
  ).data;

export const createPromoCode = async (data: PromoCodePayload) => {
  return axiosConfig.post("/create-promo-code", data);
};

export const updatePromoCode = async ({ id, ...data }: PromoCodePayload & { id: string }) => {
  return axiosConfig.put(`/updated-promo-code/${id}`, data);
};

/** Pausa o reactiva el código sin tocar su configuración. */
export const togglePromoCode = async ({ id, isActive }: { id: string; isActive: boolean }) => {
  return axiosConfig.patch(`/toggle-promo-code/${id}`, { is_active: isActive });
};

export const deletePromoCode = async (id: string) => {
  return axiosConfig.delete(`/delete-promo-code/${id}`);
};

/** Productos de una categoría, en el orden de la tienda. */
export const getCategoryProducts = async (categoryId: string) =>
  (
    await axiosConfig.get<CategoryProductsResponse>(
      `/get-category-products/${encodeURIComponent(categoryId)}`,
    )
  ).data;

/** Nuevo orden de todos los productos de una categoría (posición = índice). */
export const reorderCategoryProducts = async ({
  categoryId,
  ids,
}: {
  categoryId: string;
  ids: string[];
}) => {
  return axiosConfig.put(`/reorder-category-products/${encodeURIComponent(categoryId)}`, { ids });
};

export const reorderCovers = async (ids: string[]) => {
  return axiosConfig.put("/reorder-covers", { ids });
};

export const deleteCover = async (id: string) => {
  return axiosConfig.delete(`/delete-cover/${id}`);
};
