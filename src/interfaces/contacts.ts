export interface ContactRequest {
  contacts: Contacts[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface Contacts {
  id: number;
  subject: string;
  email: string;
  message: string;
}
