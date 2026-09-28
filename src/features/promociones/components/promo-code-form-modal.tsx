"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Info, Shuffle, TicketPercent, X } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  InputGroup,
  Label,
  Modal,
  Switch,
  TextField,
  cn,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { PendingButton } from "@/components/shared/pending-button";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { ProductSelectGrid } from "@/components/shared/product-select-grid";
import { CharCounter, FormSection } from "@/features/productos/components/form-section";
import { MultiSelectPopover } from "@/features/productos/components/multi-select-popover";
import { formatCOP, formatThousands, toDigits } from "@/features/productos/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryAllCategories, useQueryAvailableProducts } from "@/app/api/queries";
import type { Products } from "@/interfaces/products";
import {
  MAX_PROMO_AMOUNT,
  MAX_PROMO_CODE_LENGTH,
  MAX_PROMO_DESCRIPTION_LENGTH,
  MAX_PROMO_PERCENTAGE,
  MAX_PROMO_USES,
  PROMO_CODE_REGEX,
  type PromoCode,
  type PromoCodePayload,
  type PromoCodeProduct,
  type PromoDiscountType,
  type PromoScope,
} from "@/interfaces/promo-codes";
import { describeDiscount, formatDay, generatePromoCode } from "../utils";

interface PromoCodeFormModalProps {
  /** null = crear, con valor = editar */
  promoCode: PromoCode | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (payload: PromoCodePayload) => void;
  isPending: boolean;
}

