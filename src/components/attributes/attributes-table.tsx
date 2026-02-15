"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"

export interface AttributeValue {
  name: string
  color?: string
}

export interface Attribute {
  id: string
  attributeName: string
  attributeType: string
  value: AttributeValue[] | string[]
}

interface AttributesTableProps {
  attributes: Attribute[]
  onViewDetails: (attribute: Attribute) => void
  onDelete: (attribute: Attribute) => void
}

export function AttributesTable({ attributes, onViewDetails, onDelete }: AttributesTableProps) {
  const renderValues = (attribute: Attribute) => {
    if (attribute.attributeType === "Color") {
      const colorValues = attribute.value as AttributeValue[]
      return (
        <div className="flex flex-wrap gap-1.5">
          {colorValues.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: item.color }}
              title={item.name}
            />
          ))}
          {colorValues.length > 5 && (
            <span className="text-xs text-muted-foreground self-center ml-1">+{colorValues.length - 5} más</span>
          )}
        </div>
      )
    }

    const stringValues = attribute.value as string[]
    return (
      <div className="flex flex-wrap gap-1.5">
        {stringValues.slice(0, 4).map((val, index) => (
          <span key={index} className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium">
            {val}
          </span>
        ))}
        {stringValues.length > 4 && (
          <span className="text-xs text-muted-foreground self-center">+{stringValues.length - 4} más</span>
        )}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold">Nombre del atributo</TableHead>
          <TableHead className="font-semibold">Tipo</TableHead>
          <TableHead className="font-semibold">Valores</TableHead>
          <TableHead className="font-semibold text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attributes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
              No se encontraron atributos
            </TableCell>
          </TableRow>
        ) : (
          attributes.map((attribute) => (
            <TableRow key={attribute.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{attribute.attributeName}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                  {attribute.attributeType}
                </span>
              </TableCell>
              <TableCell>{renderValues(attribute)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(attribute)}
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4" />
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
  )
}
