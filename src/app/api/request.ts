import { Attribute, Attributes } from "@/interfaces/attributes";
import { axiosConfig } from "./config";
import { Categories } from "@/interfaces/categories";
import { Images } from "@/interfaces/images";

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
    await axiosConfig.get<Images>(
      `/get-images?${params.toString()}`,
    )
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
