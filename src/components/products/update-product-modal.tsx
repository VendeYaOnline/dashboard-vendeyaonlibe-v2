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
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Plus, Trash2, ChevronDown } from "lucide-react";
import { GalleryModal } from "./gallery-modal";
import { useQueryAttribute, useQueryCategories } from "@/app/api/queries";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Products } from "@/interfaces/products";

interface Spec {
  key: string;
  value: string;
}

interface UpdateProductModalProps {
  product: Products | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProduct: (id: number, data: FormData) => void;
  isLoading: boolean;
}

export function UpdateProductModal({
  product,
  open,
  onOpenChange,
  onUpdateProduct,
  isLoading,
}: UpdateProductModalProps) {
  const [imageProduct, setImageProduct] = useState<string>("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [stock, setStock] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [productImages, setProductImages] = useState<string[]>([]);

  const [isMainImageGalleryOpen, setIsMainImageGalleryOpen] = useState(false);
  const [isProductImagesGalleryOpen, setIsProductImagesGalleryOpen] = useState(false);

  const { data: attrData } = useQueryAttribute(1, "");
  const { data: catData } = useQueryCategories(1, "");

  const attributes = attrData?.attributes || [];
  const categories = catData?.categories || [];

  useEffect(() => {
    if (open && product) {
      setImageProduct(product.image_product || "");
      setTitle(product.title || "");
      setPrice(product.price ? product.price.toString() : "");
      setDiscount(product.discount ? product.discount.toString() : "");
      setDescription(product.description || "");
      setReference(product.reference || "");
      setStock(product.quantity ? product.quantity.toString() : "0");
      setProductImages(product.images || []);

      try {
        if (product.specs) {
          setSpecs(typeof product.specs === "string" ? JSON.parse(product.specs) : product.specs);
        } else {
          setSpecs([]);
        }
      } catch (e) {
        setSpecs([]);
      }

      try {
        if (product.attributes) {
          const parsedAttr = typeof product.attributes === "string" ? JSON.parse(product.attributes) : product.attributes;
          setSelectedAttributes(new Set(Array.isArray(parsedAttr) ? parsedAttr.map(Number) : []));
        } else {
          setSelectedAttributes(new Set());
        }
      } catch (e) {
        setSelectedAttributes(new Set());
      }

      const cats = Array.isArray(product.Categories) ? product.Categories.map(c => Number(c.id)) : [];
      setSelectedCategories(new Set(cats));
    }
  }, [open, product]);

  const discountValue = parseInt(discount) || 0;
  const priceValue = parseFloat(price) || 0;
  const discountPrice = discountValue > 0 
    ? (priceValue - (priceValue * discountValue) / 100).toFixed(2)
    : priceValue > 0 ? priceValue.toFixed(2) : "";

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === "") {
        setDiscount("");
        return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setDiscount(num.toString());
    }
  };

  const handleAddSpec = () => {
    if (specs.length >= 5) return;
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

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
    
    const catArray = Array.from(selectedCategories).map(id => {
      const cat = categories.find(c => c.id === id);
      return { id, name: cat?.name || "" };
    });
    formData.append("categories", JSON.stringify(catArray));
    
    const validSpecs = specs.filter(s => s.key.trim() && s.value.trim());
    formData.append("specs", JSON.stringify(validSpecs));
    
    formData.append("images", JSON.stringify(productImages));

    onUpdateProduct(product.id, formData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
              Editar Producto
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            
            <div className="space-y-2">
              <Label>Imagen principal del producto</Label>
              <div 
                className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden relative"
                onClick={() => setIsMainImageGalleryOpen(true)}
              >
                {imageProduct ? (
                  <img src={imageProduct} alt="Main" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Seleccionar</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del producto *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Producto increíble"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Referencia</Label>
                <Input
                  id="reference"
                  placeholder="SKU-123"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio base *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 a 100"
                  value={discount}
                  onChange={handleDiscountChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Precio final con descuento</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted/30 text-muted-foreground flex items-center">
                  {discountPrice ? `$${discountPrice}` : "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 px-1">
              <Label>Categorías</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedCategories.size > 0 
                      ? `${selectedCategories.size} categorías seleccionadas` 
                      : "Seleccionar categorías"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60">
                  {categories.length > 0 ? categories.map((cat) => (
                    <DropdownMenuCheckboxItem
                      key={cat.id}
                      checked={cat.id ? selectedCategories.has(cat.id) : false}
                      onCheckedChange={(checked) => {
                        if (!cat.id) return;
                        const newSet = new Set(selectedCategories);
                        if (checked) newSet.add(cat.id);
                        else newSet.delete(cat.id);
                        setSelectedCategories(newSet);
                      }}
                    >
                      {cat.name}
                    </DropdownMenuCheckboxItem>
                  )) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">No hay categorías</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 px-1">
              <Label>Atributos</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedAttributes.size > 0 
                      ? `${selectedAttributes.size} atributos seleccionados` 
                      : "Seleccionar atributos"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60">
                  {attributes.length > 0 ? attributes.map((attr) => (
                    <DropdownMenuCheckboxItem
                      key={attr.id}
                      checked={attr.id ? selectedAttributes.has(attr.id) : false}
                      onCheckedChange={(checked) => {
                        if (!attr.id) return;
                        const newSet = new Set(selectedAttributes);
                        if (checked) newSet.add(attr.id);
                        else newSet.delete(attr.id);
                        setSelectedAttributes(newSet);
                      }}
                    >
                      {attr.attribute_name}
                    </DropdownMenuCheckboxItem>
                  )) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">No hay atributos</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción del producto</Label>
              <Textarea
                id="description"
                placeholder="Escribe la descripción del producto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Especificaciones (Máx. 5)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddSpec}
                  disabled={specs.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input 
                      placeholder="Ej: Color" 
                      value={spec.key} 
                      onChange={(e) => handleSpecChange(idx, "key", e.target.value)} 
                    />
                    <Input 
                      placeholder="Ej: Rojo" 
                      value={spec.value} 
                      onChange={(e) => handleSpecChange(idx, "value", e.target.value)} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleRemoveSpec(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Imágenes del producto (Máx. 5)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsProductImagesGalleryOpen(true)}
                  disabled={productImages.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {productImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border group">
                    <img src={img} alt="Product Image" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      onClick={() => setProductImages(productImages.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !title.trim() || !price || !stock}>
                {isLoading ? "Actualizando..." : "Actualizar Producto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <GalleryModal
        open={isMainImageGalleryOpen}
        onOpenChange={setIsMainImageGalleryOpen}
        multiple={false}
        currentSelected={imageProduct ? [imageProduct] : []}
        onSelect={(urls) => {
          if (urls.length > 0) setImageProduct(urls[0]);
        }}
      />

      <GalleryModal
        open={isProductImagesGalleryOpen}
        onOpenChange={setIsProductImagesGalleryOpen}
        multiple={true}
        maxSelection={5}
        currentSelected={productImages}
        disabledUrls={imageProduct ? [imageProduct] : []}
        onSelect={(urls) => {
          setProductImages(urls.slice(0, 5));
        }}
      />
    </>
  );
}
