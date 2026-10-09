"use client";

import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileSpreadsheet, RotateCcw } from "lucide-react";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  Spinner,
  Switch,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { PendingButton } from "@/components/shared/pending-button";
import { useQueryAllCategories, useQueryMetaCatalogSummary } from "@/app/api/queries";
import { useMutationDownloadMetaCatalog } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { MetaCatalogFilters } from "@/interfaces/catalog";
import { formatThousands, toDigits } from "../utils";
import { FormSection } from "./form-section";
import { MultiSelectPopover } from "./multi-select-popover";

interface ExportarCatalogoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/** Sin filtros: productos visibles en la tienda con unidades en alguna variante. */
const DEFAULT_FILTERS: MetaCatalogFilters = {
  categoryIds: [],
  includeOutOfStock: false,
  discountedOnly: false,
  minPrice: "",
  maxPrice: "",
  storeUrl: "",
  brand: "",
};

/** Mismo tope de precio que el servidor (100 millones), para no pedir un resumen que fallaría. */
const MAX_PRICE_DIGITS = 100_000_000;
const clampPrice = (digits: string) =>
  Number(digits) > MAX_PRICE_DIGITS ? String(MAX_PRICE_DIGITS) : digits;

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count.toLocaleString("es-CO")} ${count === 1 ? singular : pluralForm}`;

/** Guarda el archivo en el equipo del usuario. */
const saveFile = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** http(s)://dominio: lo mínimo para que el servidor acepte la dirección. */
const isValidStoreUrl = (value: string) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/**
 * Exporta los productos en el archivo (CSV) que pide Meta Commerce Manager para
 * crear anuncios de catálogo en Facebook e Instagram. Los filtros son
 * opcionales; con los de defecto sale todo lo que se puede vender hoy. El
 * resumen se recalcula en el servidor al cambiar cualquier filtro, así lo que
 * se ve es exactamente lo que trae el archivo.
 */
export function ExportarCatalogoModal({ isOpen, onOpenChange }: ExportarCatalogoModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const [filters, setFilters] = useState<MetaCatalogFilters>(DEFAULT_FILTERS);
  // Una dirección a medio escribir no se envía: no tiene sentido pedir un resumen con ella.
  const storeUrlInvalid = filters.storeUrl !== "" && !isValidStoreUrl(filters.storeUrl);
  const queryFilters = useMemo(
    () => (storeUrlInvalid ? { ...filters, storeUrl: "" } : filters),
    [filters, storeUrlInvalid],
  );
  const debounced = useDebouncedValue(queryFilters, 500);

  const set = <K extends keyof MetaCatalogFilters>(key: K, value: MetaCatalogFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const { data: categoriesData } = useQueryAllCategories(isOpen);
  const categories = categoriesData?.categories ?? [];

  const rangeInvalid =
    filters.minPrice !== "" && filters.maxPrice !== "" && Number(filters.minPrice) > Number(filters.maxPrice);
  const {
    data: summary,
    error,
    isLoading,
    isFetching,
  } = useQueryMetaCatalogSummary(debounced, isOpen && !rangeInvalid);
  const downloadMutation = useMutationDownloadMetaCatalog();

  const isCalculating = !rangeInvalid && (debounced !== queryFilters || isFetching);
  const errorMessage = error
    ? (isAxiosError(error) && error.response?.data?.message) || "No se pudo calcular el catálogo. Inténtalo de nuevo."
    : null;
  const isDefault = JSON.stringify({ ...filters, storeUrl: "" }) === JSON.stringify({ ...DEFAULT_FILTERS });
  // La dirección de la tienda solo se pide si la empresa no la tiene guardada.
  const showStoreUrlInput = summary ? summary.storeUrlSource !== "saved" : filters.storeUrl !== "";
  const canDownload =
    !!summary && summary.items > 0 && !!summary.storeUrl && !storeUrlInvalid && !errorMessage && !rangeInvalid && !isCalculating;

  const handleDownload = () =>
    downloadMutation.mutate(queryFilters, {
      onSuccess: (blob) => {
        saveFile(blob, `catalogo-meta-${today()}.csv`);
        toast.success("Catálogo descargado. Ya puedes subirlo a Meta Commerce Manager.");
      },
      onError: (downloadError) => handleAxiosError(downloadError, "No se pudo generar el archivo del catálogo"),
    });

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!downloadMutation.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="max-w-2xl">
            <ModalFormHeader
              icon={FileSpreadsheet}
              title="Exportar catálogo para Meta"
              description="Descarga un archivo listo para importar en Meta Commerce Manager y crear anuncios de Facebook e Instagram que llevan a cada producto."
            />

            <Modal.Body className="space-y-4">
              {/* Resultado: se actualiza solo al cambiar los filtros. */}
              <section
                className="space-y-2 rounded-xl border border-border bg-surface p-4"
                aria-live="polite"
                aria-busy={isCalculating}
              >
                {errorMessage ? (
                  <p className="flex items-start gap-2 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {errorMessage}
                  </p>
                ) : rangeInvalid ? (
                  <p className="flex items-start gap-2 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    El precio mínimo no puede ser mayor que el máximo.
                  </p>
                ) : isLoading || !summary ? (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Spinner size="sm" />
                    Calculando productos...
                  </p>
                ) : (
                  <div className={isCalculating ? "space-y-2 opacity-60 transition-opacity" : "space-y-2 transition-opacity"}>
                    <p className="flex items-center gap-2 text-base font-semibold">
                      {summary.items > 0 ? (
                        <CheckCircle2 className="size-5 shrink-0 text-success" />
                      ) : (
                        <AlertTriangle className="size-5 shrink-0 text-warning" />
                      )}
                      {summary.items > 0
                        ? `Se exportarán ${plural(summary.products, "producto", "productos")}`
                        : "Ningún producto cumple estos filtros"}
                      {isCalculating && <Spinner size="sm" />}
                    </p>
                    {summary.items > 0 && (
                      <ul className="list-disc space-y-1 pl-6 text-sm text-muted">
                        {summary.items !== summary.products && (
                          <li>
                            El archivo tiene {plural(summary.items, "fila", "filas")}: los productos con variantes
                            (talla, color...) llevan una fila por variante, agrupadas bajo el mismo producto.
                          </li>
                        )}
                        {summary.outOfStockItems > 0 && (
                          <li>
                            {plural(summary.outOfStockItems, "variante sin unidades", "variantes sin unidades")} se
                            marca{summary.outOfStockItems === 1 ? "" : "n"} como agotada
                            {summary.outOfStockItems === 1 ? "" : "s"}: Meta no la{summary.outOfStockItems === 1 ? "" : "s"}{" "}
                            anuncia.
                          </li>
                        )}
                      </ul>
                    )}
                    {summary.hiddenProducts > 0 && (
                      <p className="text-xs text-muted">
                        {plural(summary.hiddenProducts, "producto oculto", "productos ocultos")} en tu tienda no se
                        exporta{summary.hiddenProducts === 1 ? "" : "n"}: su enlace no abriría.
                      </p>
                    )}
                    {summary.problemProducts.length > 0 && (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                        <p className="flex items-center gap-2 font-medium">
                          <AlertTriangle className="size-4 shrink-0" />
                          {plural(
                            summary.problems.noImage + summary.problems.badImage + summary.problems.invalidPrice,
                            "producto no se puede exportar",
                            "productos no se pueden exportar",
                          )}
                          . Corrígelos y vuelve a descargar:
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-9">
                          {summary.problemProducts.slice(0, 5).map((problem) => (
                            <li key={problem.id}>
                              <span className="font-medium">{problem.title}</span>: {problem.reason}
                            </li>
                          ))}
                        </ul>
                        {summary.problemProducts.length > 5 && (
                          <p className="mt-1 pl-9">y {summary.problemProducts.length - 5} más.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <FormSection
                title="Enlaces de tus productos"
                description="Meta lleva a tus clientes a la página del producto en tu tienda."
              >
                {showStoreUrlInput && (
                  <TextField
                    value={filters.storeUrl}
                    onChange={(value) => set("storeUrl", value.trim())}
                    isInvalid={storeUrlInvalid}
                    isRequired
                  >
                    <Label>Dirección de tu tienda</Label>
                    <InputGroup>
                      <InputGroup.Input inputMode="url" placeholder="https://mitienda.com" maxLength={200} />
                    </InputGroup>
                    <p className={`mt-1 text-xs ${storeUrlInvalid ? "text-danger" : "text-muted"}`}>
                      {storeUrlInvalid
                        ? "Escríbela completa, empezando por https:// (ejemplo: https://mitienda.com)."
                        : "Aún no la tenemos guardada. Escríbela completa, empezando por https://"}
                    </p>
                  </TextField>
                )}
                {summary?.sampleLink && (
                  <p className="text-xs text-muted">
                    Así quedará el enlace de un producto:{" "}
                    <a
                      href={summary.sampleLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-medium text-accent hover:underline"
                    >
                      {summary.sampleLink}
                    </a>
                    . Ábrelo para comprobar que lleva al producto; si no, escribe a VendeYaOnline para ajustar la ruta.
                  </p>
                )}
              </FormSection>

              <FormSection
                title="Filtros (opcionales)"
                description="Sin filtros se exportan todos los productos visibles en tu tienda que tengan unidades disponibles."
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={isDefault}
                    onPress={() => setFilters((current) => ({ ...DEFAULT_FILTERS, storeUrl: current.storeUrl }))}
                  >
                    <RotateCcw className="size-3.5" />
                    Restablecer
                  </Button>
                }
              >
                <div className="space-y-1.5">
                  <Label>Categorías</Label>
                  <MultiSelectPopover
                    options={categories.map((category) => ({
                      id: category.id,
                      label: category.name,
                      hint: category.productCount !== undefined ? String(category.productCount) : undefined,
                    }))}
                    selectedIds={new Set(filters.categoryIds)}
                    onChange={(ids) => set("categoryIds", [...ids])}
                    placeholder="Todas las categorías"
                    emptyMessage="Aún no tienes categorías"
                    itemNoun={{ singular: "categoría", plural: "categorías" }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(["minPrice", "maxPrice"] as const).map((key) => (
                    <TextField
                      key={key}
                      value={formatThousands(filters[key])}
                      onChange={(value) => set(key, clampPrice(toDigits(value)))}
                      isInvalid={rangeInvalid}
                    >
                      <Label>{key === "minPrice" ? "Precio mínimo" : "Precio máximo"}</Label>
                      <InputGroup>
                        <InputGroup.Prefix>$</InputGroup.Prefix>
                        <InputGroup.Input inputMode="numeric" placeholder="Sin límite" />
                      </InputGroup>
                    </TextField>
                  ))}
                </div>
                <p className="-mt-2 text-xs text-muted">
                  Se compara con el precio que paga el cliente (con descuento, si lo tiene).
                </p>

                <div className="space-y-3">
                  <Switch isSelected={filters.discountedOnly} onChange={(value) => set("discountedOnly", value)}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>Solo productos con descuento</Label>
                    </Switch.Content>
                  </Switch>
                  <Switch isSelected={filters.includeOutOfStock} onChange={(value) => set("includeOutOfStock", value)}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>Incluir productos agotados</Label>
                    </Switch.Content>
                  </Switch>
                </div>

                <TextField value={filters.brand} onChange={(value) => set("brand", value.slice(0, 100))}>
                  <Label>Marca</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder={summary?.brand ?? "Nombre de tu tienda"} maxLength={100} />
                  </InputGroup>
                  <p className="mt-1 text-xs text-muted">Meta la pide en cada producto. Por defecto, el nombre de tu tienda.</p>
                </TextField>
              </FormSection>

              <details className="group rounded-xl border border-border bg-surface p-4 text-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium">
                  ¿Cómo lo subo a Meta?
                  <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted">
                  <li>Entra a Meta Commerce Manager y abre tu catálogo (o crea uno nuevo).</li>
                  <li>
                    Elige <span className="font-medium text-foreground">Agregar productos</span> y luego{" "}
                    <span className="font-medium text-foreground">Subir un archivo de datos</span>.
                  </li>
                  <li>Selecciona el archivo CSV descargado. Meta reconoce las columnas solo: no tienes que editar nada.</li>
                </ol>
                <p className="mt-3 text-xs text-muted">
                  Para actualizar precios o unidades, descarga el archivo de nuevo y súbelo otra vez: cada producto
                  conserva siempre el mismo id, así que se actualiza sin duplicarse.
                </p>
              </details>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" isDisabled={downloadMutation.isPending} onPress={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <PendingButton
                variant="primary"
                isDisabled={!canDownload}
                isPending={downloadMutation.isPending}
                pendingLabel="Generando archivo"
                onPress={handleDownload}
              >
                <Download className="size-4" />
                Descargar CSV
              </PendingButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
