"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ShoppingBag } from "lucide-react"
import { useState } from "react"
import { PurchasedProductsModal } from "./purchased-products-modal"

export interface Sale {
  id: string | number
  date: string
  city: string
  phone: string
  status: string
  orderNumber: string
  paymentMethod: string
  firstName: string
  lastName: string
  email: string
  idNumber: string
  department: string
  address: string
  additionalReferences: string
  productsCount: number // renamed from products to avoid conflict
  quantity: number | string
  totalPaid: string
  productsList?: any[] // New field for detailed products
}

interface SaleDetailsModalProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function SaleDetailsModal({ sale, open, onOpenChange }: SaleDetailsModalProps) {
  const [showProducts, setShowProducts] = useState(false)

  if (!sale) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg">
            <DialogTitle className="text-2xl font-bold">Detalles de la venta</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información del cliente</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de compra</p>
                    <p className="font-medium">{sale.date}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Nombres</p>
                    <p className="font-medium">{sale.firstName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Apellidos</p>
                    <p className="font-medium">{sale.lastName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm break-all">{sale.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Número de cédula</p>
                    <p className="font-medium">{sale.idNumber}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Ubicación</h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento</p>
                      <p className="font-medium">{sale.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ciudad</p>
                      <p className="font-medium">{sale.city}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{sale.address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Referencias adicionales</p>
                    <p className="font-medium">{sale.additionalReferences}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono móvil</p>
                    <p className="font-medium">{sale.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg border-b pb-2">Detalles del pedido</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Número de orden</p>
                    <p className="font-medium font-mono">{sale.orderNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Productos</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{sale.productsCount} items</p>
                      </div>
                      {sale.productsList && sale.productsList.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 bg-transparent"
                          onClick={() => setShowProducts(true)}
                        >
                          <Eye className="h-3 w-3" />
                          Ver productos
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <div className="mt-1">{getStatusBadge(sale.status)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Método de pago</p>
                    <p className="font-medium">{sale.paymentMethod}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Cantidad Total</p>
                    <p className="font-medium">{sale.quantity}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total pagado</p>
                    <p className="font-medium">{sale.totalPaid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {sale.productsList && (
        <PurchasedProductsModal
          open={showProducts}
          onOpenChange={setShowProducts}
          products={sale.productsList}
          orderNumber={sale.orderNumber}
        />
      )}
    </>
  )
}
