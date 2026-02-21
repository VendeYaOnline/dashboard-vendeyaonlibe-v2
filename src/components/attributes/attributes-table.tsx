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
import { Eye, Trash2, Edit2 } from "lucide-react";
import { Attribute } from "@/interfaces/attributes";

interface ColorValue {
  name: string;
  value: string;
}

interface AttributesTableProps {
  attributes: Attribute[];
  onViewDetails: (attribute: Attribute) => void;
  onEdit: (attribute: Attribute) => void;
  onDelete: (attribute: Attribute) => void;
  isLoading?: boolean;
}

export function AttributesTable({
  attributes,
  onViewDetails,
  onEdit,
  onDelete,
  isLoading,
}: AttributesTableProps) {
  const renderValues = (attribute: Attribute) => {
    if (attribute.attribute_type === "Color") {
      const colorValues = attribute.value as ColorValue[];
      return (
        <div className="flex flex-wrap gap-1.5">
          {colorValues.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: item.value }}
              title={item.name}
            />
          ))}
          {colorValues.length > 5 && (
            <span className="text-xs text-muted-foreground self-center ml-1">
              +{colorValues.length - 5} más
            </span>
          )}
        </div>
      );
    }

    const stringValues = attribute.value as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {stringValues.slice(0, 4).map((val, index) => (
          <span
            key={index}
            className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium"
          >
            {val}
          </span>
        ))}
        {stringValues.length > 4 && (
          <span className="text-xs text-muted-foreground self-center">
            +{stringValues.length - 4} más
          </span>
        )}
      </div>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold pl-3">
            Nombre del atributo
          </TableHead>
          <TableHead className="font-semibold">Tipo</TableHead>
          <TableHead className="font-semibold">Valores</TableHead>
          <TableHead className="font-semibold text-right pr-4">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground p-8"
            >
              Cargando atributos...
            </TableCell>
          </TableRow>
        ) : attributes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron atributos
            </TableCell>
          </TableRow>
        ) : (
          attributes.map((attribute) => (
            <TableRow key={attribute.id} className="hover:bg-muted/30">
              <TableCell className="font-medium pl-3">
                {attribute.attribute_name}
              </TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                  {attribute.attribute_type}
                </span>
              </TableCell>
              <TableCell>{renderValues(attribute)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(attribute)}
                    className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(attribute)}
                    className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(attribute)}
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
