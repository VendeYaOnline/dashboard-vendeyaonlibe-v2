"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Package, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  Switch,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useQueryAllAttributes, useQueryAllCategories } from "@/app/api/queries";
import type { Attribute } from "@/interfaces/attributes";
import type { ColorImageGroup, Products } from "@/interfaces/products";
import { MultiSelectPopover } from "./multi-select-popover";
import { ImagePickerModal } from "./image-picker-modal";
import { isColorType, normalizeAttributeType, toColorOptions } from "./attribute-values";
import { ProductAttributeList, type ProductAttributeItem } from "./product-attribute-list";
import { ColorImagesSection } from "./color-images-section";
import { ColorSelectModal } from "./color-select-modal";
import { MAX_IMAGES_PER_COLOR, MAX_PRODUCT_IMAGES, MAX_QUANTITY } from "./constants";
import { FormSection } from "./form-section";

interface Spec {
  key: string;
  value: string;
}

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * IDs de atributos con los que se abre el producto en edición, en orden.
 *
 * Prioriza `product_attributes` (columna ordenada). Para productos anteriores
 * cae al campo `attributes`: un array de IDs (guardado por una versión previa
 * de este panel) o el objeto legacy por tipo, del que se toma el primer
 * atributo del catálogo con ese tipo.
 */
const getInitialAttributeIds = (product: Products, catalog: Attribute[]): string[] => {
  if (Array.isArray(product.product_attributes)) {
    return product.product_attributes.map((attr) => attr.id);
  }

  const legacy = parseJson(product.attributes);
  if (Array.isArray(legacy)) {
    return legacy.filter((id): id is string => typeof id === "string");
  }

  if (legacy && typeof legacy === "object") {
    const ids: string[] = [];
    for (const [type, values] of Object.entries(legacy as Record<string, unknown>)) {
      if (!Array.isArray(values) || values.length === 0) continue;
      const match = catalog.find(
        (attr) =>
          attr.id &&
          !ids.includes(attr.id) &&
          normalizeAttributeType(attr.attribute_type) === normalizeAttributeType(type),
      );
      if (match?.id) ids.push(match.id);
    }
    return ids;
  }

  return [];
};

interface ProductoFormModalProps {
  /** null = crear, con valor = editar */
  product: Products | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (id: string | null, data: FormData) => void;
  isPending: boolean;
}

const MAX_SPECS = 5;

/** Cambio de atributos que requiere confirmación porque afecta al atributo de color. */
interface PendingAttributeChange {
  kind: "replace" | "remove";
  nextIds: string[];
  currentColorName: string;
  nextColorName?: string;
  linkedImages: number;
}

