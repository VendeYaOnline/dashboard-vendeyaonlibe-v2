import { Products } from "./products";

export interface Carousel {
  carousels: { id: number; name: string; products: Products[] }[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}
