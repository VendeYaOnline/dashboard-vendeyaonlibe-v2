import type { CoverPayload, Covers } from "@/interfaces/covers";
import { Attribute, Attributes } from "@/interfaces/attributes";
import { axiosConfig } from "./config";
import { Categories } from "@/interfaces/categories";
import { Images } from "@/interfaces/images";
import { UserRequest } from "@/interfaces/users";
import { ContactRequest, ContactStatusFilter, Contacts } from "@/interfaces/contacts";
import type { AnalyticsPeriod, AnalyticsResponse } from "@/interfaces/analytics";
import type {
  CreateCompanyPayload,
  PlanResponse,
  PlatformCompaniesResponse,
  PlatformConfig,
  UpdateCompanyPayload,
} from "@/interfaces/platform";
import { ProductRequest } from "@/interfaces/products";
import { CarouselPayload, CarouselRequest } from "@/interfaces/carousel";
import { FeaturedProductRequest } from "@/interfaces/featured-products";
import { CreateSalePayload, SaleRequest } from "@/features/ventas/types";

// ? Login User
export const loginUser = async (data: { email: string; password: string }) => {
  return axiosConfig.post("/login-user", data);
};

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
  return axiosConfig.post(
    `/upload-images?categoryId=${encodeURIComponent(categoryId)}`,
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

// * Plan / Plataforma

export const getPlan = async () => (await axiosConfig.get<PlanResponse>("/get-plan")).data;

export const getPlatformConfig = async () =>
  (await axiosConfig.get<PlatformConfig>("/platform/config")).data;

export const getPlatformCompanies = async () =>
  (await axiosConfig.get<PlatformCompaniesResponse>("/platform/companies")).data;

export const createPlatformCompany = async (data: CreateCompanyPayload) =>
  axiosConfig.post("/platform/companies", data);

export const updatePlatformCompany = async ({ id, data }: { id: string; data: UpdateCompanyPayload }) =>
  axiosConfig.put(`/platform/companies/${id}`, data);

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
) => {
  const params = new URLSearchParams({ page: String(page), search });
  categoryIds.forEach((id) => params.append("categoryId", id));
  if (carouselId) params.append("carouselId", carouselId);

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
export const reorderCovers = async (ids: string[]) => {
  return axiosConfig.put("/reorder-covers", { ids });
};

export const deleteCover = async (id: string) => {
  return axiosConfig.delete(`/delete-cover/${id}`);
};
