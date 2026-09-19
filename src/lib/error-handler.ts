import { isAxiosError } from "axios";
import { toast } from "@heroui/react";

// Database error codes (PostgreSQL)
const DB_ERROR_MESSAGES: Record<string, string> = {
  "23505": "Ya existe un registro con esos datos.",
  "23503": "No se puede completar la operación por referencias relacionadas.",
  "23502": "Faltan datos obligatorios en el registro.",
  "23514": "Los datos no cumplen con las restricciones requeridas.",
};

// Códigos de negocio devueltos por el backend
const API_ERROR_MESSAGES: Record<string, string> = {
  CAROUSEL_NAME_REQUIRED: "El nombre del carrusel es obligatorio.",
  CAROUSEL_PRODUCTS_RANGE: "Un carrusel debe tener entre 3 y 8 productos.",
  CAROUSEL_PRODUCTS_INVALID:
    "Alguno de los productos seleccionados ya no está disponible.",
  CAROUSEL_LIMIT_REACHED: "Has alcanzado el límite de carruseles permitidos.",
  CAROUSEL_NOT_FOUND: "El carrusel ya no existe.",
  CAROUSEL_PRODUCTS_ASSIGNED: "Alguno de los productos ya pertenece a otro carrusel.",
  FEATURED_PRODUCT_REQUIRED: "Debes seleccionar un producto.",
  FEATURED_PRODUCT_NOT_FOUND: "El producto ya no existe.",
  FEATURED_PRODUCT_DUPLICATED: "Este producto ya está destacado.",
  FEATURED_LIMIT_REACHED:
    "Has alcanzado el límite de productos destacados permitidos.",
  PRODUCT_TITLE_DUPLICATED: "Ya existe un producto con ese título en tu tienda. Usa otro título.",
  PRODUCT_NOT_FOUND: "El producto ya no existe.",
  COVER_LIMIT_REACHED: "Solo puedes tener 5 portadas. Elimina una para crear otra.",
  COVER_TITLE_DUPLICATED: "Ya existe una portada con ese título. Usa otro título.",
  COVER_NOT_FOUND: "La portada ya no existe.",
  ATTRIBUTE_IN_USE:
    "El atributo lo usan productos. Quítalo de esos productos antes de eliminarlo.",
  ATTRIBUTE_DUPLICATED: "Ya existe un atributo con ese nombre.",
  ATTRIBUTE_NOT_FOUND: "El atributo ya no existe.",
  CATEGORY_IN_USE:
    "La categoría tiene productos asignados. Cámbialos de categoría antes de eliminarla.",
  CATEGORY_HAS_IMAGES:
    "La categoría contiene imágenes en la galería. Elimínalas o muévelas antes de eliminarla.",
  CATEGORY_DUPLICATED: "Ya existe una categoría con ese nombre.",
  CATEGORY_NOT_FOUND: "La categoría ya no existe.",
  IMAGE_LIMIT: "Un producto sin atributo de color admite como máximo 4 imágenes.",
  INVALID_BUNDLE_SIZE: "Un set debe tener entre 2 y 10 piezas.",
  BUNDLE_REQUIRES_VARIANTS:
    "Un set necesita al menos un atributo que controle inventario (color, talla...).",
  VARIANT_LIMIT:
    "El producto genera demasiadas combinaciones. Desactiva «Controla inventario» en algún atributo.",
  IMAGES_REQUIRED: "Selecciona al menos una imagen.",
  MOVE_LIMIT: "Puedes mover como máximo 10 imágenes a la vez.",
  CATEGORY_REQUIRED: "Selecciona la categoría de destino.",
  CONTACT_NOT_FOUND: "El mensaje ya no existe.",
  USER_NOT_FOUND: "El usuario ya no existe.",
  PLAN_PRODUCT_LIMIT: "Has alcanzado el tope de productos de tu plan. Contacta a VendeYa para ampliarlo.",
  PLAN_IMAGE_LIMIT: "Has alcanzado el tope de imágenes de tu plan. Contacta a VendeYa para ampliarlo.",
  COMPANY_NOT_FOUND: "La empresa ya no existe.",
  COMPANY_DUPLICATED: "Ya existe una empresa con ese nombre.",
  INVALID_COMPANY_NAME: "El nombre de la empresa debe tener entre 2 y 80 caracteres.",
  INVALID_PLAN_LIMIT: "El tope indicado está fuera del rango permitido.",
  USER_EMAIL_DUPLICATED: "Ya existe un usuario con ese correo electrónico.",
  CANNOT_DELETE_SELF: "No puedes eliminar tu propio usuario.",
  CANNOT_CHANGE_OWN_ROLE: "No puedes cambiar tu propio rol.",
  LAST_ADMIN: "Es el único administrador: asigna otro administrador antes.",
  IMAGE_IN_USE: "La imagen está en uso por algún producto o portada.",
};

export const handleAxiosError = (error: unknown, defaultMessage: string) => {
  if (!isAxiosError(error)) {
    toast.danger(defaultMessage);
    return;
  }

  // Network & timeout errors
  if (error.message === "Network Error") {
    toast.danger(
      "No se pudo conectar al servidor. Verifica tu conexión a internet.",
    );
    return;
  }

  if (error.code === "ECONNABORTED") {
    toast.danger("La conexión está tardando demasiado. Inténtalo nuevamente.");
    return;
  }

  const code: string | undefined = error.response?.data?.code;
  const serverMessage: string | undefined = error.response?.data?.message;

  // Business rules with a fixed translation in the panel
  if (code && API_ERROR_MESSAGES[code]) {
    toast.danger(API_ERROR_MESSAGES[code]);
    return;
  }

  // El backend ya responde con mensajes claros en español: se muestran tal cual.
  if (serverMessage) {
    toast.danger(serverMessage);
    return;
  }

  // Database errors (PostgreSQL codes) without a message
  if (code && DB_ERROR_MESSAGES[code]) {
    toast.danger(DB_ERROR_MESSAGES[code]);
    return;
  }

  // HTTP status codes
  const status = error.response?.status;
  switch (status) {
    case 400:
      toast.danger("Solicitud incorrecta. Verifique los datos.");
      break;
    case 401:
      toast.danger("Sesión expirada o no autorizada.");
      break;
    case 403:
      toast.danger("No tienes permisos para realizar esta acción.");
      break;
    case 404:
      toast.danger("Recurso no encontrado.");
      break;
    case 409:
      toast.danger("Ya existe un registro con estos datos.");
      break;
    case 500:
      toast.danger("Error interno del servidor. Inténtelo más tarde.");
      break;
    default:
      toast.danger(defaultMessage);
  }
};
