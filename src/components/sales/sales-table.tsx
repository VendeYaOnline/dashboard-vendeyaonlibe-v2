"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2 } from "lucide-react"
import type { Sale } from "./sale-details-modal" // Import shared interface

interface SalesTableProps {
  sales: Sale[]
  onViewDetails: (sale: Sale) => void
  onDelete: (sale: Sale) => void
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completada":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Completada</Badge>
    case "pendiente":
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pendiente</Badge>
    case "cancelada":
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Cancelada</Badge>
    case "en-transito":
    case "En tránsito":
      return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">En tránsito</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export function SalesTable({ sales, onViewDetails, onDelete }: SalesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold whitespace-nowrap">Fecha</TableHead>
          <TableHead className="font-semibold whitespace-nowrap">Ciudad</TableHead>
          <TableHead className="font-semibold whitespace-nowrap">Teléfono</TableHead>
          <TableHead className="font-semibold whitespace-nowrap">Estado</TableHead>
          <TableHead className="font-semibold whitespace-nowrap">Número de Orden</TableHead>
          <TableHead className="font-semibold whitespace-nowrap">Método de Pago</TableHead>
          <TableHead className="font-semibold text-center whitespace-nowrap">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No se encontraron ventas con los filtros seleccionados
            </TableCell>
          </TableRow>
        ) : (
          sales.map((sale) => (
            <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium whitespace-nowrap">
                {sale.date} {/* Removed toLocaleDateString as date comes formatted in new data */}
              </TableCell>
              <TableCell className="whitespace-nowrap">{sale.city}</TableCell>
              <TableCell className="font-mono text-sm whitespace-nowrap">{sale.phone}</TableCell>
              <TableCell>{getStatusBadge(sale.status)}</TableCell>
              <TableCell className="font-mono text-sm whitespace-nowrap">{sale.orderNumber}</TableCell>
              <TableCell className="whitespace-nowrap">{sale.paymentMethod}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => onViewDetails(sale)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(sale)}
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
