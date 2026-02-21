export interface Category {
  id: number;
  name: string;
}

export interface Categories {
  categories: Category[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}
