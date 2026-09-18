"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Package, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  InputGroup,
  Label,
  Modal,
  Switch,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  toast,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useQueryAllAttributes, useQueryAllCategories } from "@/app/api/queries";
import type { Attribute } from "@/interfaces/attributes";
import type { ColorImageGroup, Products } from "@/interfaces/products";
import { MultiSelectPopover } from "./multi-select-popover";
import { ImagePickerModal } from "@/components/shared/image-picker-modal";
import { isColorType, normalizeAttributeType, toColorOptions } from "./attribute-values";
import { VariantMatrix } from "./variant-matrix";
import {
  buildCombinations,
  defaultInventoryForType,
  getInventoryAttributes,
  sumQuantities,
  toVariantKey,
} from "../variants";
import { ProductAttributeList, type ProductAttributeItem } from "./product-attribute-list";
import { ColorImagesSection } from "./color-images-section";
import { ColorSelectModal } from "./color-select-modal";
import {
  MAX_BUNDLE_LABEL_LENGTH,
  MAX_BUNDLE_SIZE,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGES_PER_COLOR,
  MIN_BUNDLE_SIZE,
  MAX_PRICE,
  MAX_PRODUCT_IMAGES,
  MAX_QUANTITY,
  MAX_REFERENCE_LENGTH,
  MAX_SPEC_KEY_LENGTH,
  MAX_SPEC_VALUE_LENGTH,
  MAX_TITLE_LENGTH,
} from "./constants";
import { CharCounter, FormSection } from "./form-section";
import { formatCOP, formatThousands, priceToDigits, toDigits } from "../utils";

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

/**
 * Cambio de atributos que requiere confirmación porque afecta a las imágenes:
 * - replace: otro atributo de color sustituye al actual (se pierden sus imágenes).
 * - add-color: se agrega el primer atributo de color y hay imágenes generales
 *   cargadas, que se eliminan porque pasan a gestionarse por color.
 */
interface PendingAttributeChange {
  kind: "replace" | "add-color";
  nextIds: string[];
  currentColorName?: string;
  nextColorName: string;
  /** Imágenes que se eliminarán al confirmar. */
  affectedImages: number;
}

