"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { AttributesTable, type Attribute, type AttributeValue } from "./attributes/attributes-table"
import { CreateAttributeModal } from "./attributes/create-attribute-modal"
import { AttributeDetailsModal } from "./attributes/attribute-details-modal"
import { DeleteAttributeModal } from "./attributes/delete-attribute-modal"

const initialAttributes: Attribute[] = [
  {
    id: "1",
    attributeName: "Colores pasteles",
    attributeType: "Color",
    value: [
      { name: "Rojo", color: "#ea669b" },
      { name: "Azul", color: "#5f78dd" },
      { name: "Amarillo", color: "#e1e193" },
      { name: "Verde", color: "#7dd3a8" },
    ],
  },
  {
    id: "2",
    attributeName: "Tallas ropa adulto",
    attributeType: "Talla",
    value: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    id: "3",
    attributeName: "Pesos productos",
    attributeType: "Peso",
    value: ["250g", "500g", "1kg", "2kg", "5kg"],
  },
  {
    id: "4",
    attributeName: "Géneros disponibles",
    attributeType: "Genero",
    value: ["Masculino", "Femenino", "Niño", "Niña"],
  },
  {
    id: "5",
    attributeName: "Dimensiones cajas",
    attributeType: "Dimension",
    value: ["10x10x10cm", "20x20x15cm", "30x30x20cm"],
  },
  {
    id: "6",
    attributeName: "Capacidades bebidas",
    attributeType: "Mililitro",
    value: ["250ml", "500ml", "750ml", "1L", "2L"],
  },
]

const ITEMS_PER_PAGE = 5

export function Atributos() {
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null)

  const filteredAttributes = attributes.filter((attr) =>
    attr.attributeName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredAttributes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedAttributes = filteredAttributes.slice(startIndex, endIndex)

  const handleViewDetails = (attribute: Attribute) => {
    setSelectedAttribute(attribute)
    setIsDetailsModalOpen(true)
  }

  const handleDeleteClick = (attribute: Attribute) => {
    setAttributeToDelete(attribute)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (attributeToDelete) {
      setAttributes(attributes.filter((a) => a.id !== attributeToDelete.id))
      setIsDeleteModalOpen(false)
      setAttributeToDelete(null)
    }
  }

  const handleCreateAttribute = (newAttribute: {
    attribute_name: string
    attribute_type: string
    value: { name: string; color: string }[] | string[]
  }) => {
    console.log("[v0] Attribute created:", newAttribute)

    const attribute: Attribute = {
      id: String(Date.now()),
      attributeName: newAttribute.attribute_name,
      attributeType: newAttribute.attribute_type,
      value: newAttribute.value as AttributeValue[] | string[],
    }

    setAttributes([attribute, ...attributes])
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Atributos</h1>
              <p className="text-muted-foreground mt-1">Gestiona los atributos de tus productos</p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear Atributo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buscar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de atributo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto bg-white rounded-md border">
          <AttributesTable
            attributes={paginatedAttributes}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteClick}
          />

          {filteredAttributes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAttributes.length)} de{" "}
                {filteredAttributes.length} atributos
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
                  Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <CreateAttributeModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateAttribute={handleCreateAttribute}
        />

        <AttributeDetailsModal
          attribute={selectedAttribute}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />

        <DeleteAttributeModal
          attributeName={attributeToDelete?.attributeName || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  )
}