/** Botones de opción única (tipo de descuento, alcance). */
function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            aria-pressed={value === option.id}
            variant={value === option.id ? "primary" : "outline"}
            onPress={() => onChange(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Interruptor + campo numérico opcional (compra mínima, límite de usos). */
function OptionalNumber({
  label,
  enabled,
  onEnabledChange,
  value,
  onChange,
  prefix,
  hint,
}: {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  prefix?: ReactNode;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Switch isSelected={enabled} onChange={onEnabledChange} aria-label={`Activar ${label.toLowerCase()}`}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </div>
      <TextField value={formatThousands(value)} onChange={onChange} isDisabled={!enabled} aria-label={label}>
        <InputGroup>
          {prefix && <InputGroup.Prefix>{prefix}</InputGroup.Prefix>}
          <InputGroup.Input inputMode="numeric" placeholder={enabled ? "0" : "Sin límite"} />
        </InputGroup>
      </TextField>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

export function PromoCodeFormModal({
  promoCode,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: PromoCodeFormModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<PromoDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [scope, setScope] = useState<PromoScope>("all");
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<PromoCodeProduct[]>([]);
  const [includeDiscounted, setIncludeDiscounted] = useState(false);
  const [hasMinPurchase, setHasMinPurchase] = useState(false);
  const [minPurchase, setMinPurchase] = useState("");
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    setCode(promoCode?.code ?? generatePromoCode());
    setDescription(promoCode?.description ?? "");
    setDiscountType(promoCode?.discount_type ?? "percentage");
    setDiscountValue(promoCode ? String(promoCode.discount_value) : "");
    setScope(promoCode?.scope ?? "all");
    setCategoryIds(new Set(promoCode?.category_ids ?? []));
    setProducts(promoCode?.products ?? []);
    setIncludeDiscounted(promoCode?.include_discounted ?? false);
    setHasMinPurchase(promoCode?.min_purchase != null);
    setMinPurchase(promoCode?.min_purchase != null ? String(promoCode.min_purchase) : "");
    setHasMaxUses(promoCode?.max_uses != null);
    setMaxUses(promoCode?.max_uses != null ? String(promoCode.max_uses) : "");
    setStartsOn(promoCode?.starts_on ?? "");
    setExpiresOn(promoCode?.expires_on ?? "");
    setIsActive(promoCode?.is_active ?? true);
    setSearch("");
    setPage(1);
  }, [isOpen, promoCode]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data: categoriesData } = useQueryAllCategories(isOpen && scope === "categories");
  const categories = categoriesData?.categories ?? [];
  const { data: productsData, isLoading: isLoadingProducts, isPlaceholderData } = useQueryAvailableProducts(
    page,
    debouncedSearch,
    [],
    isOpen && scope === "products",
  );

  const maxValue = discountType === "percentage" ? MAX_PROMO_PERCENTAGE : MAX_PROMO_AMOUNT;
  const handleValueChange = (raw: string) => {
    const digits = toDigits(raw);
    setDiscountValue(digits === "" ? "" : String(Math.min(Number(digits), maxValue)));
  };
  const handleTypeChange = (type: PromoDiscountType) => {
    setDiscountType(type);
    setDiscountValue("");
  };
  const limitDigits = (max: number, setter: (value: string) => void) => (raw: string) => {
    const digits = toDigits(raw);
    setter(digits === "" ? "" : String(Math.min(Number(digits), max)));
  };

  const toggleProduct = (product: Products) =>
    setProducts((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, { id: product.id, title: product.title, image_product: product.image_product ?? null }],
    );

  const value = Number(discountValue);
  const errors = {
    code: !PROMO_CODE_REGEX.test(code),
    value: !discountValue || value < 1 || value > maxValue,
    scope:
      (scope === "categories" && categoryIds.size === 0) || (scope === "products" && products.length === 0),
    minPurchase: hasMinPurchase && (!minPurchase || Number(minPurchase) < 1),
    maxUses: hasMaxUses && (!maxUses || Number(maxUses) < 1),
    dates: Boolean(startsOn && expiresOn && expiresOn < startsOn),
  };
  const isValid = !Object.values(errors).some(Boolean);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({
      code,
      description: description.trim(),
      discount_type: discountType,
      discount_value: value,
      scope,
      category_ids: scope === "categories" ? [...categoryIds] : [],
      product_ids: scope === "products" ? products.map((product) => product.id) : [],
      include_discounted: includeDiscounted,
      min_purchase: hasMinPurchase ? Number(minPurchase) : null,
      max_uses: hasMaxUses ? Number(maxUses) : null,
      starts_on: startsOn || null,
      expires_on: expiresOn || null,
      is_active: isActive,
    });
  };

  // Resumen en lenguaje natural de cómo funcionará el código.
  const scopeText =
    scope === "all"
      ? "en toda la tienda"
      : scope === "categories"
        ? categoryIds.size > 0
          ? `en ${categories.filter((category) => categoryIds.has(category.id)).map((category) => category.name).join(", ") || `${categoryIds.size} categorías`}`
          : "en las categorías que elijas"
        : products.length > 0
          ? `en ${products.length} ${products.length === 1 ? "producto" : "productos"}`
          : "en los productos que elijas";
  const summary = [
    `Quien escriba ${code || "el código"} en el carrito obtiene ${
      discountValue && !errors.value ? describeDiscount({ discount_type: discountType, discount_value: value }) : "un descuento"
    } de descuento ${scopeText}${discountType === "fixed" ? " (una sola vez por compra)" : ""}.`,
    includeDiscounted
      ? "También aplica a productos que ya tienen su propio descuento."
      : "No aplica a productos que ya tienen su propio descuento.",
    hasMinPurchase && minPurchase ? `Compra mínima de ${formatCOP(minPurchase)}.` : null,
    startsOn && expiresOn
      ? `Válido del ${formatDay(startsOn)} al ${formatDay(expiresOn)} (incluidos).`
      : expiresOn
        ? `Válido hasta el ${formatDay(expiresOn)} (incluido).`
        : startsOn
          ? `Válido desde el ${formatDay(startsOn)}, sin vencimiento.`
          : "Sin fecha de vencimiento.",
    hasMaxUses && maxUses ? `Se puede usar ${formatThousands(maxUses)} ${maxUses === "1" ? "vez" : "veces"} en total.` : "Usos ilimitados.",
    isActive ? null : "Quedará pausado hasta que lo actives.",
  ].filter(Boolean);

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="contents">
              <ModalFormHeader
                icon={TicketPercent}
                title={promoCode ? "Editar código promocional" : "Crear código promocional"}
                description="Tus clientes escriben el código al pagar y el descuento se calcula automáticamente."
              />

              <Modal.Body className="space-y-4">
                <FormSection title="Código">
                  <TextField
                    value={code}
                    onChange={(raw) => setCode(raw.toUpperCase().replace(/\s/g, "").slice(0, MAX_PROMO_CODE_LENGTH))}
                    isRequired
                    isInvalid={code !== "" && errors.code}
                  >
                    <Label>Código que escribirá el cliente</Label>
                    <InputGroup>
                      <InputGroup.Input
                        placeholder="Ej: VERANO20"
                        className="font-mono tracking-wide uppercase"
                        maxLength={MAX_PROMO_CODE_LENGTH}
                      />
                      <InputGroup.Suffix>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onPress={() => setCode(generatePromoCode())}
                          aria-label="Generar código aleatorio"
                        >
                          <Shuffle className="size-4" />
                          Generar
                        </Button>
                      </InputGroup.Suffix>
                    </InputGroup>
                    <p className={cn("mt-1 text-xs", code !== "" && errors.code ? "text-danger" : "text-muted")}>
                      3 a 20 caracteres: letras, números, guion (-) o guion bajo (_). No distingue mayúsculas.
                    </p>
                  </TextField>

                  <TextField
                    value={description}
                    onChange={(raw) => setDescription(raw.slice(0, MAX_PROMO_DESCRIPTION_LENGTH))}
                  >
                    <Label>Nota interna (opcional)</Label>
                    <Input placeholder="Ej: Campaña de Instagram de octubre" maxLength={MAX_PROMO_DESCRIPTION_LENGTH} />
                    <CharCounter length={description.length} max={MAX_PROMO_DESCRIPTION_LENGTH} />
                  </TextField>
                </FormSection>

                <FormSection title="Descuento">
                  <ChoiceGroup
                    label="Tipo de descuento"
                    value={discountType}
                    onChange={handleTypeChange}
                    options={[
                      { id: "percentage", label: "Porcentaje (%)" },
                      { id: "fixed", label: "Valor fijo ($)" },
                    ]}
                  />
                  <TextField
                    value={discountType === "fixed" ? formatThousands(discountValue) : discountValue}
                    onChange={handleValueChange}
                    isRequired
                  >
                    <Label>{discountType === "percentage" ? "Porcentaje de descuento" : "Valor del descuento"}</Label>
                    <InputGroup>
                      {discountType === "fixed" && (
                        <InputGroup.Prefix>
                          <span className="text-sm text-muted">$</span>
                        </InputGroup.Prefix>
                      )}
                      <InputGroup.Input inputMode="numeric" placeholder={discountType === "percentage" ? "Ej: 15" : "Ej: 20.000"} />
                      {discountType === "percentage" && (
                        <InputGroup.Suffix>
                          <span className="text-sm text-muted">%</span>
                        </InputGroup.Suffix>
                      )}
                    </InputGroup>
                    <p className="mt-1 text-xs text-muted">
                      {discountType === "percentage"
                        ? `Entre 1 y ${MAX_PROMO_PERCENTAGE} %. Se aplica sobre los productos a los que alcanza el código.`
                        : "Se resta una vez del total de esos productos (nunca más de lo que valen)."}
                    </p>
                  </TextField>
                </FormSection>

                <FormSection title="¿A qué productos aplica?">
                  <ChoiceGroup
                    label="Alcance"
                    value={scope}
                    onChange={setScope}
                    options={[
                      { id: "all", label: "Toda la tienda" },
                      { id: "categories", label: "Categorías" },
                      { id: "products", label: "Productos específicos" },
                    ]}
                  />

                  {scope === "categories" && (
                    <div className="space-y-2">
                      <Label>Categorías *</Label>
                      <MultiSelectPopover
                        options={categories.map((category) => ({
                          id: category.id,
                          label: category.name,
                          hint: `${category.productCount ?? 0} productos`,
                        }))}
                        selectedIds={categoryIds}
                        onChange={setCategoryIds}
                        placeholder="Selecciona categorías"
                        emptyMessage="Aún no tienes categorías"
                        itemNoun={{ singular: "categoría", plural: "categorías" }}
                      />
                      <p className="text-xs text-muted">
                        Incluye también los productos que agregues después a esas categorías.
                      </p>
                    </div>
                  )}

                  {scope === "products" && (
                    <div className="space-y-3">
                      <Label>Productos seleccionados ({products.length})</Label>
                      {products.length === 0 ? (
                        <p className="rounded-lg border border-border p-3 text-sm text-muted">
                          Aún no has seleccionado productos
                        </p>
                      ) : (
                        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border p-3">
                          {products.map((product) => (
                            <span
                              key={product.id}
                              className="inline-flex max-w-full items-center gap-2 rounded-full bg-accent-soft py-1 pr-2 pl-1 text-xs text-accent-soft-foreground"
                            >
                              {product.image_product ? (
                                <ImageWithSkeleton
                                  src={product.image_product}
                                  alt=""
                                  sizes="24px"
                                  className="size-6 shrink-0 rounded-full"
                                />
                              ) : (
                                <span className="size-6 shrink-0 rounded-full bg-surface-secondary" />
                              )}
                              <span className="truncate">{product.title}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setProducts((current) => current.filter((item) => item.id !== product.id))
                                }
                                aria-label={`Quitar ${product.title}`}
                              >
                                <X className="size-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <TextField value={search} onChange={setSearch}>
                        <Label>Buscar producto por título</Label>
                        <Input placeholder="Buscar por título..." maxLength={30} />
                      </TextField>
                      <ProductSelectGrid
                        products={productsData?.products ?? []}
                        selectedIds={products.map((product) => product.id)}
                        onSelect={toggleProduct}
                        currentPage={page}
                        totalPages={productsData?.totalPages ?? 1}
                        onPageChange={setPage}
                        isLoading={isLoadingProducts}
                        isRefreshing={isPlaceholderData}
                      />
                    </div>
                  )}

                  <Checkbox isSelected={includeDiscounted} onChange={setIncludeDiscounted}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>Aplicar también a productos que ya tienen descuento</Label>
                    </Checkbox.Content>
                  </Checkbox>
                  <p className="-mt-2 text-xs text-muted">
                    Desmarcado, los productos en oferta se cobran a su precio de oferta y el código no los rebaja más.
                  </p>
                </FormSection>

                <FormSection
                  title="Vigencia y límites"
                  description="Todo es opcional. Las fechas son días completos en hora de Colombia."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        { label: "Fecha de inicio", value: startsOn, set: setStartsOn },
                        { label: "Fecha de fin", value: expiresOn, set: setExpiresOn },
                      ] as const
                    ).map((field) => (
                      <div key={field.label} className="space-y-1">
                        <DatePickerField label={field.label} value={field.value} onChange={field.set} />
                        {field.value ? (
                          <button
                            type="button"
                            onClick={() => field.set("")}
                            className="text-xs text-accent hover:underline"
                          >
                            Quitar fecha
                          </button>
                        ) : (
                          <p className="text-xs text-muted">
                            {field.label === "Fecha de inicio" ? "Vacío = desde ya" : "Vacío = no vence"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.dates && (
                    <p className="text-xs text-danger">La fecha de fin no puede ser anterior a la de inicio.</p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptionalNumber
                      label="Compra mínima"
                      enabled={hasMinPurchase}
                      onEnabledChange={setHasMinPurchase}
                      value={minPurchase}
                      onChange={limitDigits(MAX_PROMO_AMOUNT, setMinPurchase)}
                      prefix={<span className="text-sm text-muted">$</span>}
                      hint="Subtotal del carrito necesario para usar el código."
                    />
                    <OptionalNumber
                      label="Límite de usos"
                      enabled={hasMaxUses}
                      onEnabledChange={setHasMaxUses}
                      value={maxUses}
                      onChange={limitDigits(MAX_PROMO_USES, setMaxUses)}
                      hint={
                        promoCode
                          ? `Compras totales con este código. Ya se usó ${promoCode.uses_count} ${promoCode.uses_count === 1 ? "vez" : "veces"}.`
                          : "Compras totales con este código, entre todos los clientes."
                      }
                    />
                  </div>

                  <Switch isSelected={isActive} onChange={setIsActive}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>{isActive ? "Activo" : "Pausado"}</Label>
                    </Switch.Content>
                  </Switch>
                </FormSection>

                <div className="flex gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">Así funcionará</p>
                    {summary.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="ghost" type="button" isDisabled={isPending} onPress={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <PendingButton
                  variant="primary"
                  type="submit"
                  isDisabled={!isValid}
                  isPending={isPending}
                  pendingLabel="Guardando"
                >
                  {promoCode ? "Guardar cambios" : "Crear código"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
