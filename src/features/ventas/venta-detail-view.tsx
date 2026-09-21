"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { ArrowLeft, CreditCard, MapPin, Package, ShoppingCart, UserRound } from "lucide-react";
import { useQuerySale } from "@/app/api/queries";
import { useMutationUpdateSaleStatus } from "@/app/api/mutations";
import { PageHeader } from "@/components/layout/page-header";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { getPaymentMethodLabel, type SaleProduct } from "./types";
import { formatSaleTotal } from "./utils";
import { VentaStatusChip } from "./components/venta-status-chip";
import { VentaStatusMenu } from "./components/venta-status-menu";

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-1 break-words font-medium">{children || "—"}</div>
    </div>
  );
}

function ProductCard({ product, index }: { product: SaleProduct; index: number }) {
  const image = product.image_product || product.images?.[0];
  return (
    <Card key={`${product.id ?? product.title}-${index}`}>
      <Card.Content className="flex gap-4 p-4">
        {image ? (
          <img src={image} alt={product.title} className="size-24 shrink-0 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary text-xs text-muted">Sin imagen</div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{product.title}</h3>
          {product.variant_label && <p className="mt-1 text-sm text-muted">{product.variant_label}</p>}
          {product.bundle_items && product.bundle_items.length > 0 && (
            <p className="mt-1 text-sm text-muted">{product.bundle_items.map((item) => item.variant_label).join(" · ")}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {product.discount > 0 ? <><span className="line-through">${product.price}</span> <span className="text-danger">-{product.discount}%</span></> : <>${product.price}</>}
            </p>
            <div className="flex items-center gap-3">
              <Chip size="sm" variant="soft">Cantidad: {product.quantity}</Chip>
              <p className="font-bold text-accent">{formatSaleTotal(product.purchase_total)}</p>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={ShoppingCart}
        title={`Orden ${sale.order_number}`}
        description={`Compra realizada el ${sale.purchase_date}`}
        actions={<Button variant="outline" onPress={() => router.push("/ventas")}><ArrowLeft className="size-4" />Volver a ventas</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header><Card.Title className="flex items-center gap-2"><UserRound className="size-5 text-accent" />Información del cliente</Card.Title></Card.Header>
          <Card.Content className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Nombres">{sale.first_name}</DetailField>
            <DetailField label="Apellidos">{sale.last_name}</DetailField>
            <DetailField label="Email"><span className="text-sm">{sale.email}</span></DetailField>
            <DetailField label="Teléfono">{sale.phone}</DetailField>
            <DetailField label="Número de cédula">{sale.id_number}</DetailField>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header><Card.Title className="flex items-center gap-2"><CreditCard className="size-5 text-accent" />Resumen del pedido</Card.Title></Card.Header>
          <Card.Content className="space-y-4">
            <DetailField label="Estado"><VentaStatusMenu status={sale.status} isDisabled={!canManage} isPending={pendingStatus} onChange={updateStatus} /></DetailField>
            <DetailField label="Método de pago">{getPaymentMethodLabel(sale.payment_method)}</DetailField>
            <DetailField label="Cantidad total">{sale.quantity} unidades</DetailField>
            <div className="border-t border-border pt-4"><p className="text-sm text-muted">Total pagado</p><p className="text-2xl font-bold tabular-nums">{formatSaleTotal(sale.total)}</p></div>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header><Card.Title className="flex items-center gap-2"><MapPin className="size-5 text-accent" />Dirección de entrega</Card.Title></Card.Header>
        <Card.Content className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Departamento">{sale.department}</DetailField>
          <DetailField label="Ciudad">{sale.city}</DetailField>
          <DetailField label="Dirección">{sale.address}</DetailField>
          <DetailField label="Referencias adicionales">{sale.additional_info}</DetailField>
        </Card.Content>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-xl font-semibold"><Package className="size-5 text-accent" />Productos</h2><p className="text-sm text-muted">{sale.products.length} productos · {totalUnits} unidades</p></div>
        {sale.products.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{sale.products.map((product, index) => <ProductCard key={`${product.id ?? product.title}-${index}`} product={product} index={index} />)}</div> : <Card><Card.Content className="py-8 text-center text-muted">Esta venta no tiene productos registrados.</Card.Content></Card>}
      </section>
    </div>
  );
}
