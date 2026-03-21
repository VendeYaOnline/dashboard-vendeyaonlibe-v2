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
import { Trash2, Edit2 } from "lucide-react";
import { Products } from "@/interfaces/products";
import Image from "next/image";

interface ProductsTableProps {
  products: Products[];
  onEdit: (product: Products) => void;
  onDelete: (product: Products) => void;
  isLoading?: boolean;
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  isLoading,
}: ProductsTableProps) {
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
          <TableHead className="font-semibold">Imágenes</TableHead>
          <TableHead className="font-semibold text-right pr-4">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground p-8"
            >
              Cargando productos...
            </TableCell>
          </TableRow>
        ) : products.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron productos
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/30">
              <TableCell className="pl-3">
                {product.image_product ? (
                  <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                    <img
                      src={product.image_product}
                      alt={product.title}
                      className="object-cover h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Sin img
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell>{product.quantity}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>${product.discount_price || "-"}</TableCell>
              <TableCell>{product.discount ? `${product.discount}%` : "-"}</TableCell>
              <TableCell>{product.images?.length || 0}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(product)}
                    className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(product)}
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
