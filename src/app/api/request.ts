import { Attribute, Attributes } from "@/interfaces/attributes";
import { axiosConfig } from "./config";
import { Categories } from "@/interfaces/categories";
import { Images } from "@/interfaces/images";
import { UserRequest } from "@/interfaces/users";
import { ContactRequest } from "@/interfaces/contacts";
import { ProductRequest } from "@/interfaces/products";

// ? Login User
export const loginUser = async (data: { email: string; password: string }) => {
  return axiosConfig.post("/login-user", data);
};

// ------------------------------------
// * Attributes
// ------------------------------------

// ? Get Attributes
export const getAttributes = async (page: number, search: string = "") => {
  return (
    await axiosConfig.get<Attributes>(
      `/get-attributes?page=${page}&search=${search}`,
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
export const deleteAttribute = async (idElement: number) => {
  return axiosConfig.delete(`/delete-attribute/${idElement}`);
};

// ------------------------------------
// * Categories
// ------------------------------------

export const createCategory = async (name: string) => {
  return axiosConfig.post("/create-category", { name });
};

export const getCategories = async (page: number, search: string = "") => {
  const result = (
    await axiosConfig.get<Categories>(
      `/get-categories?page=${page}&search=${search}`,
    )
  ).data;

  return result;
};

export const deleteCategory = async (idElement: number) => {
  return axiosConfig.delete(`/delete-category/${idElement}`);
};

export const updatedCategory = async (data: { id: number; name: string }) => {
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

export const uploadImages = async (data: FormData) => {
  return axiosConfig.post("/upload-images", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteImage = async (idElement: string) => {
  return axiosConfig.delete(`/delete-image/${idElement}`);
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
  id: number;
  data: { username: string; email: string; role: string };
}) => {
  return axiosConfig.put(`/updated-user/${id}`, data);
};

export const deleteUser = async (idElement: number) => {
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

export const deleteContact = async (idElement: number) => {
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

export const getProductsByCategory = async (
  page: number,
  search: string = "",
  categories: { id: number; name: string }[],
) => {
  const categoryParams = categories
    .map((category) => `categoryId=${category.id}`)
    .join("&");
  const result = (
    await axiosConfig.get<ProductRequest>(
      `/get-products-category?page=${page}&search=${search}&${categoryParams}`,
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
  id: number;
  data: FormData;
}) => {
  return axiosConfig.put(`/updated-product/${id}`, data);
};

export const deleteProduct = async (idElement: number) => {
  return axiosConfig.delete(`/delete-product/${idElement}`);
};
