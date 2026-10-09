import { ROLE_LABELS } from "@/config/navigation";
import type { AuditCategory, AuditEntry } from "@/interfaces/platform";

/** Texto de cada acción registrada (los códigos los define el backend: modules/audit/audit.constants.js). */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "company.create": "Creó una empresa",
  "company.update": "Editó una empresa",
  "company_user.create": "Creó un usuario",
  "company_user.update": "Editó un usuario",
  "company_user.delete": "Eliminó un usuario",
  "superadmin.create": "Creó un superadministrador",
  "superadmin.update": "Editó un superadministrador",
  "superadmin.delete": "Eliminó un superadministrador",
  "payments.update": "Cambió Mercado Pago",
  "whatsapp.update": "Cambió WhatsApp",
  "marketing_limits.update": "Cambió los límites de Marketing",
};

export const AUDIT_CATEGORY_OPTIONS: { id: AuditCategory | "all"; label: string }[] = [
  { id: "all", label: "Todas las acciones" },
  { id: "companies", label: "Empresas" },
  { id: "users", label: "Usuarios de empresas" },
  { id: "superadmins", label: "Superadministradores" },
  { id: "settings", label: "Configuración" },
];

/** Campo de empresa → cómo se llama para quien lee el registro. */
const COMPANY_FIELD_LABELS: Record<string, string> = {
  name: "nombre",
  max_products: "tope de productos",
  max_images: "tope de imágenes",
  shipping_fee: "costo de envío",
  free_shipping_from: "envío gratis desde",
  features: "vistas de pago",
  marketing_product_path: "ruta de producto",
  marketing_test_email: "correo de prueba",
  marketing_test_sends: "correos de prueba usados",
  marketing_monthly_limit: "límite mensual de correos",
  marketing_daily_limit: "límite diario de correos",
  marketing_hourly_limit: "límite por hora de correos",
};

const formatValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "sin valor";
  if (Array.isArray(value)) return value.length === 0 ? "ninguna" : value.join(", ");
  if (field === "role" && typeof value === "string") return ROLE_LABELS[value] ?? value;
  return String(value);
};

type Change = { from: unknown; to: unknown };

const describeChanges = (changes: Record<string, Change> | undefined, labels: Record<string, string>) =>
  Object.entries(changes ?? {}).map(
    ([field, { from, to }]) => `${labels[field] ?? field}: ${formatValue(field, from)} → ${formatValue(field, to)}`,
  );

const USER_FIELD_LABELS = { username: "nombre", email: "correo", role: "rol" };

const tokenText = (token: unknown) =>
  token === "changed" ? "token cambiado" : token === "removed" ? "token quitado" : null;

/** Línea de detalle bajo la acción: sobre quién y qué cambió. Nunca incluye secretos (el backend no los guarda). */
export const describeAuditEntry = (entry: AuditEntry): string => {
  const details = (entry.details ?? {}) as Record<string, unknown>;
  const parts: string[] = [];

  switch (entry.action) {
    case "company.create":
      parts.push(entry.company_name ?? "", details.admin_email ? `administrador ${details.admin_email}` : "");
      break;
    case "company.update":
      parts.push(...describeChanges(details.changes as Record<string, Change>, COMPANY_FIELD_LABELS));
      break;
    case "company_user.create":
    case "superadmin.create":
      parts.push(entry.target_label ?? "", details.role ? `rol ${formatValue("role", details.role)}` : "");
      break;
    case "company_user.update":
    case "superadmin.update":
      parts.push(entry.target_label ?? "", ...describeChanges(details.changes as Record<string, Change>, USER_FIELD_LABELS));
      if (details.password_changed) parts.push("contraseña cambiada");
      break;
    case "company_user.delete":
    case "superadmin.delete":
      parts.push(entry.target_label ?? "", details.role ? `era ${formatValue("role", details.role)}` : "");
      break;
    case "payments.update":
    case "whatsapp.update":
      parts.push(details.enabled === true ? "activado" : details.enabled === false ? "desactivado" : "", tokenText(details.token) ?? "");
      break;
    case "marketing_limits.update":
      parts.push(
        ...describeChanges(details.changes as Record<string, Change>, {
          monthly: "correos por mes",
          daily: "correos por día",
          hourly: "correos por hora",
        }),
      );
      break;
    default:
      parts.push(entry.target_label ?? "");
  }
  return parts.filter(Boolean).join(" · ");
};

/** Fecha y hora en Colombia: "9 oct 2026, 3:42 p. m.". */
export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
