"use client";

import { useEffect, useState } from "react";
import { Boxes, Minus, Plus, RotateCcw } from "lucide-react";
import { Button, Input, Modal, toast, useOverlayState, cn } from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { PendingButton } from "@/components/shared/pending-button";
import { useMutationUpdateProductStock } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { MAX_QUANTITY } from "@/features/productos/components/constants";
import type { InventoryRow } from "@/interfaces/inventory";

interface AdjustStockModalProps {
  /** Producto a ajustar; null = cerrado. */
  row: InventoryRow | null;
  onClose: () => void;
}

/** Clave de la línea de un producto sin variantes. */
const SINGLE = "__product__";

const clamp = (value: number) => Math.max(0, Math.min(value, MAX_QUANTITY));
const parse = (raw: string | undefined) => (raw ? Number.parseInt(raw, 10) : 0);
const units = (n: number) => `${n} ${n === 1 ? "unidad" : "unidades"}`;

interface Line {
  key: string;
  name: string;
  /** null = sin cantidad guardada (producto antiguo). */
  before: number | null;
}

/**
 * Ajuste de inventario de UN producto: todas sus variantes a la vez (o la
 * cantidad general si no tiene), con el antes → ahora de cada una y el total.
 * Solo se envían las líneas que cambiaron.
 */
export function AdjustStockModal({ row, onClose }: AdjustStockModalProps) {
  const state = useOverlayState({ isOpen: row !== null, onOpenChange: (open) => !open && onClose() });
  const mutation = useMutationUpdateProductStock();
  const [values, setValues] = useState<Record<string, string>>({});

  const lines: Line[] = !row
    ? []
    : row.variants.length > 0
      ? row.variants.map((variant) => ({ key: variant.key, name: variant.name, before: variant.quantity }))
      : [{ key: SINGLE, name: "Unidades disponibles", before: row.quantity }];

  const initialValues = () => Object.fromEntries(lines.map((line) => [line.key, line.before != null ? String(line.before) : ""]));

  useEffect(() => {
    if (row) setValues(initialValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const setLine = (key: string, next: number) => setValues((current) => ({ ...current, [key]: String(clamp(next)) }));
  // Sin cantidad guardada: cuenta como cambio solo cuando escriben un número.
  const changed = lines.filter((line) =>
    line.before == null ? (values[line.key] ?? "") !== "" : parse(values[line.key]) !== line.before,
  );
  const totalBefore = lines.reduce((sum, line) => sum + (line.before ?? 0), 0);
  const totalAfter = lines.reduce((sum, line) => sum + parse(values[line.key]), 0);
  const outAfter = lines.filter((line) => parse(values[line.key]) === 0).length;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!row || changed.length === 0) return;
    const payload = row.variants.length > 0
      ? { id: row.productId, variants: changed.map((line) => ({ variant_key: line.key, quantity: parse(values[line.key]) })) }
      : { id: row.productId, quantity: parse(values[SINGLE]) };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`${row.title}: ${units(totalAfter)} en total`);
        onClose();
      },
      onError: (error) => handleAxiosError(error, "No se pudo actualizar el inventario"),
    });
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!mutation.isPending}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ModalFormHeader
                icon={Boxes}
                title="Ajustar inventario"
                description={row ? `${row.title}: escribe cuántas unidades tienes ahora de cada una.` : ""}
              />
              <Modal.Body className="space-y-3">
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {lines.map((line) => {
                    const now = parse(values[line.key]);
                    const diff = line.before == null ? null : now - line.before;
                    return (
                      <li key={line.key} className={cn("flex items-center gap-3 px-3 py-2", diff !== 0 && "bg-accent/5")}>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-sm font-medium", now === 0 && "text-danger")}>{line.name}</p>
                          <p className="text-xs text-muted tabular-nums">
                            {line.before == null ? "Sin cantidad guardada" : `Antes: ${line.before}`}
                            {diff ? (
                              <span className={cn("ml-1 font-medium", diff > 0 ? "text-success" : "text-danger")}>
                                ({diff > 0 ? `+${diff}` : diff})
                              </span>
                            ) : null}
                            {now === 0 && " · Agotado"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" isIconOnly aria-label={`Quitar una unidad de ${line.name}`} isDisabled={now <= 0} onPress={() => setLine(line.key, now - 1)}>
                            <Minus className="size-3.5" />
                          </Button>
                          <Input
                            aria-label={`Unidades de ${line.name}`}
                            inputMode="numeric"
                            placeholder="0"
                            value={values[line.key] ?? ""}
                            onChange={(event) => {
                              const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                              setValues((current) => ({ ...current, [line.key]: digits === "" ? "" : String(clamp(Number(digits))) }));
                            }}
                            className="w-16 text-center font-semibold tabular-nums"
                          />
                          <Button type="button" variant="ghost" size="sm" isIconOnly aria-label={`Agregar una unidad a ${line.name}`} isDisabled={now >= MAX_QUANTITY} onPress={() => setLine(line.key, now + 1)}>
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-secondary px-3 py-2 text-sm">
                  <span>
                    Total: <span className="tabular-nums text-muted">{totalBefore}</span> →{" "}
                    <span className="font-semibold tabular-nums">{units(totalAfter)}</span>
                    {lines.length > 1 && outAfter > 0 && (
                      <span className="text-danger"> · {outAfter} de {lines.length} agotadas</span>
                    )}
                  </span>
                  {changed.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onPress={() => setValues(initialValues())}>
                      <RotateCcw className="size-3.5" />
                      Deshacer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Máximo {MAX_QUANTITY} por {lines.length > 1 ? "variante" : "producto"}. Lo que quede en 0 aparece agotado en la tienda.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" type="button" isDisabled={mutation.isPending} onPress={onClose}>
                  Cancelar
                </Button>
                <PendingButton variant="primary" type="submit" isDisabled={changed.length === 0} isPending={mutation.isPending} pendingLabel="Guardando">
                  {changed.length > 1 ? `Guardar ${changed.length} cambios` : "Guardar"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
