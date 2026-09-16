export interface Attributes {
  attributes: Attribute[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

/**
 * Un color se guardó como `{ name, value }` (este panel) o `{ name, color }`
 * (panel anterior); el resto de tipos son cadenas.
 */
export type AttributeValue = string | { name: string; value?: string; color?: string };

export interface Attribute {
  id?: string;
  attribute_name: string;
  attribute_type: string;
  value: AttributeValue[];
}
