"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, X } from "lucide-react"

interface Product {
  id: string
  name: string
  image: string
  price: number
}

interface SelectedProduct extends Product {
  quantity: number
}

interface FormData {
  date: string
  phone: string
  firstName: string
  lastName: string
  department: string
  city: string
  address: string
  additionalReferences: string
  email: string
  orderNumber: string
  idNumber: string
  status: string
  paymentMethod: string
}

interface CreateSaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: FormData
  onFormDataChange: (data: FormData) => void
  departmentsAndCities: Record<string, string[]>
  availableCities: string[]
  onDepartmentChange: (department: string) => void
  selectedProducts: SelectedProduct[]
  onRemoveProduct: (id: string) => void
  onOpenProductModal: () => void
  onCreateSale: () => void
}

export function CreateSaleModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  departmentsAndCities,
  availableCities,
  onDepartmentChange,
  selectedProducts,
  onRemoveProduct,
  onOpenProductModal,
  onCreateSale,
}: CreateSaleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg">
          <DialogTitle className="text-2xl font-bold">Crear Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono móvil</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+51 912 345 678"
                  value={formData.phone}
                  onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  placeholder="Pérez García"
                  value={formData.lastName}
                  onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Número de cédula</Label>
                <Input
                  id="cedula"
                  placeholder="123456789"
                  value={formData.idNumber}
                  onChange={(e) => onFormDataChange({ ...formData, idNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select value={formData.department} onValueChange={onDepartmentChange}>
                  <SelectTrigger id="departamento">
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(departmentsAndCities).map((depto) => (
                      <SelectItem key={depto} value={depto}>
                        {depto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => onFormDataChange({ ...formData, city: value })}
                  disabled={!formData.department}
                >
                  <SelectTrigger id="ciudad">
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Calle 9 #1-39"
                  value={formData.address}
                  onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="referencias">Referencias adicionales</Label>
                <Textarea
                  id="referencias"
                  placeholder="Barrio, punto de referencia, etc."
                  value={formData.additionalReferences}
                  onChange={(e) => onFormDataChange({ ...formData, additionalReferences: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Detalles del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroOrden">Número de orden</Label>
                <Input
                  id="numeroOrden"
                  placeholder="ORD-2025-001"
                  value={formData.orderNumber}
                  onChange={(e) => onFormDataChange({ ...formData, orderNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => onFormDataChange({ ...formData, status: value })}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en-transito">En tránsito</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Productos</Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={onOpenProductModal}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Seleccionar productos
                  </Button>

                  {selectedProducts.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">Productos seleccionados:</p>
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Cantidad: {product.quantity} × ${product.price}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onRemoveProduct(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <p className="text-sm font-semibold">
                          Total: ${selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="metodoPago">Método de pago</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => onFormDataChange({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger id="metodoPago">
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta-credito">Tarjeta de crédito</SelectItem>
                    <SelectItem value="tarjeta-debito">Tarjeta de débito</SelectItem>
                    <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                    <SelectItem value="plin">Plin</SelectItem>
                    <SelectItem value="otro">Otro medio de pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onCreateSale} className="bg-primary hover:bg-primary/90">
              Crear Venta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
