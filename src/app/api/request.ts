import type { CoverPayload, Covers } from "@/interfaces/covers";
import { Attribute, Attributes } from "@/interfaces/attributes";
import { axiosConfig } from "./config";
import { Categories } from "@/interfaces/categories";
import { Images } from "@/interfaces/images";
import { UserRequest } from "@/interfaces/users";
import { ContactRequest } from "@/interfaces/contacts";
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
  return axiosConfig.put(`/update-attribute/${id}`, data);
};

// ? Delete Attribute
export const deleteAttribute = async (idElement: string) => {
  return axiosConfig.delete(`/delete-attribute/${idElement}`);
};

// ------------------------------------
// * Categories
// ------------------------------------

export const createCategory = async (name: string) => {
  return axiosConfig.post("/create-category", { name });
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

export const updatedCategory = async (data: { id: string; name: string }) => {
  return axiosConfig.put(`/updated-category/${data.id}`, { name: data.name });
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
  data: { username: string; email: string; role: string };
}) => {
  return axiosConfig.put(`/updated-user/${id}`, data);
};

export const deleteUser = async (idElement: string) => {
  return axiosConfig.delete(`/delete-user/${idElement}`);
};

// * Contacts

export const getContacts = async (page: number, search: string = "") => {
  const result = (
    await axiosConfig.get<ContactRequest>(
      `/get-contacts?page=${page}&search=${search}`,
    )
  ).data;

  return result;
};

export const deleteContact = async (idElement: string) => {
  return axiosConfig.delete(`/delete-contact/${idElement}`);
};

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
) => {
  const params = new URLSearchParams({ page: String(page), search });
  categoryIds.forEach((id) => params.append("categoryId", id));

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
  filters: { date?: string; status?: string } = {},
) => {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.date) params.append("date", filters.date);
  if (filters.status) params.append("status", filters.status);

  return (await axiosConfig.get<SaleRequest>(`/get-sales?${params.toString()}`))
    .data;
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

export const deleteCover = async (id: string) => {
  return axiosConfig.delete(`/delete-cover/${id}`);
};
