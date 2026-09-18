export interface ContactRequest {
  contacts: Contacts[];
  total: number;
  grandTotal: number;
  /** Mensajes sin leer de la empresa (sin aplicar filtros). */
  unread: number;
  page: number;
  totalPages: number;
}

export interface Contacts {
  id: string;
  subject: string;
  email: string;
  message: string;
  is_read?: boolean;
  /** null en mensajes anteriores a la columna de fecha. */
  created_at?: string | null;
}

/** Filtro de la vista de mensajes (mismo valor que espera el backend). */
export type ContactStatusFilter = "all" | "unread" | "read";
