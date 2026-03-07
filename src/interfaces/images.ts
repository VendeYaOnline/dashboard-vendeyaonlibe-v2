export interface Images {
  images: {
    Key: string;
    LastModified: string;
    Size: number;
    Url: string;
  }[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}
