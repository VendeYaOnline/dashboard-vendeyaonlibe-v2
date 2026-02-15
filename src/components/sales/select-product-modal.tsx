"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Product {
  id: string
  name: string
  image: string
  price: number
}

interface SelectProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  searchProduct: string
  onSearchChange: (search: string) => void
  currentPage: number
  onPageChange: (page: number) => void
  selectedProduct: Product | null
  onProductClick: (product: Product) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAdd: () => void
}

const PRODUCTS_PER_PAGE = 4

export function SelectProductModal({
  open,
  onOpenChange,
  products,
  searchProduct,
  onSearchChange,
  currentPage,
  onPageChange,
  selectedProduct,
  onProductClick,
  quantity,
  onQuantityChange,
  onAdd,
}: SelectProductModalProps) {
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg">
          <DialogTitle className="text-2xl font-bold">Seleccionar Producto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="searchProducto">Buscar producto</Label>
            <Input
              id="searchProducto"
              placeholder="Buscar por nombre..."
              value={searchProduct}
              onChange={(e) => {
                onSearchChange(e.target.value)
                onPageChange(1)
              }}
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No se encontraron productos</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50 hover:bg-muted/30"
                    }`}
                    onClick={() => onProductClick(product)}
                  >
                    <div className="flex gap-3">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-20 h-20 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-lg font-bold text-primary mt-1">${product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de{" "}
                    {filteredProducts.length} productos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="text-sm font-medium">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedProduct && (
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => onQuantityChange(Number.parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={onAdd} className="bg-primary hover:bg-primary/90">
                  Agregar Producto
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
