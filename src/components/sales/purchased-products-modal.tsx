import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

interface ProductDetail {
  id: number
  image_product: string
  title: string
  price: string
  reference: string
}

interface SaleProduct {
  quantity: number
  product: ProductDetail
  purchase_total?: string
  total?: string
}

interface PurchasedProductsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: SaleProduct[]
  orderNumber: string
}

export function PurchasedProductsModal({ open, onOpenChange, products, orderNumber }: PurchasedProductsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg">
          <DialogTitle className="text-xl font-bold">Productos de la orden {orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((item, index) => (
            <Card key={index} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={item.product.image_product || "/placeholder.svg"}
                    alt={item.product.title}
                    className="w-20 h-20 rounded-md object-cover border bg-muted"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-semibold text-sm line-clamp-2 leading-tight" title={item.product.title}>
                    {item.product.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">Ref: {item.product.reference}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">Cant: {item.quantity}</div>
                    <p className="font-bold text-primary">
                      {item.purchase_total
                        ? `$ ${Number(item.purchase_total).toLocaleString("es-CO")}`
                        : item.total || item.product.price}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Productos</p>
            <p className="text-xl font-bold">{products.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