/** Atributos que pueden generar variantes a la vez (la matriz muestra hasta 3 niveles). */
const MAX_INVENTORY_ATTRIBUTES = 3;

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
  /** "unit" = se vende por unidad; "bundle" = set de N piezas elegidas una a una. */
  const [saleMode, setSaleMode] = useState<"unit" | "bundle">("unit");
  const [bundleSize, setBundleSize] = useState("3");
  const [bundleLabel, setBundleLabel] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  /** Ordenado: el índice es la posición en que el usuario agregó cada atributo. */
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [areAttributesHydrated, setAreAttributesHydrated] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [productImages, setProductImages] = useState<string[]>([]);
  /** Imágenes relacionadas con cada color del atributo de color del producto. */
  const [colorImages, setColorImages] = useState<ColorImageGroup[]>([]);
  const [pendingChange, setPendingChange] = useState<PendingAttributeChange | null>(null);
  /** Si cada atributo agregado controla inventario (por id). */
  const [inventoryFlags, setInventoryFlags] = useState<Record<string, boolean>>({});
  /** Unidades por variante (variant_key → texto, para permitir el campo vacío). */
  const [variantQuantities, setVariantQuantities] = useState<Record<string, string>>({});
  /** Controlado para poder cerrarlo antes de mostrar el diálogo de confirmación. */
  const [isAttributesPopoverOpen, setIsAttributesPopoverOpen] = useState(false);

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
      setSaleMode("unit");
      setBundleSize("3");
      setBundleLabel("");
      setSpecs([]);
      setSelectedAttributeIds([]);
      setAreAttributesHydrated(true);
      setSelectedCategories(new Set());
      setProductImages([]);
      setColorImages([]);
      setInventoryFlags({});
      setVariantQuantities({});
      setPendingChange(null);
      return;
    }

    // Los atributos se precargan en el efecto de abajo: el formato legacy
    // necesita el catálogo para resolver los IDs.
    setAreAttributesHydrated(false);

    setImageProduct(product.image_product || "");
    setTitle(product.title || "");
    // El precio se maneja como entero en pesos (sin decimales).
    setPrice(priceToDigits(product.price));
    setDiscount(product.discount ? product.discount.toString() : "");
    setDescription(product.description || "");
    setReference(product.reference || "");
    // Productos anteriores no tienen cantidad guardada: se deja vacía y manda
    // el interruptor de stock, que sí existe desde siempre.
    setQuantity(product.quantity != null ? product.quantity.toString() : "");
    setInStock(Boolean(product.stock));
    setSaleMode((product.bundle_size ?? 0) > 1 ? "bundle" : "unit");
    setBundleSize(String(product.bundle_size ?? 3));
    setBundleLabel(product.bundle_item_label ?? "");
    setProductImages(product.images || []);
    setColorImages(
      Array.isArray(product.color_images)
        ? [...product.color_images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [],
    );
    setPendingChange(null);
    setInventoryFlags(
      Object.fromEntries(
        (product.product_attributes ?? [])
          .filter((attr) => typeof attr.inventory === "boolean")
          .map((attr) => [attr.id, attr.inventory as boolean]),
      ),
    );
    setVariantQuantities(
      Object.fromEntries(
        (product.variants ?? []).map((variant) => [variant.variant_key, String(variant.quantity)]),
      ),
    );

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
   * de color: elegir uno *distinto* al actual pide confirmación antes de
   * reemplazarlo y descartar sus imágenes. Quitar el actual se aplica
   * directamente (se avisa con un toast si tenía imágenes relacionadas).
   */
  const requestAttributeIds = (nextIds: string[]) => {
    const nextColorIds = nextIds.filter((id) => isColorType(getAttributeType(id)));
    const newColorId = nextColorIds.find((id) => id !== currentColorId);

    if (currentColorId && newColorId && newColorId !== currentColorId) {
      // El nuevo reemplaza al anterior; se descarta cualquier otro color extra.
      const ids = nextIds.filter((id) => !nextColorIds.includes(id) || id === newColorId);
      // El popover debe cerrarse: si no, queda por encima del diálogo.
      setIsAttributesPopoverOpen(false);
      setPendingChange({
        kind: "replace",
        nextIds: ids,
        currentColorName: getAttributeName(currentColorId),
        nextColorName: getAttributeName(newColorId),
        affectedImages: linkedImageUrls.length,
      });
      return;
    }

    if (!currentColorId && newColorId) {
      // Sin color previo solo se conserva el primero elegido.
      const ids = nextIds.filter((id) => !nextColorIds.includes(id) || id === newColorId);
      // Las imágenes generales se eliminan: con color, se gestionan por color.
      if (productImages.length > 0) {
        setIsAttributesPopoverOpen(false);
        setPendingChange({
          kind: "add-color",
          nextIds: ids,
          nextColorName: getAttributeName(newColorId),
          affectedImages: productImages.length,
        });
        return;
      }
      setSelectedAttributeIds(ids);
      return;
    }

    if (currentColorId && !nextIds.includes(currentColorId)) {
      dropColorImages();
      if (linkedImageUrls.length > 0) {
        toast.warning(
          `Se quitaron ${linkedImageUrls.length} ${
            linkedImageUrls.length === 1 ? "imagen relacionada" : "imágenes relacionadas"
          } con los colores de «${getAttributeName(currentColorId)}».`,
        );
      }
    }
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
    if (pendingChange.kind === "add-color") {
      setProductImages([]);
      setColorImages([]);
    } else {
      dropColorImages();
      // Cambia el atributo padre: todas las combinaciones anteriores dejan de existir.
      setVariantQuantities({});
    }
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

  // ---------- Inventario por variante ----------
  const inventoryAttributes = getInventoryAttributes(attributeItems, inventoryFlags);
  const combinations = buildCombinations(inventoryAttributes);
  const variantKeys = combinations.map(toVariantKey);
  const hasAttributeStock = variantKeys.length > 0;
  const attributeStockTotal = sumQuantities(variantKeys, variantQuantities);

  const handleInventoryChange = (id: string, enabled: boolean) => {
    const enabledCount = getInventoryAttributes(attributeItems, {
      ...inventoryFlags,
      [id]: enabled,
    }).length;
    if (enabled && enabledCount > MAX_INVENTORY_ATTRIBUTES) {
      toast.warning(`Como máximo ${MAX_INVENTORY_ATTRIBUTES} atributos pueden controlar inventario.`);
      return;
    }
    setInventoryFlags((prev) => ({ ...prev, [id]: enabled }));
  };

  const handleVariantChange = (variantKey: string, raw: string) => {
    const digits = toDigits(raw);
    const next = digits === "" ? "" : String(Math.min(Number(digits), MAX_QUANTITY));
    setVariantQuantities((prev) => ({ ...prev, [variantKey]: next }));
  };

  /** Copia las unidades de un valor del padre (p. ej. Rojo) a los demás valores del padre. */
  const handleCopyParent = (parentValueKey: string) => {
    const source = combinations.filter((combo) => combo[0].value_key === parentValueKey);
    setVariantQuantities((prev) => {
      const next = { ...prev };
      for (const combo of source) {
        const value = prev[toVariantKey(combo)] ?? "";
        for (const target of combinations) {
          if (target[0].value_key === parentValueKey) continue;
          const sameChildren = target
            .slice(1)
            .every((part, index) => part.value_key === combo[index + 1]?.value_key);
          if (sameChildren) next[toVariantKey(target)] = value;
        }
      }
      return next;
    });
  };

  const colorAttribute = attributeItems.find((item) => isColorType(item.type));
  const colorOptions = colorAttribute ? toColorOptions(colorAttribute.values) : [];
  const unassignedImages = productImages.filter((url) => !linkedImageUrls.includes(url));

  /**
   * Un grupo por color en el orden elegido por el usuario: primero los ya
   * guardados (en su orden) y después los colores del atributo que aún no
   * tienen grupo, en el orden del atributo.
   */
  const orderedGroups: ColorImageGroup[] = colorAttribute
    ? [
        ...colorImages.map((group) => ({
          ...group,
          name: colorOptions.find((color) => color.hex === group.color)?.name ?? group.name,
        })),
        ...colorOptions
          .filter((color) => !colorImages.some((group) => group.color === color.hex))
          .map((color) => ({ color: color.hex, name: color.name, images: [] })),
      ]
    : [];

  const colorChoices = orderedGroups
    .filter((group) => colorOptions.some((color) => color.hex === group.color))
    .map((group) => ({ hex: group.color, name: group.name, count: group.images.length }));
  const allColorsFull =
    colorChoices.length > 0 &&
    colorChoices.every((color) => color.count >= MAX_IMAGES_PER_COLOR);
  const pickingGroup = pickingColorHex
    ? orderedGroups.find((group) => group.color === pickingColorHex)
    : undefined;

  /** Mueve un color a otra posición; el primero es el que carga primero en la tienda. */
  const handleMoveColor = (hex: string, toIndex: number) => {
    const fromIndex = orderedGroups.findIndex((group) => group.color === hex);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= orderedGroups.length) return;
    const next = [...orderedGroups];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setColorImages(next);
  };

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
    const previousImages = pickingGroup?.images ?? [];

    // Se conserva el orden de las tarjetas; solo cambian las imágenes del color.
    setColorImages(
      orderedGroups.map((group) =>
        group.color === hex ? { ...group, images: nextImages } : group,
      ),
    );

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
    // Los grupos vacíos se conservan para no perder el orden elegido.
    setColorImages((prev) =>
      prev.map((group) => ({ ...group, images: group.images.filter((item) => item !== url) })),
    );
  };

  const discountValue = parseInt(discount) || 0;
  const priceValue = parseInt(price, 10) || 0;
  // Redondeado al peso: en Colombia no se manejan centavos.
  const discountPrice =
    priceValue > 0
      ? String(Math.round(priceValue - (priceValue * discountValue) / 100))
      : "";

  const handlePriceChange = (raw: string) => {
    const digits = toDigits(raw);
    if (digits === "") {
      setPrice("");
      return;
    }
    setPrice(String(Math.min(Number(digits), MAX_PRICE)));
  };

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

  const quantityValue = hasAttributeStock
    ? attributeStockTotal
    : quantity === ""
      ? null
      : parseInt(quantity, 10);
  // Con cantidad 0 el producto no puede estar en stock; el interruptor se
  // bloquea. Con inventario por atributo, cantidad y stock se calculan.
  const isStockLocked = hasAttributeStock || quantityValue === 0;
  const effectiveInStock = hasAttributeStock
    ? attributeStockTotal > 0
    : quantityValue === 0
      ? false
      : inStock;

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

  // Un atributo por tipo: los demás del mismo tipo quedan deshabilitados.
  const selectedTypes = new Set(
    selectedAttributeIds.map((id) => normalizeAttributeType(getAttributeType(id))),
  );
  const disabledAttributeIds = attributes
    .filter(
      (attr) =>
        attr.id &&
        !selectedAttributeIds.includes(attr.id) &&
        selectedTypes.has(normalizeAttributeType(attr.attribute_type)),
    )
    .map((attr) => attr.id as string);

  const categoryOptions = categories.map((cat) => ({ id: cat.id, label: cat.name }));
  const attributeOptions = attributes
    .filter((attr): attr is typeof attr & { id: string } => Boolean(attr.id))
    .map((attr) => ({ id: attr.id, label: attr.attribute_name, hint: attr.attribute_type }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("image_product", imageProduct);
    formData.append("quantity", hasAttributeStock ? String(attributeStockTotal) : quantity);
    formData.append("bundle_size", isBundle ? String(bundleSizeValue) : "");
    formData.append("bundle_item_label", isBundle ? bundleLabel.trim() : "");
    formData.append("stock", String(effectiveInStock));
    // Unidades por combinación (0 si el campo está vacío).
    formData.append(
      "variants",
      JSON.stringify(
        variantKeys.map((variant_key) => ({
          variant_key,
          quantity: parseInt(variantQuantities[variant_key] ?? "", 10) || 0,
        })),
      ),
    );
    formData.append("price", price);
    formData.append("discount_price", discountPrice);
    formData.append("discount", discountValue.toString());
    formData.append("description", description.trim());
    formData.append("reference", reference.trim());
    formData.append(
      "attributes",
      JSON.stringify(
        selectedAttributeIds.map((id) => ({
          id,
          inventory: inventoryFlags[id] ?? defaultInventoryForType(getAttributeType(id)),
        })),
      ),
    );

    const catArray = Array.from(selectedCategories).map((id) => {
      const category = categories.find((c) => c.id === id);
      return { id, name: category?.name ?? "" };
    });
    formData.append("categories", JSON.stringify(catArray));

    const validSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
    formData.append("specs", JSON.stringify(validSpecs));
    // Con atributo de color, la galería sigue el orden de los colores.
    const orderedImages = colorAttribute
      ? [...orderedGroups.flatMap((group) => group.images), ...unassignedImages]
      : productImages;
    formData.append("images", JSON.stringify(orderedImages));
    formData.append(
      "color_images",
      JSON.stringify(
        colorAttribute ? orderedGroups.map((group, index) => ({ ...group, order: index })) : [],
      ),
    );

    onSubmit(product?.id ?? null, formData);
  };

  // Mismos obligatorios que exige el backend, para no enviar y recibir un 400.
  // Con atributo de color, al menos un color debe tener imagen.
  const hasColorImage = orderedGroups.some((group) => group.images.length > 0);
  const missingColorImage = Boolean(colorAttribute) && !hasColorImage;
  // Un set necesita variantes: el comprador elige color/talla de cada pieza.
  const bundleSizeValue = parseInt(bundleSize, 10) || 0;
  const isBundle = saleMode === "bundle";
  const bundleNeedsVariants = isBundle && !hasAttributeStock;
  const isBundleSizeValid =
    !isBundle || (bundleSizeValue >= MIN_BUNDLE_SIZE && bundleSizeValue <= MAX_BUNDLE_SIZE);
  const isValid =
    title.trim() !== "" &&
    price !== "" &&
    description.trim() !== "" &&
    imageProduct !== "" &&
    !missingColorImage &&
    !bundleNeedsVariants &&
    isBundleSizeValid;

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
                        <Label>Imagen principal *</Label>
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
                        <TextField
                          value={title}
                          onChange={(value) => setTitle(value.slice(0, MAX_TITLE_LENGTH))}
                          isRequired
                        >
                          <Label>Título del producto *</Label>
                          <Input placeholder="Ej: Producto increíble" maxLength={MAX_TITLE_LENGTH} />
                          <CharCounter length={title.length} max={MAX_TITLE_LENGTH} />
                        </TextField>

                        <TextField
                          value={reference}
                          onChange={(value) => setReference(value.slice(0, MAX_REFERENCE_LENGTH))}
                        >
                          <Label>Referencia</Label>
                          <Input placeholder="SKU-123" maxLength={MAX_REFERENCE_LENGTH} />
                          <CharCounter length={reference.length} max={MAX_REFERENCE_LENGTH} />
                        </TextField>
                      </div>
                    </div>

                    <TextField
                      value={description}
                      onChange={(value) => setDescription(value.slice(0, MAX_DESCRIPTION_LENGTH))}
                    >
                      <Label>Descripción del producto *</Label>
                      <TextArea
                        placeholder="Escribe la descripción del producto..."
                        className="min-h-24"
                        maxLength={MAX_DESCRIPTION_LENGTH}
                      />
                      <CharCounter length={description.length} max={MAX_DESCRIPTION_LENGTH} />
                    </TextField>
                  </FormSection>

                  <FormSection
                    title="Precio"
                    description={`En pesos colombianos, sin centavos. Máximo ${formatCOP(MAX_PRICE)}.`}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <TextField value={formatThousands(price)} onChange={handlePriceChange} isRequired>
                        <Label>Precio base *</Label>
                        <InputGroup>
                          <InputGroup.Prefix>
                            <span className="text-sm text-muted">$</span>
                          </InputGroup.Prefix>
                          <InputGroup.Input placeholder="0" inputMode="numeric" />
                        </InputGroup>
                      </TextField>

                      <TextField value={discount} onChange={handleDiscountChange} type="number">
                        <Label>Descuento (%)</Label>
                        <Input placeholder="0 a 100" min={0} max={100} />
                      </TextField>

                      <div className="space-y-2">
                        <Label>Precio final</Label>
                        <div className="flex h-10 items-center rounded-lg border border-border bg-surface-secondary px-3 font-medium text-foreground">
                          {discountPrice ? formatCOP(discountPrice) : "-"}
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Tipo de venta"
                    description="Por unidad, o como set de varias piezas del mismo producto que el comprador arma eligiendo color/talla de cada una. El precio es el del set completo."
                  >
                    <ToggleButtonGroup
                      selectionMode="single"
                      disallowEmptySelection
                      selectedKeys={new Set([saleMode])}
                      onSelectionChange={(keys) => {
                        const [next] = Array.from(keys, String);
                        if (next === "unit" || next === "bundle") setSaleMode(next);
                      }}
                    >
                      <ToggleButton id="unit">Por unidad</ToggleButton>
                      <ToggleButton id="bundle">Set de varias piezas</ToggleButton>
                    </ToggleButtonGroup>

                    {isBundle && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField
                          value={bundleSize}
                          onChange={(value) => {
                            const digits = toDigits(value);
                            setBundleSize(digits === "" ? "" : String(Math.min(Number(digits), MAX_BUNDLE_SIZE)));
                          }}
                          type="number"
                          isInvalid={!isBundleSizeValid}
                        >
                          <Label>Piezas por set *</Label>
                          <Input placeholder="3" min={MIN_BUNDLE_SIZE} max={MAX_BUNDLE_SIZE} />
                          <p className="mt-1 text-xs text-muted">
                            Entre {MIN_BUNDLE_SIZE} y {MAX_BUNDLE_SIZE}. Ej.: "Set x 3".
                          </p>
                        </TextField>

                        <TextField
                          value={bundleLabel}
                          onChange={(value) => setBundleLabel(value.slice(0, MAX_BUNDLE_LABEL_LENGTH))}
                        >
                          <Label>Nombre de cada pieza</Label>
                          <Input placeholder="Ej: esqueleto, camiseta" maxLength={MAX_BUNDLE_LABEL_LENGTH} />
                          <p className="mt-1 text-xs text-muted">
                            La tienda mostrará "{bundleLabel.trim() || "Unidad"} 1", "{bundleLabel.trim() || "Unidad"} 2"...
                          </p>
                        </TextField>
                      </div>
                    )}

                    {bundleNeedsVariants && (
                      <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                        Un set necesita al menos un atributo que controle inventario (color, talla...):
                        agrégalo en "Clasificación" para que el comprador pueda elegir cada pieza.
                      </p>
                    )}
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
                          isOpen={isAttributesPopoverOpen}
                          onOpenChange={setIsAttributesPopoverOpen}
                          disabledIds={disabledAttributeIds}
                        />
                        <p className="text-xs text-muted">
                          Solo un atributo por tipo (un Color, una Talla, etc.).
                        </p>
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
                      <ProductAttributeList
                        items={attributeItems}
                        onRemove={handleRemoveAttribute}
                        inventoryFlags={Object.fromEntries(
                          attributeItems.map((item) => [
                            item.id,
                            inventoryFlags[item.id] ?? defaultInventoryForType(item.type),
                          ]),
                        )}
                        onInventoryChange={handleInventoryChange}
                        parentId={inventoryAttributes[0]?.id}
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    title="Inventario"
                    description={
                      hasAttributeStock
                        ? "Las unidades se indican por combinación en la matriz; la cantidad y el stock del producto se calculan solos."
                        : `Cantidad de 0 a ${MAX_QUANTITY}. Con 0 unidades el producto queda sin stock automáticamente.`
                    }
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        value={hasAttributeStock ? String(attributeStockTotal) : quantity}
                        onChange={handleQuantityChange}
                        type="number"
                        isReadOnly={hasAttributeStock}
                      >
                        <Label>{hasAttributeStock ? "Cantidad total (calculada)" : "Cantidad"}</Label>
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
                                {hasAttributeStock
                                  ? effectiveInStock
                                    ? "Disponible (según variantes)"
                                    : "Sin stock (variantes en 0)"
                                  : isStockLocked
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

                    {hasAttributeStock && (
                      <div className="space-y-2">
                        <Label>Unidades por variante</Label>
                        <VariantMatrix
                          attributes={inventoryAttributes}
                          quantities={variantQuantities}
                          onChange={handleVariantChange}
                          onCopyParent={handleCopyParent}
                        />
                      </div>
                    )}
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
                          <div key={index} className="flex items-start gap-2">
                            <div className="flex-1">
                              <Input
                                aria-label="Nombre de la especificación"
                                placeholder="Ej: Código"
                                value={spec.key}
                                maxLength={MAX_SPEC_KEY_LENGTH}
                                onChange={(e) =>
                                  handleSpecChange(
                                    index,
                                    "key",
                                    e.target.value.slice(0, MAX_SPEC_KEY_LENGTH),
                                  )
                                }
                              />
                              <CharCounter length={spec.key.length} max={MAX_SPEC_KEY_LENGTH} />
                            </div>
                            <div className="flex-1">
                              <Input
                                aria-label="Valor de la especificación"
                                placeholder="Ej: DH63"
                                value={spec.value}
                                maxLength={MAX_SPEC_VALUE_LENGTH}
                                onChange={(e) =>
                                  handleSpecChange(
                                    index,
                                    "value",
                                    e.target.value.slice(0, MAX_SPEC_VALUE_LENGTH),
                                  )
                                }
                              />
                              <CharCounter length={spec.value.length} max={MAX_SPEC_VALUE_LENGTH} />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              isIconOnly
                              aria-label="Quitar especificación"
                              className="mt-0.5 shrink-0 text-danger"
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
                    {missingColorImage && (
                      <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                        Agrega al menos una imagen a alguno de los colores para poder guardar el producto.
                      </p>
                    )}
                    {colorAttribute ? (
                      <ColorImagesSection
                        colors={colorOptions}
                        groups={orderedGroups}
                        unassignedImages={unassignedImages}
                        onPickForColor={handlePickForColor}
                        onRemoveImage={handleRemoveImage}
                        onMove={handleMoveColor}
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
                  {missingColorImage && (
                    <span className="mr-auto self-center text-xs text-warning">
                      Falta una imagen de color
                    </span>
                  )}
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
            ? orderedGroups
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
        tone={pendingChange?.affectedImages ? "danger" : "accent"}
        title={
          pendingChange?.kind === "add-color"
            ? "Las imágenes generales se eliminarán"
            : "Reemplazar el atributo de color"
        }
        confirmLabel={pendingChange?.kind === "add-color" ? "Continuar" : "Reemplazar"}
        description={
          pendingChange ? (
            <div className="space-y-2">
              {pendingChange.kind === "add-color" ? (
                <p>
                  Al agregar el atributo de color <strong>«{pendingChange.nextColorName}»</strong>{" "}
                  las imágenes del producto pasan a relacionarse con cada color. Se eliminarán las{" "}
                  <strong>
                    {pendingChange.affectedImages}{" "}
                    {pendingChange.affectedImages === 1 ? "imagen general" : "imágenes generales"}
                  </strong>{" "}
                  que ya habías cargado.
                </p>
              ) : (
                <>
                  <p>
                    Un producto solo puede tener un atributo de color.{" "}
                    <strong>«{pendingChange.nextColorName}»</strong> reemplazará a{" "}
                    <strong>«{pendingChange.currentColorName}»</strong>.
                  </p>
                  {pendingChange.affectedImages > 0 && (
                    <p>
                      Se eliminarán del producto las{" "}
                      <strong>
                        {pendingChange.affectedImages}{" "}
                        {pendingChange.affectedImages === 1
                          ? "imagen relacionada"
                          : "imágenes relacionadas"}
                      </strong>{" "}
                      con sus colores.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null
        }
      />
    </>
  );
}
