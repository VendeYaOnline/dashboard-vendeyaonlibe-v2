"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { SalesTable } from "./sales/sales-table"
import { SaleDetailsModal, type Sale } from "./sales/sale-details-modal"
import { DeleteSaleModal } from "./sales/delete-sale-modal"
import { CreateSaleModal } from "./sales/create-sale-modal"
import { SelectProductModal } from "./sales/select-product-modal"

interface Product {
  id: string
  name: string
  image: string
  price: number
}

interface SelectedProduct extends Product {
  quantity: number
}

const salesData: Sale[] = [
  {
    id: "40",
    date: "29/07/2025",
    city: "VILLANUEVA",
    phone: "3103435659",
    status: "En tránsito",
    orderNumber: "0BKUSMSI4U",
    paymentMethod: "Otro medio de pago",
    firstName: "JOSHUA ESTEBAN",
    lastName: "PARRADO LOZADA",
    email: "joshuaestebanparradolozada@yahoo.es",
    idNumber: "1116857877",
    department: "CASANARE",
    address: "CALLE 9 #11-39",
    additionalReferences: "BARRIO FUNDADORES",
    productsCount: 2,
    quantity: "2",
    totalPaid: "No especificado",
    productsList: [
      {
        quantity: 1,
        product: {
          id: 14,
          image_product:
            "https://muebles-electrodomesticos-del-meta-tvy0g5xm53zbkhw.s3.us-east-2.amazonaws.com/7705191041315-001-750Wx750H.webp",
          title: "NEVERA CHALLENGER CR 239",
          price: "$ 1.327.000",
          reference: "CR239 Titanium",
        },
        purchase_total: "1327000",
      },
      {
        quantity: 1,
        product: {
          id: 4,
          image_product:
            "https://muebles-electrodomesticos-del-meta-tvy0g5xm53zbkhw.s3.us-east-2.amazonaws.com/7705946478663-001-750Wx750H.webp",
          title: "TV KALLEY ROKU 32 PULGADAS",
          price: "$ 645.000",
          reference: "K-RTV32HD",
        },
        purchase_total: "645000",
      },
    ],
  },
  {
    id: "2",
    date: "14/01/2025",
    city: "Arequipa",
    phone: "+51 912 345 678",
    status: "pendiente",
    orderNumber: "ORD-2025-002",
    paymentMethod: "Transferencia",
    firstName: "María",
    lastName: "González",
    email: "maria@example.com",
    idNumber: "12345678",
    department: "Arequipa",
    address: "Av. Principal 123",
    additionalReferences: "Cerca del parque",
    productsCount: 2,
    quantity: 5,
    totalPaid: "$150.00",
  },
  {
    id: "3",
    date: "14/01/2025",
    city: "Cusco",
    phone: "+51 923 456 789",
    status: "completada",
    orderNumber: "ORD-2025-003",
    paymentMethod: "Efectivo",
    firstName: "Pedro",
    lastName: "Ramírez",
    email: "pedro@example.com",
    idNumber: "87654321",
    department: "Cusco",
    address: "Calle Sol 456",
    additionalReferences: "Edificio azul",
    productsCount: 3,
    quantity: 3,
    totalPaid: "$200.00",
  },
  {
    id: "4",
    date: "13/01/2025",
    city: "Trujillo",
    phone: "+51 934 567 890",
    status: "cancelada",
    orderNumber: "ORD-2025-004",
    paymentMethod: "Tarjeta de débito",
    firstName: "Ana",
    lastName: "Torres",
    email: "ana@example.com",
    idNumber: "11223344",
    department: "La Libertad",
    address: "Jr. Independencia 789",
    additionalReferences: "Frente al mercado",
    productsCount: 1,
    quantity: 1,
    totalPaid: "$50.00",
  },
  {
    id: "5",
    date: "13/01/2025",
    city: "Lima",
    phone: "+51 945 678 901",
    status: "pendiente",
    orderNumber: "ORD-2025-005",
    paymentMethod: "Yape",
    firstName: "Carlos",
    lastName: "Mendoza",
    email: "carlos@example.com",
    idNumber: "55667788",
    department: "Lima",
    address: "Av. Arequipa 321",
    additionalReferences: "Torre B",
    productsCount: 4,
    quantity: 8,
    totalPaid: "$300.00",
  },
  {
    id: "6",
    date: "12/01/2025",
    city: "Chiclayo",
    phone: "+51 956 789 012",
    status: "completada",
    orderNumber: "ORD-2025-006",
    paymentMethod: "Plin",
    firstName: "Laura",
    lastName: "Flores",
    email: "laura@example.com",
    idNumber: "99887766",
    department: "Lambayeque",
    address: "Calle Comercio 654",
    additionalReferences: "Casa verde",
    productsCount: 2,
    quantity: 4,
    totalPaid: "$180.00",
  },
]

const availableProducts: Product[] = [
  {
    id: "1",
    name: "Producto Premium A",
    image: "/product-a.jpg",
    price: 45.99,
  },
  {
    id: "2",
    name: "Producto Estándar B",
    image: "/product-b.jpg",
    price: 29.99,
  },
  {
    id: "3",
    name: "Producto Deluxe C",
    image: "/product-c.jpg",
    price: 69.99,
  },
  {
    id: "4",
    name: "Producto Basic D",
    image: "/product-d.jpg",
    price: 19.99,
  },
]

