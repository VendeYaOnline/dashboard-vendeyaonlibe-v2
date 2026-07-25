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
import { Carousel } from "@/interfaces/carousel";

interface CarouselTableProps {
  carousels: Carousel[];
  onEdit: (carousel: Carousel) => void;
  onDelete: (carousel: Carousel) => void;
  canManage: boolean;
  isLoading?: boolean;
}

export function CarouselTable({
  carousels,
  onEdit,
  onDelete,
  canManage,
  isLoading,
}: CarouselTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold pl-3">
            Nombre del carrusel
          </TableHead>
          <TableHead className="font-semibold">Productos</TableHead>
          <TableHead className="font-semibold text-right pr-4">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground p-8"
            >
              Cargando carruseles...
            </TableCell>
          </TableRow>
        ) : carousels.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron carruseles
            </TableCell>
          </TableRow>
        ) : (
          carousels.map((carousel) => (
            <TableRow key={carousel.id} className="hover:bg-muted/30">
              <TableCell className="font-medium pl-3">
                {carousel.name}
              </TableCell>
              <TableCell>
                {carousel.products.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Sin productos
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {carousel.products.map((product) => (
                      <img
                        key={product.id}
                        src={product.image_product}
                        alt={product.title}
                        title={product.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({carousel.products.length})
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(carousel)}
                    disabled={!canManage}
                    className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(carousel)}
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
