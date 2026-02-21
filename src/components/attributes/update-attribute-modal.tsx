"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Attribute } from "@/interfaces/attributes";
import { Plus, X, Check } from "lucide-react";

interface ColorValue {
  name: string;
  value: string;
}

interface UpdateAttributeModalProps {
  attribute: Attribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAttribute: (attribute: Attribute) => void;
  isLoading: boolean;
}

const attributeTypes = [
  "Color",
  "Talla",
  "Peso",
  "Dimension",
  "Mililitro",
  "Genero",
];
const genderOptions = [
  "Masculino",
  "Femenino",
  "Hombre",
  "Mujer",
  "Niño",
  "Niña",
];
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
];

export function UpdateAttributeModal({
  attribute,
  open,
  onOpenChange,
  onUpdateAttribute,
  isLoading,
}: UpdateAttributeModalProps) {
  const [attributeName, setAttributeName] = useState("");
  const [attributeType, setAttributeType] = useState("");
  const [colorValues, setColorValues] = useState<ColorValue[]>([]);
  const [currentColorName, setCurrentColorName] = useState("");
  const [currentColor, setCurrentColor] = useState("");
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [textValues, setTextValues] = useState<string[]>([]);
  const [currentTextValue, setCurrentTextValue] = useState("");

  useEffect(() => {
    if (open && attribute) {
      setAttributeName(attribute.attribute_name);
      setAttributeType(attribute.attribute_type);

      if (attribute.attribute_type === "Color") {
        setColorValues(attribute.value as ColorValue[]);
        setSelectedGenders([]);
        setTextValues([]);
      } else if (attribute.attribute_type === "Genero") {
        setSelectedGenders(attribute.value as string[]);
        setColorValues([]);
        setTextValues([]);
      } else {
        setTextValues(attribute.value as string[]);
        setColorValues([]);
        setSelectedGenders([]);
      }
    }
  }, [open, attribute]);

  const handleAddColor = () => {
    if (!currentColorName.trim() || !currentColor) return;
    if (
      colorValues.some(
        (c) =>
          c.name.toLowerCase() === currentColorName.toLowerCase() ||
          c.value === currentColor,
      )
    )
      return;
    if (colorValues.length >= 10) return;

    setColorValues([
      ...colorValues,
      { name: currentColorName, value: currentColor },
    ]);
    setCurrentColorName("");
    setCurrentColor("");
  };

  const handleRemoveColor = (index: number) =>
    setColorValues(colorValues.filter((_, i) => i !== index));

  const handleToggleGender = (gender: string) => {
    if (selectedGenders.includes(gender)) {
      setSelectedGenders(selectedGenders.filter((g) => g !== gender));
    } else if (selectedGenders.length < 10) {
      setSelectedGenders([...selectedGenders, gender]);
    }
  };

  const handleAddTextValue = () => {
    if (
      !currentTextValue.trim() ||
      textValues.includes(currentTextValue.trim()) ||
      textValues.length >= 10
    )
      return;
    setTextValues([...textValues, currentTextValue.trim()]);
    setCurrentTextValue("");
  };

  const handleRemoveTextValue = (index: number) =>
    setTextValues(textValues.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!attributeName.trim() || !attributeType || !attribute) return;

    let value: ColorValue[] | string[] = [];
    if (attributeType === "Color") value = colorValues;
    else if (attributeType === "Genero") value = selectedGenders;
    else value = textValues;

    onUpdateAttribute({
      ...attribute,
      attribute_name: attributeName,
      attribute_type: attributeType,
      value,
    });
  };

  const isColorNameDuplicate = colorValues.some(
    (c) => c.name.toLowerCase() === currentColorName.toLowerCase(),
  );
  const isColorDuplicate = currentColor
    ? colorValues.some((c) => c.value === currentColor)
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl font-bold">
            Actualizar Atributo: {attribute?.attribute_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-attributeName">Nombre del atributo</Label>
            <Input
              id="edit-attributeName"
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
              </div>
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Input
                  placeholder="Nombre del color"
                  value={currentColorName}
                  onChange={(e) => setCurrentColorName(e.target.value)}
                />
                <div className="grid grid-cols-10 gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCurrentColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${currentColor === color ? "border-primary scale-110 shadow-md" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={currentColor || "#000000"}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-12 h-8 p-0 border-0 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentColor || "Ninguno"}
                  </span>
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
                  Agregar Color
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {colorValues.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full"
                  >
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: item.value }}
                    />
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

          {attributeType === "Genero" && (
            <div className="space-y-3">
              <Label>Géneros ({selectedGenders.length}/10)</Label>
              <div className="grid grid-cols-2 gap-2">
                {genderOptions.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleToggleGender(gender)}
                    className={`flex items-center justify-between px-4 py-2 rounded-lg border ${selectedGenders.includes(gender) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}
                  >
                    <span>{gender}</span>
                    {selectedGenders.includes(gender) && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {attributeType &&
            attributeType !== "Color" &&
            attributeType !== "Genero" && (
              <div className="space-y-4">
                <Label>Valores ({textValues.length}/10)</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentTextValue}
                    onChange={(e) => setCurrentTextValue(e.target.value)}
                    placeholder="Nuevo valor"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTextValue()}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTextValue}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {textValues.map((val, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
                    >
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
              </div>
            )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/80"
            disabled={isLoading}
          >
            {isLoading ? "Actualizando..." : "Actualizar Atributo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
