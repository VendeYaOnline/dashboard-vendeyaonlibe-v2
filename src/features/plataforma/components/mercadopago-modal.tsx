"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, Eye, EyeOff } from "lucide-react";
import {
  Button,
  Chip,
  Input,
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
import { FormSection } from "@/features/productos/components/form-section";
import { isValidEmail } from "@/features/usuarios/constants";
import { useQueryMercadoPagoSettings } from "@/app/api/queries";
import { useMutationUpdateMercadoPagoSettings } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { PlatformCompany } from "@/interfaces/platform";
import { MERCADOPAGO_SOURCE_LABELS } from "../utils";

interface MercadoPagoModalProps {
  /** Empresa a configurar; null = cerrado. */
  company: PlatformCompany | null;
  onClose: () => void;
}

const TOKEN_PATTERN = /^(APP_USR|TEST)-[\w-]+$/;
const URL_PATTERN = /^https?:\/\/[^\s/]+\.[^\s]+$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Configuración de Mercado Pago de una empresa (superadmin). El token nunca se muestra. */
export function MercadoPagoModal({ company, onClose }: MercadoPagoModalProps) {
  const isOpen = company !== null;
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const { data: settings, isLoading } = useQueryMercadoPagoSettings(company?.id ?? null);
  const mutation = useMutationUpdateMercadoPagoSettings();

  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [descriptor, setDescriptor] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailColor, setEmailColor] = useState("#6439ff");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (!settings) return;
    // La empresa heredada aún sin cuenta propia se muestra lista para activar.
    setEnabled(settings.enabled || settings.source === "legacy");
    setToken("");
    setShowToken(false);
    setStoreUrl(settings.store_url);
    setDescriptor(settings.statement_descriptor);
    setEmailFrom(settings.email_from);
    setEmailColor(settings.email_color || "#6439ff");
    setLogoUrl(settings.logo_url);
  }, [settings]);

  const tokenTrimmed = token.trim();
  const isTokenValid = tokenTrimmed === "" || TOKEN_PATTERN.test(tokenTrimmed);
  const hasToken = Boolean(settings?.has_access_token) || tokenTrimmed !== "";
  const isStoreUrlValid = storeUrl.trim() === "" ? !enabled : URL_PATTERN.test(storeUrl.trim());
  const isEmailValid = emailFrom.trim() === "" ? !enabled : isValidEmail(emailFrom.trim());
  const isLogoValid = logoUrl.trim() === "" || URL_PATTERN.test(logoUrl.trim());
  const isColorValid = COLOR_PATTERN.test(emailColor);
  const isValid =
    isTokenValid && isStoreUrlValid && isEmailValid && isLogoValid && isColorValid && (!enabled || hasToken);
  const stopsLegacyPayments = settings?.source === "legacy" && !enabled;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!company || !isValid) return;
    mutation.mutate(
      {
        id: company.id,
        data: {
          enabled,
          access_token: tokenTrimmed,
          store_url: storeUrl.trim(),
          statement_descriptor: descriptor.trim(),
          email_from: emailFrom.trim(),
          email_color: emailColor,
          logo_url: logoUrl.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(enabled ? `Mercado Pago activo para ${company.name}` : "Configuración guardada (pagos desactivados)");
          onClose();
        },
        onError: (error) => handleAxiosError(error, "No se pudo guardar la configuración de Mercado Pago"),
      },
    );
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!mutation.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ModalFormHeader
                icon={CreditCard}
                title={`Mercado Pago · ${company?.name ?? ""}`}
                description="La tienda cobrará en la cuenta de Mercado Pago de este cliente."
              />

              <Modal.Body className="space-y-5">
                {isLoading || !settings ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted">
                    <Spinner size="sm" />
                    Cargando configuración...
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip size="sm" variant="soft" color={settings.source === "company" ? "success" : settings.source === "legacy" ? "warning" : "default"}>
                        {MERCADOPAGO_SOURCE_LABELS[settings.source]}
                      </Chip>
                      {settings.mode && (
                        <Chip size="sm" variant="soft" color={settings.mode === "production" ? "accent" : settings.mode === "test" ? "warning" : "danger"}>
                          {settings.mode === "production" ? "Producción" : settings.mode === "test" ? "Modo prueba" : "Token ilegible"}
                        </Chip>
                      )}
                    </div>

                    {!settings.can_store_secrets && (
                      <Notice tone="danger">
                        El servidor no tiene <code>SECRETS_KEY</code> configurada: no se pueden guardar tokens.
                      </Notice>
                    )}
                    {settings.source === "legacy" && (
                      <Notice tone="warning">
                        Hoy cobra con la cuenta configurada en el servidor (<code>ACCESS_TOKEN</code>). Pega su
                        token de producción y guarda activado para que use su propia configuración.
                      </Notice>
                    )}

                    <FormSection title="Cuenta" description="Access token de producción de la cuenta del cliente (Credenciales de producción). Se guarda cifrado.">
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                        <Label>Cobrar con Mercado Pago</Label>
                        <Switch isSelected={enabled} onChange={setEnabled}>
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            <Label className="text-xs text-muted">{enabled ? "Activo" : "Desactivado"}</Label>
                          </Switch.Content>
                        </Switch>
                      </div>
                      <TextField value={token} onChange={setToken} type={showToken ? "text" : "password"} isInvalid={!isTokenValid}>
                        <Label>Access token</Label>
                        <InputGroup className="w-full min-w-0">
                          <InputGroup.Input
                            className="min-w-0"
                            autoComplete="off"
                            placeholder={settings.has_access_token ? `Guardado ${settings.access_token_hint ?? ""} · vacío = conservarlo` : "APP_USR-..."}
                          />
                          <InputGroup.Suffix>
                            <button
                              type="button"
                              onClick={() => setShowToken((visible) => !visible)}
                              aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                              className="text-muted transition-colors hover:text-foreground"
                            >
                              {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </InputGroup.Suffix>
                        </InputGroup>
                        <p className={`mt-1 text-xs ${isTokenValid ? "text-muted" : "text-danger"}`}>
                          {isTokenValid ? "Empieza por APP_USR- (producción) o TEST- (pruebas)." : "El token debe empezar por APP_USR- o TEST-."}
                        </p>
                      </TextField>
                      {enabled && !hasToken && <p className="text-xs text-danger">Para activar los pagos ingresa el access token.</p>}
                    </FormSection>

                    <FormSection title="Tienda" description="Mercado Pago devuelve al comprador a /success-purchase, /pending-purchase o /failure-purchase de esta URL.">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField value={storeUrl} onChange={setStoreUrl} isInvalid={!isStoreUrlValid} className="sm:col-span-2">
                          <Label>URL de la tienda</Label>
                          <Input placeholder="https://www.tienda.com" maxLength={200} />
                        </TextField>
                        <TextField value={descriptor} onChange={(value) => setDescriptor(value.slice(0, 50))} className="sm:col-span-2">
                          <Label>Nombre en el extracto de la tarjeta</Label>
                          <Input placeholder={`Vacío = ${company?.name ?? "nombre de la empresa"}`} maxLength={50} />
                        </TextField>
                      </div>
                    </FormSection>

                    <FormSection title="Correo de confirmación" description="Lo recibe el comprador cuando el pago se aprueba.">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField value={emailFrom} onChange={setEmailFrom} type="email" isInvalid={!isEmailValid}>
                          <Label>Correo remitente</Label>
                          <Input placeholder="ventas@tienda.com" maxLength={120} />
                        </TextField>
                        <div className="space-y-2">
                          <Label>Color de la marca</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={isColorValid ? emailColor : "#6439ff"}
                              onChange={(event) => setEmailColor(event.target.value)}
                              aria-label="Elegir color"
                              className="h-10 w-12 cursor-pointer rounded-md border border-border bg-surface"
                            />
                            <TextField value={emailColor} onChange={setEmailColor} isInvalid={!isColorValid} aria-label="Color en hexadecimal" className="flex-1">
                              <Input placeholder="#6439ff" maxLength={7} />
                            </TextField>
                          </div>
                        </div>
                        <TextField value={logoUrl} onChange={setLogoUrl} isInvalid={!isLogoValid} className="sm:col-span-2">
                          <Label>URL del logo</Label>
                          <Input placeholder="https://.../logo.png" maxLength={300} />
                        </TextField>
                      </div>
                    </FormSection>

                    <p className="break-all rounded-lg bg-surface-secondary px-3 py-2 text-xs text-muted">
                      Webhook (automático en cada pago): {settings.webhook_url}
                    </p>
                    {stopsLegacyPayments && (
                      <Notice tone="danger">Si guardas con los pagos desactivados, esta tienda dejará de cobrar con Mercado Pago.</Notice>
                    )}
                  </>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="ghost" type="button" isDisabled={mutation.isPending} onPress={onClose}>
                  Cancelar
                </Button>
                <PendingButton
                  variant="primary"
                  type="submit"
                  isDisabled={!settings || !isValid || !settings.can_store_secrets}
                  isPending={mutation.isPending}
                  pendingLabel="Guardando"
                >
                  Guardar
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Notice({ tone, children }: { tone: "warning" | "danger"; children: React.ReactNode }) {
  return (
    <p className={`flex gap-2 rounded-lg px-3 py-2 text-xs ${tone === "danger" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
