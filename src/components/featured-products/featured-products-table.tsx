"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { FeaturedProduct } from "@/interfaces/featured-products";

interface FeaturedProductsTableProps {
  featuredProducts: FeaturedProduct[];
  onDelete: (featuredProduct: FeaturedProduct) => void;
  canManage: boolean;
  isLoading?: boolean;
}

export function FeaturedProductsTable({
  featuredProducts,
  onDelete,
  canManage,
  isLoading,
}: FeaturedProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold pl-3">Imagen</TableHead>
          <TableHead className="font-semibold">Título</TableHead>
          <TableHead className="font-semibold">Stock</TableHead>
          <TableHead className="font-semibold">Precio</TableHead>
          <TableHead className="font-semibold">Precio descuento</TableHead>
          <TableHead className="font-semibold">Descuento</TableHead>
          <TableHead className="font-semibold">Referencia</TableHead>
          <TableHead className="font-semibold">Imágenes</TableHead>
          <TableHead className="font-semibold text-right pr-4">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="text-center text-muted-foreground p-8"
            >
              Cargando productos destacados...
            </TableCell>
          </TableRow>
        ) : featuredProducts.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron productos destacados
            </TableCell>
          </TableRow>
        ) : (
          featuredProducts.map(({ id, product }) => (
            <TableRow key={id} className="hover:bg-muted/30">
              <TableCell className="pl-3">
                {product.image_product ? (
                  <img
                    src={product.image_product}
                    alt={product.title}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Sin img
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell>
                <Badge variant={product.stock ? "default" : "destructive"}>
                  {product.stock ? "Con stock" : "Sin stock"}
                </Badge>
              </TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>${product.discount_price || "-"}</TableCell>
              <TableCell>
                {product.discount ? `${product.discount}%` : "-"}
              </TableCell>
              <TableCell>{product.reference || "-"}</TableCell>
              <TableCell>{product.images?.length || 0}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete({ id, product })}
                    disabled={!canManage}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
