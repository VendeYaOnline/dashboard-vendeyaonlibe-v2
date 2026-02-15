"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Check } from "lucide-react"

interface ColorValue {
  name: string
  color: string
}

interface CreateAttributeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAttribute: (attribute: {
    attribute_name: string
    attribute_type: string
    value: ColorValue[] | string[]
  }) => void
}

const attributeTypes = ["Color", "Talla", "Peso", "Dimension", "Mililitro", "Genero"]

const genderOptions = ["Masculino", "Femenino", "Hombre", "Mujer", "Niño", "Niña"]

const presetColors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#78716c",
  "#1f2937",
  "#000000",
]

export function CreateAttributeModal({ open, onOpenChange, onCreateAttribute }: CreateAttributeModalProps) {
  const [attributeName, setAttributeName] = useState("")
  const [attributeType, setAttributeType] = useState("")
  const [colorValues, setColorValues] = useState<ColorValue[]>([])
  const [currentColorName, setCurrentColorName] = useState("")
  const [currentColor, setCurrentColor] = useState("")
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [textValues, setTextValues] = useState<string[]>([])
  const [currentTextValue, setCurrentTextValue] = useState("")

  useEffect(() => {
    if (!open) {
      setAttributeName("")
      setAttributeType("")
      setColorValues([])
      setCurrentColorName("")
      setCurrentColor("")
      setSelectedGenders([])
      setTextValues([])
      setCurrentTextValue("")
    }
  }, [open])

  useEffect(() => {
    setColorValues([])
    setCurrentColorName("")
    setCurrentColor("")
    setSelectedGenders([])
    setTextValues([])
    setCurrentTextValue("")
  }, [attributeType])

  const handleAddColor = () => {
    if (!currentColorName.trim() || !currentColor) return

    const nameExists = colorValues.some((c) => c.name.toLowerCase() === currentColorName.toLowerCase())
    const colorExists = colorValues.some((c) => c.color === currentColor)

    if (nameExists || colorExists) {
      return
    }

    if (colorValues.length >= 10) return

    setColorValues([...colorValues, { name: currentColorName, color: currentColor }])
    setCurrentColorName("")
    setCurrentColor("")
  }

  const handleRemoveColor = (index: number) => {
    setColorValues(colorValues.filter((_, i) => i !== index))
  }

  const handleToggleGender = (gender: string) => {
    if (selectedGenders.includes(gender)) {
      setSelectedGenders(selectedGenders.filter((g) => g !== gender))
    } else {
      setSelectedGenders([...selectedGenders, gender])
    }
  }

  const handleAddTextValue = () => {
    if (!currentTextValue.trim()) return
    if (textValues.includes(currentTextValue.trim())) return
    if (textValues.length >= 10) return

    setTextValues([...textValues, currentTextValue.trim()])
    setCurrentTextValue("")
  }

  const handleRemoveTextValue = (index: number) => {
    setTextValues(textValues.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!attributeName.trim() || !attributeType) return

    let value: ColorValue[] | string[] = []

    if (attributeType === "Color") {
      if (colorValues.length === 0) return
      value = colorValues
    } else if (attributeType === "Genero") {
      if (selectedGenders.length === 0) return
      value = selectedGenders
    } else {
      if (textValues.length === 0) return
      value = textValues
    }

    onCreateAttribute({
      attribute_name: attributeName,
      attribute_type: attributeType,
      value,
    })

    onOpenChange(false)
  }

  const isColorNameDuplicate = colorValues.some((c) => c.name.toLowerCase() === currentColorName.toLowerCase())
  const isColorDuplicate = currentColor ? colorValues.some((c) => c.color === currentColor) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Crear Nuevo Atributo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="attributeName">Nombre del atributo</Label>
            <Input
              id="attributeName"
              placeholder="Ej: Colores pasteles, Tallas ropa..."
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de atributo</Label>
            <Select value={attributeType} onValueChange={setAttributeType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {attributeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {attributeType === "Color" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Colores ({colorValues.length}/10)</Label>
                {colorValues.length >= 10 && <span className="text-xs text-amber-600">Máximo alcanzado</span>}
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm">Nombre del color</Label>
                  <Input
                    placeholder="Ej: Rojo, Azul marino..."
                    value={currentColorName}
                    onChange={(e) => setCurrentColorName(e.target.value)}
                    className={isColorNameDuplicate ? "border-destructive" : ""}
                  />
                  {isColorNameDuplicate && <p className="text-xs text-destructive">Este nombre ya existe</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Seleccionar color</Label>
                  <div className="grid grid-cols-10 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCurrentColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          currentColor === color
                            ? "border-primary scale-110 shadow-md"
                            : "border-transparent hover:scale-105"
                        } ${isColorDuplicate && currentColor === color ? "ring-2 ring-destructive" : ""}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={currentColor || "#000000"}
                      onChange={(e) => setCurrentColor(e.target.value)}
                      className="w-12 h-8 p-0 border-0 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">{currentColor || "Ningún color seleccionado"}</span>
                  </div>
                  {isColorDuplicate && <p className="text-xs text-destructive">Este color ya existe</p>}
                </div>

                <Button
                  type="button"
                  onClick={handleAddColor}
                  disabled={
                    !currentColorName.trim() ||
                    !currentColor ||
                    isColorNameDuplicate ||
                    isColorDuplicate ||
                    colorValues.length >= 10
                  }
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Color
                </Button>
              </div>

              {colorValues.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Colores agregados</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorValues.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full"
                      >
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {attributeType === "Genero" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Seleccionar opciones de género ({selectedGenders.length}/10)</Label>
                {selectedGenders.length >= 10 && <span className="text-xs text-amber-600">Máximo alcanzado</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {genderOptions.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleToggleGender(gender)}
                    disabled={selectedGenders.length >= 10 && !selectedGenders.includes(gender)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                      selectedGenders.includes(gender)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="font-medium">{gender}</span>
                    {selectedGenders.includes(gender) && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {attributeType && attributeType !== "Color" && attributeType !== "Genero" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  Valores de {attributeType} ({textValues.length}/10)
                </Label>
                {textValues.length >= 10 && <span className="text-xs text-amber-600">Máximo alcanzado</span>}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={`Ej: ${
                    attributeType === "Talla"
                      ? "S, M, L, XL"
                      : attributeType === "Peso"
                        ? "500g, 1kg"
                        : attributeType === "Dimension"
                          ? "10x20cm"
                          : "500ml, 1L"
                  }`}
                  value={currentTextValue}
                  onChange={(e) => setCurrentTextValue(e.target.value)}
                  disabled={textValues.length >= 10}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTextValue()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTextValue} size="icon" disabled={textValues.length >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {textValues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {textValues.map((val, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                      <span className="text-sm font-medium">{val}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTextValue(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Crear Atributo</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
