"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Package, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryAttribute, useQueryCategories } from "@/app/api/queries";
import type { Products } from "@/interfaces/products";
import { MultiSelectPopover } from "./multi-select-popover";
import { ImagePickerModal } from "./image-picker-modal";

interface Spec {
  key: string;
  value: string;
}

interface ProductoFormModalProps {
  /** null = crear, con valor = editar */
  product: Products | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (id: string | null, data: FormData) => void;
  isPending: boolean;
}

const MAX_SPECS = 5;
const MAX_PRODUCT_IMAGES = 5;

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
  const [stock, setStock] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [productImages, setProductImages] = useState<string[]>([]);

  const [isMainImagePickerOpen, setIsMainImagePickerOpen] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);

  const { data: attrData } = useQueryAttribute(1, "");
  const { data: catData } = useQueryCategories(1, "");
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
      setStock("");
      setSpecs([]);
      setSelectedAttributes(new Set());
      setSelectedCategories(new Set());
      setProductImages([]);
      return;
    }

    setImageProduct(product.image_product || "");
    setTitle(product.title || "");
    setPrice(product.price ? product.price.toString() : "");
    setDiscount(product.discount ? product.discount.toString() : "");
    setDescription(product.description || "");
    setReference(product.reference || "");
    setStock(product.quantity ? product.quantity.toString() : "0");
    setProductImages(product.images || []);

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

    try {
      const parsedAttr = product.attributes
        ? typeof product.attributes === "string"
          ? JSON.parse(product.attributes)
          : product.attributes
        : [];
      setSelectedAttributes(new Set(Array.isArray(parsedAttr) ? parsedAttr.map(String) : []));
    } catch {
      setSelectedAttributes(new Set());
    }

    const cats = Array.isArray(product.Categories) ? product.Categories.map((c) => c.id) : [];
    setSelectedCategories(new Set(cats));
  }, [isOpen, product]);

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
    .map((attr) => ({ id: attr.id, label: attr.attribute_name }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("image_product", imageProduct);
    formData.append("quantity", stock);
    formData.append("price", price);
    formData.append("discount_price", discountPrice);
    formData.append("discount", discountValue.toString());
    formData.append("description", description.trim());
    formData.append("reference", reference.trim());
    formData.append("attributes", JSON.stringify(Array.from(selectedAttributes)));

    const catArray = Array.from(selectedCategories).map((id) => {
      const category = categories.find((c) => c.id === id);
      return { id, name: category?.name ?? "" };
    });
    formData.append("categories", JSON.stringify(catArray));

    const validSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
    formData.append("specs", JSON.stringify(validSpecs));
    formData.append("images", JSON.stringify(productImages));

    onSubmit(product?.id ?? null, formData);
  };

  const isValid = title.trim() !== "" && price !== "" && stock !== "";

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop isDismissable={!isPending}>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <ModalFormHeader
                  icon={Package}
                  title={isEdit ? "Editar producto" : "Crear producto"}
                  description="Los campos marcados con * son obligatorios para publicarlo en la tienda."
                />

                <Modal.Body className="space-y-6">
                  <div className="space-y-2">
                    <Label>Imagen principal del producto</Label>
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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextField value={title} onChange={setTitle} isRequired>
                      <Label>Título del producto *</Label>
                      <Input placeholder="Ej: Producto increíble" />
                    </TextField>

                    <TextField value={reference} onChange={setReference}>
                      <Label>Referencia</Label>
                      <Input placeholder="SKU-123" />
                    </TextField>

                    <TextField value={price} onChange={setPrice} type="number" isRequired>
                      <Label>Precio base *</Label>
                      <Input placeholder="0.00" min={0} step="0.01" />
                    </TextField>

                    <TextField value={discount} onChange={handleDiscountChange} type="number">
                      <Label>Descuento (%)</Label>
                      <Input placeholder="0 a 100" min={0} max={100} />
                    </TextField>

                    <div className="space-y-2">
                      <Label>Precio final con descuento</Label>
                      <div className="flex h-10 items-center rounded-lg border border-border bg-surface-secondary px-3 text-muted">
                        {discountPrice ? `$${discountPrice}` : "-"}
                      </div>
                    </div>

                    <TextField value={stock} onChange={setStock} type="number" isRequired>
                      <Label>Stock *</Label>
                      <Input placeholder="0" min={0} />
                    </TextField>
                  </div>

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
                        selectedIds={selectedAttributes}
                        onChange={setSelectedAttributes}
                        placeholder="Seleccionar atributos"
                        emptyMessage="No hay atributos"
                        itemNoun={{ singular: "atributo", plural: "atributos" }}
                      />
                    </div>
                  </div>

                  <TextField value={description} onChange={setDescription}>
                    <Label>Descripción del producto</Label>
                    <TextArea
                      placeholder="Escribe la descripción del producto..."
                      className="min-h-24"
                    />
                  </TextField>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Especificaciones (máx. {MAX_SPECS})</Label>
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
                    </div>

                    <div className="space-y-2">
                      {specs.map((spec, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            aria-label="Nombre de la especificación"
                            placeholder="Ej: Color"
                            value={spec.key}
                            onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                          />
                          <Input
                            aria-label="Valor de la especificación"
                            placeholder="Ej: Rojo"
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
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Imágenes del producto (máx. {MAX_PRODUCT_IMAGES})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isDisabled={productImages.length >= MAX_PRODUCT_IMAGES}
                        onPress={() => setIsGalleryPickerOpen(true)}
                      >
                        <Plus className="size-4" />
                        Agregar
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {productImages.map((img, index) => (
                        <div
                          key={img}
                          className="group relative size-20 overflow-hidden rounded-md border border-border"
                        >
                          <img src={img} alt="Imagen del producto" className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setProductImages((prev) => prev.filter((_, i) => i !== index))
                            }
                            aria-label="Quitar imagen"
                            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      ))}
                    </div>
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
        onOpenChange={setIsGalleryPickerOpen}
        multiple
        maxSelection={MAX_PRODUCT_IMAGES}
        currentSelected={productImages}
        disabledUrls={imageProduct ? [imageProduct] : []}
        onSelect={(urls) => setProductImages(urls.slice(0, MAX_PRODUCT_IMAGES))}
      />
    </>
  );
}
