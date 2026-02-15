import axios from "axios";

export const axiosConfig = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL_BACKEND,
  timeout: 10000,
  withCredentials: true,
});

axiosConfig.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
