import { isAxiosError } from "axios";
import { toast } from "sonner";

// Database error codes (PostgreSQL)
const DB_ERROR_MESSAGES: Record<string, string> = {
  "23505": "Ya existe un registro con esos datos.",
  "23503": "No se puede completar la operación por referencias relacionadas.",
  "23502": "Faltan datos obligatorios en el registro.",
  "23514": "Los datos no cumplen con las restricciones requeridas.",
};

export const handleAxiosError = (error: unknown, defaultMessage: string) => {
  if (!isAxiosError(error)) {
    toast.error(defaultMessage);
    return;
  }

  // Network & timeout errors
  if (error.message === "Network Error") {
    toast.error(
      "No se pudo conectar al servidor. Verifica tu conexión a internet.",
    );
    return;
  }

  if (error.code === "ECONNABORTED") {
    toast.error("La conexión está tardando demasiado. Inténtalo nuevamente.");
    return;
  }

  // Database errors (PostgreSQL codes coming from the backend)
  const dbErrorCode = error.response?.data?.code;
  if (dbErrorCode && DB_ERROR_MESSAGES[dbErrorCode]) {
    toast.error(DB_ERROR_MESSAGES[dbErrorCode]);
    return;
  }

  // Server message (custom message from the backend)
  const serverMessage = error.response?.data?.message;
  if (serverMessage) {
    toast.error(serverMessage);
    return;
  }

  // HTTP status codes
  const status = error.response?.status;
  switch (status) {
    case 400:
      toast.error("Solicitud incorrecta. Verifique los datos.");
      break;
    case 401:
      toast.error("Sesión expirada o no autorizada.");
      break;
    case 403:
      toast.error("No tienes permisos para realizar esta acción.");
      break;
    case 404:
      toast.error("Recurso no encontrado.");
      break;
    case 409:
      toast.error("Ya existe un registro con estos datos.");
      break;
    case 500:
      toast.error("Error interno del servidor. Inténtelo más tarde.");
      break;
    default:
      toast.error(defaultMessage);
  }
};
