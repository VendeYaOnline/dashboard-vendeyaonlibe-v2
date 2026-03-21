export interface ProductRequest {
  products: Products[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface Products {
  id: number;
  image_product: string;
  quantity: number;
  title: string;
  price: string;
  stock: boolean;
  discount_price: string;
  attributes: string;
  description: string;
  reference: string;
  discount: number;
  images: string[];
  specs: string;
  Categories: { id: number; name: string }[];
}
