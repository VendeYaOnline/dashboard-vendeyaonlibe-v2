"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { ArrowLeft, MapPin, Package, ReceiptText, UserRound } from "lucide-react";
import { useQuerySale } from "@/app/api/queries";
import { ImageWithSkeleton } from "@/components/shared/image-with-skeleton";
import { useMutationUpdateSaleStatus } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { getPaymentMethodLabel, getSaleProductVariantLabel, type SaleProduct } from "./types";
import { formatSaleTotal } from "./utils";
import { VentaStatusChip } from "./components/venta-status-chip";
import { VentaStatusMenu } from "./components/venta-status-menu";

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium tracking-wide text-muted">{label}</p>
      <div className="mt-0.5 break-words text-sm font-semibold">{children || "—"}</div>
    </div>
  );
}

const formatLocation = (department?: string, city?: string) =>
  [department, city]
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim() !== "" &&
        value.trim().toLowerCase() !== "no especificado",
    )
    .join(" · ");

function ReceiptSection({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-5 sm:px-7">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4 text-accent" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function ProductRow({ product }: { product: SaleProduct }) {
  const image = product.image_product || product.images?.[0];
  const variantLabel = product.bundle_items?.length ? undefined : getSaleProductVariantLabel(product);
  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      {image ? (
        <ImageWithSkeleton
          src={image}
          alt={product.title}
          sizes="64px"
          className="size-16 shrink-0 rounded-lg border border-border"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary text-[10px] text-muted">Sin imagen</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{product.title}</h3>
            {variantLabel && <p className="mt-0.5 text-xs text-muted">{variantLabel}</p>}
            {product.bundle_items && product.bundle_items.length > 0 && (
              <ol className="mt-1 space-y-0.5 text-xs text-muted">
                {product.bundle_items.map((item, index) => <li key={`${item.variant_key}-${index}`}>{index + 1}. {item.variant_label}</li>)}
              </ol>
            )}
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums">{formatSaleTotal(product.purchase_total)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{formatSaleTotal(product.price)} c/u</span>
          <Chip size="sm" variant="soft">× {product.quantity}</Chip>
        </div>
      </div>
    </div>
  );
}

export function VentaDetailView({ saleId }: { saleId: string }) {
  const router = useRouter();
  const canManage = useAuthStore((s) => s.user?.role) !== "viewer";
  const { data: sale, isLoading, isError } = useQuerySale(saleId);
  const mutation = useMutationUpdateSaleStatus();
  const [pendingStatus, setPendingStatus] = useState(false);

  if (isLoading) return <p className="py-12 text-center text-muted">Cargando venta…</p>;
  if (isError || !sale) return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-lg font-semibold">No encontramos esta venta</p>
      <Button variant="outline" onPress={() => router.push("/ventas")}><ArrowLeft className="size-4" />Volver a ventas</Button>
    </div>
  );

  const totalUnits = sale.products.reduce((total, product) => total + Number(product.quantity || 0), 0);
  const updateStatus = (status: string) => {
    setPendingStatus(true);
    mutation.mutate({ id: sale.id, status }, {
      onError: (error) => handleAxiosError(error, "No se pudo cambiar el estado"),
      onSettled: () => setPendingStatus(false),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Detalle de venta</p>
        <Button variant="outline" size="sm" onPress={() => router.push("/ventas")}><ArrowLeft className="size-4" />Volver a ventas</Button>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="bg-surface-secondary px-5 py-6 text-center sm:px-7">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-accent-soft"><ReceiptText className="size-6 text-accent" /></div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">Comprobante de orden</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{sale.order_number}</h1>
          <p className="mt-1 text-sm text-muted">Compra realizada el {sale.purchase_date}</p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <DetailField label="Estado"><VentaStatusMenu status={sale.status} isDisabled={!canManage} isPending={pendingStatus} onChange={updateStatus} /></DetailField>
          <DetailField label="Método de pago">{getPaymentMethodLabel(sale.payment_method)}</DetailField>
        </div>

        <div className="border-y border-dashed border-border" />

        <ReceiptSection icon={UserRound} title="Cliente">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Nombre completo">{`${sale.first_name} ${sale.last_name}`}</DetailField>
            <DetailField label="Documento">{sale.id_number}</DetailField>
            <DetailField label="Correo"><span className="break-all">{sale.email}</span></DetailField>
            <DetailField label="Teléfono">{sale.phone}</DetailField>
          </div>
        </ReceiptSection>

        <div className="border-t border-dashed border-border" />

        <ReceiptSection icon={MapPin} title="Entrega">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Ubicación">{formatLocation(sale.department, sale.city)}</DetailField>
            <DetailField label="Dirección">{sale.address}</DetailField>
            <div className="sm:col-span-2"><DetailField label="Referencias adicionales">{sale.additional_info}</DetailField></div>
          </div>
        </ReceiptSection>

        <div className="border-t border-dashed border-border" />

        <ReceiptSection icon={Package} title={`Productos · ${totalUnits} ${totalUnits === 1 ? "unidad" : "unidades"}`}>
          {sale.products.length > 0 ? <div className="divide-y divide-dashed divide-border">{sale.products.map((product, index) => <ProductRow key={`${product.id ?? product.title}-${index}`} product={product} />)}</div> : <p className="py-3 text-center text-sm text-muted">Esta venta no tiene productos registrados.</p>}
        </ReceiptSection>

        <div className="border-t border-dashed border-border" />
        <div className="flex items-end justify-between gap-4 bg-surface-secondary px-5 py-5 sm:px-7">
          <div><p className="text-xs font-medium tracking-wide text-muted">TOTAL PAGADO</p><p className="mt-1 text-sm text-muted">{sale.products.length} {sale.products.length === 1 ? "producto" : "productos"}</p></div>
          <p className="text-2xl font-bold tabular-nums">{formatSaleTotal(sale.total)}</p>
        </div>
      </Card>
    </div>
  );
}
