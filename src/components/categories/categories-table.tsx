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
import { Category } from "@/interfaces/categories";

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isLoading?: boolean;
}

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  isLoading,
}: CategoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold pl-3">
            Nombre de la Categoría
          </TableHead>
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
              Cargando categorías...
            </TableCell>
          </TableRow>
        ) : categories.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron categorías
            </TableCell>
          </TableRow>
        ) : (
          categories.map((category) => (
            <TableRow key={category.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                    className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(category)}
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
