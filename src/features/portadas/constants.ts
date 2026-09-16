/** Tope de portadas por tienda (el backend devuelve el valor real en `maxCovers`). */
export const MAX_COVERS = 5;

export const MAX_COVER_TITLE_LENGTH = 60;
export const MAX_COVER_DESCRIPTION_LENGTH = 200;
export const MAX_COVER_LINK_LENGTH = 300;

/** URL absoluta (https://...) o ruta interna de la tienda (/coleccion). */
export const isValidCoverLink = (link: string) =>
  link === "" || /^(https?:\/\/|\/)/.test(link);