export function ProductoFormModal({
  product,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: ProductoFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const isEdit = product !== null;

  const [imageProduct, setImageProduct] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  /** Unidades disponibles (0 a MAX_QUANTITY); vacío = no especificado. */
  const [quantity, setQuantity] = useState("");
  const [inStock, setInStock] = useState(true);
  const [specs, setSpecs] = useState<Spec[]>([]);
  /** Ordenado: el índice es la posición en que el usuario agregó cada atributo. */
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [areAttributesHydrated, setAreAttributesHydrated] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [productImages, setProductImages] = useState<string[]>([]);
  /** Imágenes relacionadas con cada color del atributo de color del producto. */
  const [colorImages, setColorImages] = useState<ColorImageGroup[]>([]);
  const [pendingChange, setPendingChange] = useState<PendingAttributeChange | null>(null);

  const [isMainImagePickerOpen, setIsMainImagePickerOpen] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [isColorSelectOpen, setIsColorSelectOpen] = useState(false);
  /** Color al que se relacionarán las imágenes que se elijan en el selector. */
  const [pickingColorHex, setPickingColorHex] = useState<string | null>(null);

  const { data: attrData } = useQueryAllAttributes(isOpen);
  const { data: catData } = useQueryAllCategories(isOpen);
  const attributes = attrData?.attributes ?? [];
  const categories = catData?.categories ?? [];

  // Precarga al abrir en modo edición; limpia todo al abrir en modo crear.
  useEffect(() => {
    if (!isOpen) return;

    if (!product) {
      setImageProduct("");
      setTitle("");
      setPrice("");
      setDiscount("");
      setDescription("");
      setReference("");
      setQuantity("");
      setInStock(true);
      setSpecs([]);
      setSelectedAttributeIds([]);
      setAreAttributesHydrated(true);
      setSelectedCategories(new Set());
      setProductImages([]);
      setColorImages([]);
      setPendingChange(null);
      return;
    }

    // Los atributos se precargan en el efecto de abajo: el formato legacy
    // necesita el catálogo para resolver los IDs.
    setAreAttributesHydrated(false);

    setImageProduct(product.image_product || "");
    setTitle(product.title || "");
    setPrice(product.price ? product.price.toString() : "");
    setDiscount(product.discount ? product.discount.toString() : "");
    setDescription(product.description || "");
    setReference(product.reference || "");
    // Productos anteriores no tienen cantidad guardada: se deja vacía y manda
    // el interruptor de stock, que sí existe desde siempre.
    setQuantity(product.quantity != null ? product.quantity.toString() : "");
    setInStock(Boolean(product.stock));
    setProductImages(product.images || []);
    setColorImages(Array.isArray(product.color_images) ? product.color_images : []);
    setPendingChange(null);

    try {
      const parsedSpecs = product.specs
        ? typeof product.specs === "string"
          ? JSON.parse(product.specs)
          : product.specs
        : [];
      setSpecs(Array.isArray(parsedSpecs) ? parsedSpecs : []);
    } catch {
      setSpecs([]);
    }

    const cats = Array.isArray(product.Categories) ? product.Categories.map((c) => c.id) : [];
    setSelectedCategories(new Set(cats));
  }, [isOpen, product]);

  // Precarga de atributos en edición. Se ejecuta una sola vez por apertura y,
  // si el producto guarda el formato legacy, espera a que cargue el catálogo.
  useEffect(() => {
    if (!isOpen || !product || areAttributesHydrated) return;

    const legacy = parseJson(product.attributes);
    const needsCatalog =
      !Array.isArray(product.product_attributes) &&
      legacy !== null &&
      typeof legacy === "object" &&
      !Array.isArray(legacy);
    if (needsCatalog && !attrData) return;

    setSelectedAttributeIds(getInitialAttributeIds(product, attributes));
    setAreAttributesHydrated(true);
  }, [isOpen, product, areAttributesHydrated, attrData, attributes]);

  /** Tipo de un atributo, desde el catálogo o desde el snapshot del producto. */
  const getAttributeType = (id: string) =>
    attributes.find((attr) => attr.id === id)?.attribute_type ??
    product?.product_attributes?.find((attr) => attr.id === id)?.attribute_type ??
    "";

  const getAttributeName = (id: string) =>
    attributes.find((attr) => attr.id === id)?.attribute_name ??
    product?.product_attributes?.find((attr) => attr.id === id)?.attribute_name ??
    "";

  const currentColorId = selectedAttributeIds.find((id) => isColorType(getAttributeType(id)));
  const linkedImageUrls = colorImages.flatMap((group) => group.images);

  /** Quita las imágenes relacionadas con los colores del atributo anterior. */
  const dropColorImages = () => {
    setProductImages((prev) => prev.filter((url) => !linkedImageUrls.includes(url)));
    setColorImages([]);
  };

  /**
   * Aplica una nueva lista de atributos. Un producto solo admite un atributo
   * de color: elegir otro (o quitar el actual con imágenes relacionadas)
   * pide confirmación antes de descartar esas imágenes.
   */
  const requestAttributeIds = (nextIds: string[]) => {
    const nextColorIds = nextIds.filter((id) => isColorType(getAttributeType(id)));
    const newColorId = nextColorIds.find((id) => id !== currentColorId);

    if (currentColorId && newColorId) {
      // El nuevo reemplaza al anterior; se descarta cualquier otro color extra.
      const ids = nextIds.filter((id) => !nextColorIds.includes(id) || id === newColorId);
      setPendingChange({
        kind: "replace",
        nextIds: ids,
        currentColorName: getAttributeName(currentColorId),
        nextColorName: getAttributeName(newColorId),
        linkedImages: linkedImageUrls.length,
      });
      return;
    }

    if (currentColorId && !nextIds.includes(currentColorId) && linkedImageUrls.length > 0) {
      setPendingChange({
        kind: "remove",
        nextIds,
        currentColorName: getAttributeName(currentColorId),
        linkedImages: linkedImageUrls.length,
      });
      return;
    }

    if (!currentColorId && nextColorIds.length > 1) {
      // Sin color previo solo se conserva el primero elegido.
      const [first] = nextColorIds;
      setSelectedAttributeIds(nextIds.filter((id) => !nextColorIds.includes(id) || id === first));
      return;
    }

    if (currentColorId && !nextIds.includes(currentColorId)) setColorImages([]);
    setSelectedAttributeIds(nextIds);
  };

  /**
   * Mantiene el orden de agregación: conserva los que siguen marcados en su
   * posición y añade los nuevos al final.
   */
  const handleAttributesChange = (ids: Set<string>) => {
    const kept = selectedAttributeIds.filter((id) => ids.has(id));
    const added = Array.from(ids).filter((id) => !selectedAttributeIds.includes(id));
    requestAttributeIds([...kept, ...added]);
  };

  const handleRemoveAttribute = (id: string) => {
    requestAttributeIds(selectedAttributeIds.filter((item) => item !== id));
  };

  const handleConfirmPendingChange = () => {
    if (!pendingChange) return;
    dropColorImages();
    setSelectedAttributeIds(pendingChange.nextIds);
    setPendingChange(null);
  };

  // Valores frescos del catálogo; si el atributo se eliminó, se usa el
  // snapshot guardado en el producto para no perder la información en pantalla.
  const attributeItems: ProductAttributeItem[] = selectedAttributeIds.flatMap((id) => {
    const live = attributes.find((attr) => attr.id === id);
    if (live) {
      return [
        {
          id,
          name: live.attribute_name,
          type: live.attribute_type,
          values: live.value ?? [],
        },
      ];
    }
    const snapshot = product?.product_attributes?.find((attr) => attr.id === id);
    if (!snapshot) return [];
    return [
      {
        id,
        name: snapshot.attribute_name,
        type: snapshot.attribute_type,
        values: snapshot.value ?? [],
        // Mientras carga el catálogo no se puede saber si fue eliminado.
        isMissing: Boolean(attrData),
      },
    ];
  });

  const colorAttribute = attributeItems.find((item) => isColorType(item.type));
  const colorOptions = colorAttribute ? toColorOptions(colorAttribute.values) : [];
  const unassignedImages = productImages.filter((url) => !linkedImageUrls.includes(url));
  const colorChoices = colorOptions.map((color) => ({
    ...color,
    count: colorImages.find((group) => group.color === color.hex)?.images.length ?? 0,
  }));
  const allColorsFull =
    colorChoices.length > 0 &&
    colorChoices.every((color) => color.count >= MAX_IMAGES_PER_COLOR);
  const pickingGroup = pickingColorHex
    ? colorImages.find((group) => group.color === pickingColorHex)
    : undefined;

  const handleAddImagesPress = () => {
    if (colorAttribute) {
      setIsColorSelectOpen(true);
      return;
    }
    setPickingColorHex(null);
    setIsGalleryPickerOpen(true);
  };

  const handlePickForColor = (hex: string) => {
    setPickingColorHex(hex);
    setIsGalleryPickerOpen(true);
  };

  /** Resultado del selector de galería: para un color o para la galería plana. */
  const handleGallerySelect = (urls: string[]) => {
    if (!pickingColorHex) {
      setProductImages(urls.slice(0, MAX_PRODUCT_IMAGES));
      return;
    }

    const hex = pickingColorHex;
    const nextImages = urls.slice(0, MAX_IMAGES_PER_COLOR);
    const previousImages = colorImages.find((group) => group.color === hex)?.images ?? [];
    const name = colorOptions.find((color) => color.hex === hex)?.name ?? "";

    setColorImages((prev) => {
      const rest = prev.filter((group) => group.color !== hex);
      if (nextImages.length === 0) return rest;
      // Se conserva la posición del color según el orden del atributo.
      const ordered = colorOptions
        .map((color) =>
          color.hex === hex
            ? { color: hex, name, images: nextImages }
            : rest.find((group) => group.color === color.hex),
        )
        .filter((group): group is ColorImageGroup => Boolean(group));
      const orphans = rest.filter((group) => !colorOptions.some((c) => c.hex === group.color));
      return [...ordered, ...orphans];
    });

    // Toda imagen ligada a un color vive también en la galería del producto.
    setProductImages((prev) => {
      const withoutOld = prev.filter(
        (url) => !previousImages.includes(url) || nextImages.includes(url),
      );
      const added = nextImages.filter((url) => !withoutOld.includes(url));
      return [...withoutOld, ...added];
    });
    setPickingColorHex(null);
  };

  const handleRemoveImage = (url: string) => {
    setProductImages((prev) => prev.filter((item) => item !== url));
    setColorImages((prev) =>
      prev
        .map((group) => ({ ...group, images: group.images.filter((item) => item !== url) }))
        .filter((group) => group.images.length > 0),
    );
  };

  const discountValue = parseInt(discount) || 0;
  const priceValue = parseFloat(price) || 0;
  const discountPrice =
    discountValue > 0
      ? (priceValue - (priceValue * discountValue) / 100).toFixed(2)
      : priceValue > 0
        ? priceValue.toFixed(2)
        : "";

  const handleDiscountChange = (value: string) => {
    if (value === "") {
      setDiscount("");
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setDiscount(num.toString());
    }
  };

  const quantityValue = quantity === "" ? null : parseInt(quantity, 10);
  // Con cantidad 0 el producto no puede estar en stock; el interruptor se bloquea.
  const isStockLocked = quantityValue === 0;
  const effectiveInStock = isStockLocked ? false : inStock;

  const handleQuantityChange = (value: string) => {
    if (value === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > MAX_QUANTITY) return;
    setQuantity(num.toString());
    // Al pasar de 0/vacío a una cantidad positiva se activa el stock por defecto.
    if (num > 0 && !(quantityValue !== null && quantityValue > 0)) setInStock(true);
  };

  const handleAddSpec = () => {
    if (specs.length >= MAX_SPECS) return;
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleSpecChange = (index: number, field: keyof Spec, value: string) => {
    setSpecs((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec)),
    );
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const categoryOptions = categories.map((cat) => ({ id: cat.id, label: cat.name }));
  const attributeOptions = attributes
    .filter((attr): attr is typeof attr & { id: string } => Boolean(attr.id))
    .map((attr) => ({ id: attr.id, label: attr.attribute_name, hint: attr.attribute_type }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("image_product", imageProduct);
    formData.append("quantity", quantity);
    formData.append("stock", String(effectiveInStock));
    formData.append("price", price);
    formData.append("discount_price", discountPrice);
    formData.append("discount", discountValue.toString());
    formData.append("description", description.trim());
    formData.append("reference", reference.trim());
    formData.append("attributes", JSON.stringify(selectedAttributeIds));

    const catArray = Array.from(selectedCategories).map((id) => {
      const category = categories.find((c) => c.id === id);
      return { id, name: category?.name ?? "" };
    });
    formData.append("categories", JSON.stringify(catArray));

    const validSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
    formData.append("specs", JSON.stringify(validSpecs));
    formData.append("images", JSON.stringify(productImages));
    formData.append(
      "color_images",
      JSON.stringify(colorAttribute ? colorImages.filter((g) => g.images.length > 0) : []),
    );

    onSubmit(product?.id ?? null, formData);
  };

  const isValid = title.trim() !== "" && price !== "";

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop isDismissable={!isPending}>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-2xl">
              {/* Columna flex: así el cuerpo puede encogerse y desplazarse dentro del diálogo. */}
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <ModalFormHeader
                  icon={Package}
                  title={isEdit ? "Editar producto" : "Crear producto"}
                  description="Los campos marcados con * son obligatorios para publicarlo en la tienda."
                />

                <Modal.Body className="space-y-4">
                  <FormSection
                    title="Información básica"
                    description="Nombre, referencia e imagen con la que se muestra en la tienda."
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="space-y-2">
                        <Label>Imagen principal</Label>
                        <button
                          type="button"
                          onClick={() => setIsMainImagePickerOpen(true)}
                          className="relative flex size-32 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border transition-colors hover:bg-surface-secondary"
                        >
                          {imageProduct ? (
                            <img
                              src={imageProduct}
                              alt="Imagen principal"
                              className="size-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="mb-2 size-8 text-muted" />
                              <span className="text-xs text-muted">Seleccionar</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex-1 space-y-4">
                        <TextField value={title} onChange={setTitle} isRequired>
                          <Label>Título del producto *</Label>
                          <Input placeholder="Ej: Producto increíble" />
                        </TextField>

                        <TextField value={reference} onChange={setReference}>
                          <Label>Referencia</Label>
                          <Input placeholder="SKU-123" />
                        </TextField>
                      </div>
                    </div>

                    <TextField value={description} onChange={setDescription}>
                      <Label>Descripción del producto</Label>
                      <TextArea
                        placeholder="Escribe la descripción del producto..."
                        className="min-h-24"
                      />
                    </TextField>
                  </FormSection>

                  <FormSection title="Precio">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <TextField value={price} onChange={setPrice} type="number" isRequired>
                        <Label>Precio base *</Label>
                        <Input placeholder="0.00" min={0} step="0.01" />
                      </TextField>

                      <TextField value={discount} onChange={handleDiscountChange} type="number">
                        <Label>Descuento (%)</Label>
                        <Input placeholder="0 a 100" min={0} max={100} />
                      </TextField>

                      <div className="space-y-2">
                        <Label>Precio final</Label>
                        <div className="flex h-10 items-center rounded-lg border border-border bg-surface-secondary px-3 font-medium text-foreground">
                          {discountPrice ? `$${discountPrice}` : "-"}
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Inventario"
                    description={`Cantidad de 0 a ${MAX_QUANTITY}. Con 0 unidades el producto queda sin stock automáticamente.`}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField value={quantity} onChange={handleQuantityChange} type="number">
                        <Label>Cantidad</Label>
                        <Input placeholder="Ej: 25" min={0} max={MAX_QUANTITY} />
                      </TextField>

                      <div className="space-y-2">
                        <Label>Stock</Label>
                        <div className="flex h-10 items-center rounded-lg border border-border bg-surface px-3">
                          <Switch
                            isSelected={effectiveInStock}
                            onChange={setInStock}
                            isDisabled={isStockLocked}
                          >
                            <Switch.Content>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              <Label>
                                {isStockLocked
                                  ? "Sin stock (cantidad 0)"
                                  : effectiveInStock
                                    ? "Disponible en la tienda"
                                    : "Agotado"}
                              </Label>
                            </Switch.Content>
                          </Switch>
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Clasificación"
                    description="Categorías donde aparece y atributos (color, talla...) con los que se vende."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Categorías</Label>
                        <MultiSelectPopover
                          options={categoryOptions}
                          selectedIds={selectedCategories}
                          onChange={setSelectedCategories}
                          placeholder="Seleccionar categorías"
                          emptyMessage="No hay categorías"
                          itemNoun={{ singular: "categoría", plural: "categorías" }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Atributos</Label>
                        <MultiSelectPopover
                          options={attributeOptions}
                          selectedIds={new Set(selectedAttributeIds)}
                          onChange={handleAttributesChange}
                          placeholder="Seleccionar atributos"
                          emptyMessage="No hay atributos"
                          itemNoun={{ singular: "atributo", plural: "atributos" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Atributos agregados</Label>
                        {attributeItems.length > 0 && (
                          <span className="text-xs text-muted">
                            {attributeItems.length}{" "}
                            {attributeItems.length === 1 ? "atributo" : "atributos"} · en orden de
                            agregación
                          </span>
                        )}
                      </div>
                      <ProductAttributeList items={attributeItems} onRemove={handleRemoveAttribute} />
                    </div>
                  </FormSection>

                  <FormSection
                    title={`Especificaciones (máx. ${MAX_SPECS})`}
                    description="Datos técnicos en pares nombre/valor."
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isDisabled={specs.length >= MAX_SPECS}
                        onPress={handleAddSpec}
                      >
                        <Plus className="size-4" />
                        Agregar
                      </Button>
                    }
                  >
                    {specs.length === 0 ? (
                      <p className="text-xs text-muted">Sin especificaciones.</p>
                    ) : (
                      <div className="space-y-2">
                        {specs.map((spec, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              aria-label="Nombre de la especificación"
                              placeholder="Ej: Código"
                              value={spec.key}
                              onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                            />
                            <Input
                              aria-label="Valor de la especificación"
                              placeholder="Ej: DH63"
                              value={spec.value}
                              onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              isIconOnly
                              aria-label="Quitar especificación"
                              className="shrink-0 text-danger"
                              onPress={() => handleRemoveSpec(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormSection>

                  <FormSection
                    title={
                      colorAttribute
                        ? "Imágenes por color (máx. " + MAX_IMAGES_PER_COLOR + " por color)"
                        : "Imágenes del producto (máx. " + MAX_PRODUCT_IMAGES + ")"
                    }
                    description={
                      colorAttribute
                        ? `Cada imagen se relaciona con un color de «${colorAttribute.name}».`
                        : "Galería secundaria que se muestra junto a la imagen principal."
                    }
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isDisabled={
                          colorAttribute
                            ? colorOptions.length === 0 || allColorsFull
                            : productImages.length >= MAX_PRODUCT_IMAGES
                        }
                        onPress={handleAddImagesPress}
                      >
                        <Plus className="size-4" />
                        Agregar
                      </Button>
                    }
                  >
                    {colorAttribute ? (
                      <ColorImagesSection
                        colors={colorOptions}
                        groups={colorImages}
                        unassignedImages={unassignedImages}
                        onPickForColor={handlePickForColor}
                        onRemoveImage={handleRemoveImage}
                      />
                    ) : productImages.length === 0 ? (
                      <p className="text-xs text-muted">Sin imágenes adicionales.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {productImages.map((img) => (
                          <div
                            key={img}
                            className="group relative size-20 overflow-hidden rounded-md border border-border"
                          >
                            <img src={img} alt="Imagen del producto" className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img)}
                              aria-label="Quitar imagen"
                              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormSection>
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
                  <Button variant="primary" type="submit" isDisabled={!isValid || isPending}>
                    {isPending
                      ? isEdit
                        ? "Actualizando..."
                        : "Creando..."
                      : isEdit
                        ? "Actualizar producto"
                        : "Crear producto"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ImagePickerModal
        isOpen={isMainImagePickerOpen}
        onOpenChange={setIsMainImagePickerOpen}
        multiple={false}
        currentSelected={imageProduct ? [imageProduct] : []}
        onSelect={(urls) => {
          if (urls.length > 0) setImageProduct(urls[0]);
        }}
      />

      <ImagePickerModal
        isOpen={isGalleryPickerOpen}
        onOpenChange={(open) => {
          setIsGalleryPickerOpen(open);
          if (!open) setPickingColorHex(null);
        }}
        multiple
        maxSelection={pickingColorHex ? MAX_IMAGES_PER_COLOR : MAX_PRODUCT_IMAGES}
        currentSelected={pickingColorHex ? (pickingGroup?.images ?? []) : productImages}
        disabledUrls={[
          ...(imageProduct ? [imageProduct] : []),
          // Una imagen solo puede pertenecer a un color.
          ...(pickingColorHex
            ? colorImages
                .filter((group) => group.color !== pickingColorHex)
                .flatMap((group) => group.images)
            : []),
        ]}
        onSelect={handleGallerySelect}
      />

      {colorAttribute && (
        <ColorSelectModal
          isOpen={isColorSelectOpen}
          onOpenChange={setIsColorSelectOpen}
          attributeName={colorAttribute.name}
          colors={colorChoices}
          onSelect={handlePickForColor}
        />
      )}

      <ConfirmDialog
        isOpen={pendingChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingChange(null);
        }}
        onConfirm={handleConfirmPendingChange}
        tone={pendingChange?.linkedImages ? "danger" : "accent"}
        title={
          pendingChange?.kind === "replace"
            ? "Reemplazar el atributo de color"
            : "Quitar el atributo de color"
        }
        confirmLabel={pendingChange?.kind === "replace" ? "Reemplazar" : "Quitar"}
        description={
          pendingChange ? (
            <div className="space-y-2">
              {pendingChange.kind === "replace" ? (
                <p>
                  Un producto solo puede tener un atributo de color.{" "}
                  <strong>«{pendingChange.nextColorName}»</strong> reemplazará a{" "}
                  <strong>«{pendingChange.currentColorName}»</strong>.
                </p>
              ) : (
                <p>
                  Vas a quitar el atributo <strong>«{pendingChange.currentColorName}»</strong>.
                </p>
              )}
              {pendingChange.linkedImages > 0 && (
                <p>
                  Se eliminarán del producto las{" "}
                  <strong>
                    {pendingChange.linkedImages}{" "}
                    {pendingChange.linkedImages === 1
                      ? "imagen relacionada"
                      : "imágenes relacionadas"}
                  </strong>{" "}
                  con sus colores.
                </p>
              )}
            </div>
          ) : null
        }
      />
    </>
  );
}
