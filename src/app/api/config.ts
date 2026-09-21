import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

export const axiosConfig = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL_BACKEND,
  timeout: 10000,
  withCredentials: true,
});

axiosConfig.interceptors.request.use(
  (config) => {
    // Safari bloquea cookies de terceros. El panel y la API viven en
    // dominios distintos, así que el bearer token mantiene la sesión aunque
    // dicha cookie no pueda enviarse.
    const token = localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Un token vencido o inválido no puede dejar datos privados visibles en el
// panel. El RouteGuard observa este logout y redirige al acceso.
axiosConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const isInvalidSession =
      status === 401 || code === "AUTH_TOKEN_EXPIRED" || code === "AUTH_TOKEN_INVALID";

    if (isInvalidSession && typeof window !== "undefined") {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);
