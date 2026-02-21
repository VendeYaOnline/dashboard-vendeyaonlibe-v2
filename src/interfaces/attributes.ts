export interface Attributes {
  attributes: Attribute[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface Attribute {
  id?: number;
  attribute_name: string;
  attribute_type: string;
  value: string[] | { name: string; value: string }[];
}
