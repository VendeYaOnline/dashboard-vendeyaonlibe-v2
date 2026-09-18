"use client";

import { useEffect, useState } from "react";
import { ReceiptText, ShoppingCart, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import type { Products } from "@/interfaces/products";
import {
  EMPTY_VENTA_FORM,
  PAYMENT_METHODS,
  SALE_STATUSES,
  type CreateSalePayload,
  type SelectedProduct,
  type VentaFormValues,
} from "../types";
import { DEPARTMENTS_AND_CITIES } from "../colombia";
import { SelectCatalogProductModal } from "./select-catalog-product-modal";
import { PendingButton } from "@/components/shared/pending-button";

interface VentaFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (payload: CreateSalePayload) => void;
  isPending: boolean;
}

/** Campo de texto simple para no repetir el trío TextField/Label/Input. */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date";
  className?: string;
}) {
  return (
    <TextField value={value} onChange={onChange} type={type} className={className}>
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
    </TextField>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="border-b border-border pb-2 text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/** Precio unitario efectivo: con descuento si el producto tiene uno activo. */
const unitPrice = (product: Products) =>
  product.discount > 0
    ? parseFloat(product.discount_price) || 0
    : parseFloat(product.price) || 0;

export function VentaFormModal({
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: VentaFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [form, setForm] = useState<VentaFormValues>(EMPTY_VENTA_FORM);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_VENTA_FORM);
      setProducts([]);
    }
  }, [isOpen]);

  const setField = <K extends keyof VentaFormValues>(key: K, value: VentaFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Al cambiar de departamento la ciudad deja de ser válida.
  const handleDepartmentChange = (department: string) =>
    setForm((prev) => ({ ...prev, department, city: "" }));

  const availableCities: string[] = form.department
    ? (DEPARTMENTS_AND_CITIES[form.department] ?? [])
    : [];

  const handleAddProduct = (product: Products, quantity: number) => {
    setProducts((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsProductPickerOpen(false);
  };

  const total = products.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);

  const isValid = products.length > 0 && form.status !== "" && form.paymentMethod !== "";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    // Snapshot plano (no anidado): así es como el backend guarda `products`
    // en la venta — ver SaleProduct en ../types.
    const items = products.map((product) => ({
      id: product.id,
      image_product: product.image_product,
      title: product.title,
      price: product.price,
      discount_price: product.discount_price,
      discount: product.discount,
      images: product.images,
      quantity: product.quantity,
      purchase_total: (unitPrice(product) * product.quantity).toFixed(2),
    }));

    const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

    onSubmit({
      id_number: form.idNumber,
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
      department: form.department,
      city: form.city,
      address: form.address,
      additional_info: form.additionalReferences,
      email: form.email,
      order_number: form.orderNumber,
      products: items,
      quantity: totalQuantity.toString(),
      status: form.status,
      purchase_date: form.date,
      type_purchase: "local",
      payment_method: form.paymentMethod,
      total: total.toFixed(2),
    });
  };

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop isDismissable={!isPending}>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-3xl">
              <form onSubmit={handleSubmit}>
                <ModalFormHeader
                  icon={ReceiptText}
                  title="Crear venta"
                  description="Registra manualmente un pedido recibido fuera de la tienda."
                />

                <Modal.Body className="space-y-6">
                  <Section title="Información del cliente">
                    <Field
                      label="Fecha"
                      type="date"
                      value={form.date}
                      onChange={(v) => setField("date", v)}
                    />
                    <Field
                      label="Teléfono móvil"
                      type="tel"
                      placeholder="300 123 4567"
                      value={form.phone}
                      onChange={(v) => setField("phone", v)}
                    />
                    <Field
                      label="Nombres"
                      placeholder="Juan"
                      value={form.firstName}
                      onChange={(v) => setField("firstName", v)}
                    />
                    <Field
                      label="Apellidos"
                      placeholder="Pérez García"
                      value={form.lastName}
                      onChange={(v) => setField("lastName", v)}
                    />
                    <Field
                      label="Email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={form.email}
                      onChange={(v) => setField("email", v)}
                    />
                    <Field
                      label="Número de cédula"
                      placeholder="123456789"
                      value={form.idNumber}
                      onChange={(v) => setField("idNumber", v)}
                    />
                  </Section>

                  <Section title="Ubicación">
                    <Select
                      selectedKey={form.department || null}
                      onSelectionChange={(key) => handleDepartmentChange(String(key))}
                    >
                      <Label>Departamento</Label>
                      <Select.Trigger>
                        {form.department ? (
                          <Select.Value />
                        ) : (
                          <span className="text-muted">Seleccionar departamento</span>
                        )}
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {Object.keys(DEPARTMENTS_AND_CITIES).map((department) => (
                            <ListBoxItem key={department} id={department}>
                              {department}
                            </ListBoxItem>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <Select
                      selectedKey={form.city || null}
                      onSelectionChange={(key) => setField("city", String(key))}
                      isDisabled={!form.department}
                    >
                      <Label>Ciudad</Label>
                      <Select.Trigger>
                        {form.city ? (
                          <Select.Value />
                        ) : (
                          <span className="text-muted">Seleccionar ciudad</span>
                        )}
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {availableCities.map((city) => (
                            <ListBoxItem key={city} id={city}>
                              {city}
                            </ListBoxItem>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <Field
                      label="Dirección"
                      placeholder="Calle 9 #1-39"
                      value={form.address}
                      onChange={(v) => setField("address", v)}
                    />

                    <TextField
                      value={form.additionalReferences}
                      onChange={(v) => setField("additionalReferences", v)}
                    >
                      <Label>Referencias adicionales</Label>
                      <TextArea placeholder="Barrio, punto de referencia, etc." rows={1} />
                    </TextField>
                  </Section>

                  <Section title="Detalles del pedido">
                    <Field
                      label="Número de orden"
                      placeholder="ORD-2025-001"
                      value={form.orderNumber}
                      onChange={(v) => setField("orderNumber", v)}
                    />

                    <Select
                      selectedKey={form.status || null}
                      onSelectionChange={(key) => setField("status", String(key))}
                    >
                      <Label>Estado</Label>
                      <Select.Trigger>
                        {form.status ? (
                          <Select.Value />
                        ) : (
                          <span className="text-muted">Seleccionar estado</span>
                        )}
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {SALE_STATUSES.map((status) => (
                            <ListBoxItem key={status.id} id={status.id}>
                              {status.label}
                            </ListBoxItem>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Productos</Label>
                      <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        className="justify-start"
                        onPress={() => setIsProductPickerOpen(true)}
                      >
                        <ShoppingCart className="size-4" />
                        Seleccionar productos
                      </Button>

                      {products.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-border p-3">
                          <p className="text-sm font-medium">Productos seleccionados:</p>
                          {products.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between rounded bg-surface-secondary p-2"
                            >
                              <div className="flex items-center gap-3">
                                {product.image_product ? (
                                  <img
                                    src={product.image_product}
                                    alt={product.title}
                                    className="size-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="flex size-10 items-center justify-center rounded bg-surface text-[10px] text-muted">
                                    Sin img
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">{product.title}</p>
                                  <p className="text-xs text-muted">
                                    Cantidad: {product.quantity} × $
                                    {unitPrice(product).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                isIconOnly
                                aria-label={`Quitar ${product.title}`}
                                className="text-danger"
                                onPress={() =>
                                  setProducts((prev) =>
                                    prev.filter((item) => item.id !== product.id),
                                  )
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Select
                      selectedKey={form.paymentMethod || null}
                      onSelectionChange={(key) => setField("paymentMethod", String(key))}
                    >
                      <Label>Método de pago</Label>
                      <Select.Trigger>
                        {form.paymentMethod ? (
                          <Select.Value />
                        ) : (
                          <span className="text-muted">Seleccionar método</span>
                        )}
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {PAYMENT_METHODS.map((method) => (
                            <ListBoxItem key={method.id} id={method.id}>
                              {method.label}
                            </ListBoxItem>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <div className="space-y-2">
                      <Label>Total</Label>
                      <div className="flex h-10 items-center rounded-lg border border-border bg-surface-secondary px-3 font-semibold">
                        ${total.toFixed(2)}
                      </div>
                    </div>
                  </Section>
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
                  <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={isPending}>
                    {"Crear venta"}
                  </PendingButton>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <SelectCatalogProductModal
        isOpen={isProductPickerOpen}
        onOpenChange={setIsProductPickerOpen}
        onAdd={handleAddProduct}
      />
    </>
  );
}
