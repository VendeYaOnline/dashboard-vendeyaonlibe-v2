/** Plan y uso de la empresa del usuario (`GET /get-plan`). null = sin límite. */
export interface PlanResponse {
  company: { id: string; name: string };
  limits: { products: number | null; images: number | null };
  usage: { products: number; images: number };
}

/** Rangos permitidos para los topes (`GET /platform/config`). */
export interface PlatformConfig {
  products: { min: number; max: number };
  images: { min: number; max: number };
  imagesPerProduct: number;
  imagesExtra: number;
}

export interface PlatformCompany {
  id: string;
  name: string;
  /** Carpeta en el bucket; null = raíz (empresa anterior al esquema por carpetas). */
  s3_prefix: string | null;
  created_at: string | null;
  max_products: number | null;
  max_images: number | null;
  products: number;
  users: number;
  /** null cuando no se puede atribuir (varias empresas comparten la raíz). */
  images: number | null;
  admin: { email: string; username: string } | null;
}

export interface PlatformCompaniesResponse {
  companies: PlatformCompany[];
  total: number;
}

export interface CreateCompanyPayload {
  name: string;
  max_products: number | null;
  max_images: number | null;
  admin: { username: string; email: string; password: string };
}

export interface UpdateCompanyPayload {
  name?: string;
  max_products?: number | null;
  max_images?: number | null;
}
