/** Mismos límites que valida el backend (userSchema). */
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 40;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** Qué puede hacer cada rol; se muestra bajo el selector para elegir bien. */
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Todo el panel, incluidos los usuarios.",
  editor: "Crea y edita productos, ventas, galería y contenido; no gestiona usuarios.",
  viewer: "Solo consulta; no puede crear, editar ni eliminar.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value);
