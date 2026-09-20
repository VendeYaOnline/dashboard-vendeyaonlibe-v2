"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  TextField,
  cn,
  useOverlayState,
} from "@heroui/react";
import { Plus, Settings2 } from "lucide-react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { Attribute } from "@/interfaces/attributes";
import {
  ATTRIBUTE_TYPES,
  GENDER_OPTIONS,
  MAX_ATTRIBUTE_NAME_LENGTH,
  maxValuesFor,
  MAX_ATTRIBUTE_VALUE_LENGTH,
  PRESET_COLORS,
  isColorValue,
  toColorValue,
  type ColorValue,
} from "../constants";
import { CharCounter } from "@/features/productos/components/form-section";
import { PendingButton } from "@/components/shared/pending-button";
import { SortableChips } from "@/components/shared/sortable-chips";

interface AtributoFormModalProps {
  /** null = crear, con valor = editar */
  attribute: Attribute | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: Omit<Attribute, "id">) => void;
  isPending: boolean;
}

export function AtributoFormModal({
  attribute,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: AtributoFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("Color");
  const [colors, setColors] = useState<ColorValue[]>([]);
  const [texts, setTexts] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);

  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("");
  const [textValue, setTextValue] = useState("");

  const resetValues = () => {
    setColors([]);
    setTexts([]);
    setGenders([]);
    setColorName("");
    setColorHex("");
    setTextValue("");
  };

  // Precarga al abrir; separa los valores según el tipo del atributo.
  useEffect(() => {
    if (!isOpen) return;

    setName(attribute?.attribute_name ?? "");
    setType(attribute?.attribute_type ?? "Color");
    resetValues();

    if (!attribute) return;
    const values = attribute.value ?? [];

    if (attribute.attribute_type === "Color") {
      // Los colores del panel anterior vienen como { name, color }: se normalizan.
      setColors(values.filter(isColorValue).map(toColorValue));
    } else if (attribute.attribute_type === "Genero") {
      setGenders(values.filter((v): v is string => typeof v === "string"));
    } else {
      setTexts(values.filter((v): v is string => typeof v === "string"));
    }
  }, [isOpen, attribute]);

  const handleTypeChange = (nextType: string) => {
    setType(nextType);
    resetValues();
  };

  const maxValues = maxValuesFor(type);
  const isFull =
    (type === "Color" ? colors.length : type === "Genero" ? genders.length : texts.length) >=
    maxValues;

  const colorNameTaken = colors.some(
    (c) => c.name.toLowerCase() === colorName.trim().toLowerCase(),
  );
  const colorHexTaken = colors.some((c) => c.value === colorHex);

  const handleAddColor = () => {
    if (!colorName.trim() || !colorHex || colorNameTaken || colorHexTaken || isFull) return;
    setColors((prev) => [...prev, { name: colorName.trim(), value: colorHex }]);
    setColorName("");
    setColorHex("");
  };

  const handleAddText = () => {
    const value = textValue.trim();
    if (!value || texts.includes(value) || isFull) return;
    setTexts((prev) => [...prev, value]);
    setTextValue("");
  };

  const toggleGender = (gender: string) => {
    setGenders((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : prev.length >= maxValues
          ? prev
          : [...prev, gender],
    );
  };

  const values = type === "Color" ? colors : type === "Genero" ? genders : texts;
  const isValid = name.trim() !== "" && values.length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({
      attribute_name: name.trim(),
      attribute_type: type,
      value: values,
    });
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <ModalFormHeader
                icon={Settings2}
                title={attribute ? "Editar atributo" : "Crear atributo"}
                description="Define valores reutilizables, como tallas o colores, que luego asignarás a tus productos."
              />

              <Modal.Body className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    value={name}
                    onChange={(value) => setName(value.slice(0, MAX_ATTRIBUTE_NAME_LENGTH))}
                    isRequired
                    autoFocus
                  >
                    <Label>Nombre del atributo</Label>
                    <Input
                      placeholder="Ej: Color principal, Talla..."
                      maxLength={MAX_ATTRIBUTE_NAME_LENGTH}
                    />
                    <CharCounter length={name.length} max={MAX_ATTRIBUTE_NAME_LENGTH} />
                  </TextField>

                  <Select
                    selectedKey={type}
                    onSelectionChange={(key) => handleTypeChange(String(key))}
                    isDisabled={attribute !== null}
                  >
                    <Label>Tipo de atributo</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {ATTRIBUTE_TYPES.map((value) => (
                          <ListBoxItem key={value} id={value}>
                            {value}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Valores</Label>
                    <span className="text-xs text-muted">
                      {values.length}/{maxValues}
                    </span>
                  </div>

                  {type === "Color" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            aria-label={`Elegir color ${preset}`}
                            onClick={() => setColorHex(preset)}
                            style={{ backgroundColor: preset }}
                            className={cn(
                              "size-7 rounded-full border border-border transition-transform",
                              colorHex === preset && "ring-2 ring-focus ring-offset-2",
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <TextField
                          value={colorName}
                          onChange={setColorName}
                          className="flex-1"
                          aria-label="Nombre del color"
                          isInvalid={colorName.trim() !== "" && colorNameTaken}
                        >
                          <Input placeholder="Nombre del color" maxLength={MAX_ATTRIBUTE_VALUE_LENGTH} />
                        </TextField>
                        <input
                          type="color"
                          aria-label="Seleccionar color personalizado"
                          value={colorHex || "#000000"}
                          onChange={(e) => setColorHex(e.target.value)}
                          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          isDisabled={
                            !colorName.trim() ||
                            !colorHex ||
                            colorNameTaken ||
                            colorHexTaken ||
                            isFull
                          }
                          onPress={handleAddColor}
                        >
                          <Plus className="size-4" />
                          Añadir
                        </Button>
                      </div>

                      {(colorNameTaken && colorName.trim() !== "") || colorHexTaken ? (
                        <p className="text-xs text-danger">
                          Ese {colorNameTaken ? "nombre" : "color"} ya está en la lista.
                        </p>
                      ) : null}

                      {/* Arrastra (o usa ◀ ▶) para definir el orden en que se muestran. */}
                      <SortableChips
                        items={colors}
                        getKey={(color) => color.value}
                        getLabel={(color) => color.name}
                        renderPrefix={(color) => (
                          <span
                            style={{ backgroundColor: color.value }}
                            className="size-4 shrink-0 rounded-full border border-border"
                          />
                        )}
                        onChange={setColors}
                        isDisabled={isPending}
                      />
                    </div>
                  )}

                  {type === "Genero" && (
                    <div className="flex flex-wrap gap-2">
                      {GENDER_OPTIONS.map((gender) => {
                        const isSelected = genders.includes(gender);
                        return (
                          <Button
                            key={gender}
                            type="button"
                            size="sm"
                            variant={isSelected ? "primary" : "outline"}
                            onPress={() => toggleGender(gender)}
                          >
                            {gender}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {type !== "Color" && type !== "Genero" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <TextField
                          value={textValue}
                          onChange={setTextValue}
                          className="flex-1"
                          aria-label="Nuevo valor"
                        >
                          <Input
                            placeholder={`Ej: valor de ${type.toLowerCase()}`}
                            maxLength={MAX_ATTRIBUTE_VALUE_LENGTH}
                          />
                        </TextField>
                        <Button
                          type="button"
                          variant="secondary"
                          isDisabled={
                            !textValue.trim() || texts.includes(textValue.trim()) || isFull
                          }
                          onPress={handleAddText}
                        >
                          <Plus className="size-4" />
                          Añadir
                        </Button>
                      </div>

                      <SortableChips
                        items={texts}
                        getKey={(value) => value}
                        getLabel={(value) => value}
                        onChange={setTexts}
                        isDisabled={isPending}
                      />
                    </div>
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="ghost"
                  type="button"
                  isDisabled={isPending}
                  onPress={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={isPending} pendingLabel="Guardando">
                  {attribute
                      ? "Guardar cambios"
                      : "Crear atributo"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