const departmentsAndCities: Record<string, string[]> = {
  Lima: ["Lima", "Callao", "San Isidro", "Miraflores", "Surco"],
  Arequipa: ["Arequipa", "Cayma", "Cerro Colorado", "Yanahuara"],
  Cusco: ["Cusco", "Wanchaq", "Santiago", "San Sebastián"],
  "La Libertad": ["Trujillo", "Huanchaco", "Laredo", "Moche"],
  Lambayeque: ["Chiclayo", "Lambayeque", "Ferreñafe", "Monsefú"],
  CASANARE: ["VILLANUEVA", "Yopal", "Aguazul", "Tauramena"],
}

const ITEMS_PER_PAGE = 5

export function SalesReceived() {
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [searchProduct, setSearchProduct] = useState("")
  const [currentProductPage, setCurrentProductPage] = useState(1)

  const [formData, setFormData] = useState({
    date: "",
    phone: "",
    firstName: "",
    lastName: "",
    department: "",
    city: "",
    address: "",
    additionalReferences: "",
    email: "",
    orderNumber: "",
    idNumber: "",
    status: "",
    paymentMethod: "",
  })

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [temporaryProduct, setTemporaryProduct] = useState<{ product: Product | null; quantity: number }>({
    product: null,
    quantity: 1,
  })

  const filteredSales = salesData.filter((sale) => {
    const statusMatch = statusFilter === "todos" || sale.status === statusFilter
    const dateMatch = !dateFilter || sale.date === dateFilter
    return statusMatch && dateMatch
  })

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedSales = filteredSales.slice(startIndex, endIndex)

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    console.log("[v0] Eliminando venta:", saleToDelete?.id)
    setIsDeleteModalOpen(false)
    setSaleToDelete(null)
  }

  const handleDepartmentChange = (department: string) => {
    setFormData({ ...formData, department, city: "" })
    setAvailableCities(departmentsAndCities[department] || [])
  }

  const handleAddProduct = () => {
    if (temporaryProduct.product && temporaryProduct.quantity > 0) {
      const existingProduct = selectedProducts.find((p) => p.id === temporaryProduct.product!.id)

      if (existingProduct) {
        setSelectedProducts(
          selectedProducts.map((p) =>
            p.id === temporaryProduct.product!.id ? { ...p, quantity: p.quantity + temporaryProduct.quantity } : p,
          ),
        )
      } else {
        setSelectedProducts([...selectedProducts, { ...temporaryProduct.product, quantity: temporaryProduct.quantity }])
      }

      setIsProductModalOpen(false)
      setTemporaryProduct({ product: null, quantity: 1 })
      setSearchProduct("")
      setCurrentProductPage(1)
    }
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id))
  }

  const handleCreateSale = () => {
    console.log("[v0] Creando venta:", { formData, selectedProducts })
    setIsCreateModalOpen(false)
    setFormData({
      date: "",
      phone: "",
      firstName: "",
      lastName: "",
      department: "",
      city: "",
      address: "",
      additionalReferences: "",
      email: "",
      orderNumber: "",
      idNumber: "",
      status: "",
      paymentMethod: "",
    })
    setSelectedProducts([])
  }

  const handleOpenProductModal = () => {
    setIsProductModalOpen(true)
    setSearchProduct("")
    setCurrentProductPage(1)
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Ventas Recibidas</h1>
            <p className="text-muted-foreground mt-1">Gestiona y monitorea todas tus ventas</p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear Venta
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="en-transito">En tránsito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fecha</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("todos")
                  setDateFilter("")
                  setCurrentPage(1)
                }}
                className="w-full sm:col-span-2 lg:col-span-1 lg:self-end"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto bg-white rounded-md border">
          <SalesTable sales={paginatedSales} onViewDetails={handleViewDetails} onDelete={handleDeleteClick} />

          {filteredSales.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSales.length)} de {filteredSales.length} ventas
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <div className="text-sm font-medium">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <SaleDetailsModal sale={selectedSale} open={isModalOpen} onOpenChange={setIsModalOpen} />

        <DeleteSaleModal
          orderNumber={saleToDelete?.orderNumber || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
        />

        <CreateSaleModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          formData={formData}
          onFormDataChange={setFormData}
          departmentsAndCities={departmentsAndCities}
          availableCities={availableCities}
          onDepartmentChange={handleDepartmentChange}
          selectedProducts={selectedProducts}
          onRemoveProduct={handleRemoveProduct}
          onOpenProductModal={handleOpenProductModal}
          onCreateSale={handleCreateSale}
        />

        <SelectProductModal
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
          products={availableProducts}
          searchProduct={searchProduct}
          onSearchChange={setSearchProduct}
          currentPage={currentProductPage}
          onPageChange={setCurrentProductPage}
          selectedProduct={temporaryProduct.product}
          onProductClick={(product) => setTemporaryProduct({ ...temporaryProduct, product })}
          quantity={temporaryProduct.quantity}
          onQuantityChange={(quantity) => setTemporaryProduct({ ...temporaryProduct, quantity })}
          onAdd={handleAddProduct}
        />
      </div>
    </div>
  )
}
