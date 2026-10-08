"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, MessageCircle, PlugZap } from "lucide-react";
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
import { useQueryWhatsappSettings } from "@/app/api/queries";
import { useMutationTestWhatsapp, useMutationUpdateWhatsappSettings } from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { PlatformCompany } from "@/interfaces/platform";

interface WhatsappModalProps {
  /** Empresa a configurar; null = cerrado. */
  company: PlatformCompany | null;
  onClose: () => void;
}

const PHONE_ID_PATTERN = /^\d{6,25}$/;
const TEMPLATE_PATTERN = /^[a-z0-9_]{1,512}$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(_[A-Z]{2})?$/;

/**
 * WhatsApp Cloud API de una empresa (superadmin). Con la API activa las campañas
 * de WhatsApp se envían solas con la plantilla aprobada; sin ella, la tienda usa
 * los enlaces wa.me. El token se guarda cifrado y nunca vuelve al navegador.
 */
export function WhatsappModal({ company, onClose }: WhatsappModalProps) {
  const state = useOverlayState({ isOpen: company !== null, onOpenChange: (open) => !open && onClose() });
  const { data: settings, isLoading } = useQueryWhatsappSettings(company?.id ?? null);
  const mutation = useMutationUpdateWhatsappSettings();
  const test = useMutationTestWhatsapp();

  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setToken("");
    setShowToken(false);
    setPhoneNumberId(settings.phone_number_id);
    setTemplateName(settings.template_name);
    setLanguage(settings.template_language || "es");
  }, [settings]);

  const tokenTrimmed = token.trim();
  const isTokenValid = tokenTrimmed === "" || (tokenTrimmed.length >= 20 && !/\s/.test(tokenTrimmed));
  const hasToken = Boolean(settings?.has_token) || tokenTrimmed !== "";
  const isPhoneValid = phoneNumberId === "" || PHONE_ID_PATTERN.test(phoneNumberId);
  const isTemplateValid = templateName === "" || TEMPLATE_PATTERN.test(templateName);
  const isLanguageValid = LANGUAGE_PATTERN.test(language);
  const missingForEnable = enabled && (!hasToken || !phoneNumberId || !templateName);
  const isValid = isTokenValid && isPhoneValid && isTemplateValid && isLanguageValid && !missingForEnable;
  const isDirty =
    !!settings &&
    (tokenTrimmed !== "" ||
      enabled !== settings.enabled ||
      phoneNumberId !== settings.phone_number_id ||
      templateName !== settings.template_name ||
      language !== (settings.template_language || "es"));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!company || !isValid) return;
    mutation.mutate(
      {
        id: company.id,
        data: {
          enabled,
          phone_number_id: phoneNumberId,
          template_name: templateName,
          template_language: language,
          // Vacío = conservar el token guardado.
          ...(tokenTrimmed ? { access_token: tokenTrimmed } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(enabled ? `WhatsApp por API activo para ${company.name}` : "Configuración guardada (se usan enlaces wa.me)");
          setToken("");
        },
        onError: (error) => handleAxiosError(error, "No se pudo guardar la configuración de WhatsApp"),
      },
    );
  };

  const handleTest = () =>
    company &&
    test.mutate(company.id, {
      onSuccess: (result) =>
        toast.success(`Conexión correcta${result.verified_name ? `: ${result.verified_name}` : ""}${result.display_phone ? ` (${result.display_phone})` : ""}`),
      onError: (error) => handleAxiosError(error, "No se pudo conectar con WhatsApp"),
    });

  const removeToken = () =>
    company &&
    mutation.mutate(
      { id: company.id, data: { enabled: false, access_token: null } },
      {
        onSuccess: () => toast.success("Token eliminado; la tienda vuelve a los enlaces wa.me"),
        onError: (error) => handleAxiosError(error, "No se pudo eliminar el token"),
      },
    );

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!mutation.isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ModalFormHeader
                icon={MessageCircle}
                title={`WhatsApp · ${company?.name ?? ""}`}
                description="WhatsApp Cloud API de Meta para enviar las campañas automáticamente desde el número de la tienda."
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
                      <Chip size="sm" variant="soft" color={settings.ready ? "success" : "default"}>
                        {settings.ready ? "API activa" : "Enlaces wa.me"}
                      </Chip>
                      {settings.verified_name && (
                        <Chip size="sm" variant="soft" color="accent">
                          <CheckCircle2 className="size-3" />
                          {settings.verified_name}
                          {settings.display_phone ? ` · ${settings.display_phone}` : ""}
                        </Chip>
                      )}
                    </div>

                    {!settings.can_store_secrets && (
                      <Notice>
                        El servidor no tiene <code>SECRETS_KEY</code> configurada: no se pueden guardar tokens.
                      </Notice>
                    )}

                    <FormSection
                      title="Cuenta de Meta"
                      description="Del panel de WhatsApp en developers.facebook.com: un token permanente (usuario del sistema) con permiso whatsapp_business_messaging y el Phone number ID del número. Se guarda cifrado."
                    >
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                        <Label>Enviar campañas por la API</Label>
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
                        <Label>Token de acceso</Label>
                        <InputGroup className="w-full min-w-0">
                          <InputGroup.Input
                            className="min-w-0"
                            autoComplete="off"
                            placeholder={settings.has_token ? `Guardado ${settings.token_hint ?? ""} · vacío = conservarlo` : "EAAG..."}
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
                        {!isTokenValid && <p className="mt-1 text-xs text-danger">El token no parece válido.</p>}
                      </TextField>
                      <TextField value={phoneNumberId} onChange={(value) => setPhoneNumberId(value.replace(/\D/g, "").slice(0, 25))} isInvalid={!isPhoneValid}>
                        <Label>Phone number ID</Label>
                        <Input inputMode="numeric" placeholder="Ej: 109876543210987" className="font-mono text-sm" />
                      </TextField>
                    </FormSection>

                    <FormSection
                      title="Plantilla aprobada"
                      description="Meta solo permite iniciar conversaciones con plantillas aprobadas. Debe ser de Marketing, con 3 variables en el cuerpo: {{1}} nombre del cliente, {{2}} texto de la campaña y {{3}} enlace."
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <TextField
                          value={templateName}
                          onChange={(value) => setTemplateName(value.trim().slice(0, 512))}
                          isInvalid={!isTemplateValid}
                          className="sm:col-span-2"
                        >
                          <Label>Nombre de la plantilla</Label>
                          <Input placeholder="promo_tienda" className="font-mono text-sm" />
                          {!isTemplateValid && (
                            <p className="mt-1 text-xs text-danger">Solo minúsculas, números y guion bajo, como en Meta.</p>
                          )}
                        </TextField>
                        <TextField value={language} onChange={(value) => setLanguage(value.trim().slice(0, 6))} isInvalid={!isLanguageValid}>
                          <Label>Idioma</Label>
                          <Input placeholder="es" className="font-mono text-sm" />
                        </TextField>
                      </div>
                    </FormSection>

                    {missingForEnable && (
                      <p className="text-xs text-danger">Para activar la API faltan el token, el Phone number ID o el nombre de la plantilla.</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2">
                      <p className="min-w-0 flex-1 text-xs text-muted">
                        «Probar conexión» verifica el token y el número guardados con Meta, sin enviar mensajes.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        isDisabled={!settings.has_token || !settings.phone_number_id || isDirty || test.isPending}
                        onPress={handleTest}
                      >
                        {test.isPending ? <Spinner size="sm" /> : <PlugZap className="size-3.5" />}
                        Probar conexión
                      </Button>
                      {settings.has_token && (
                        <Button variant="ghost" size="sm" className="text-danger" isDisabled={mutation.isPending} onPress={removeToken}>
                          Quitar token
                        </Button>
                      )}
                    </div>
                    {isDirty && settings.has_token && <p className="text-xs text-muted">Guarda los cambios para poder probarlos.</p>}
                  </>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="ghost" type="button" isDisabled={mutation.isPending} onPress={onClose}>
                  Cerrar
                </Button>
                <PendingButton
                  variant="primary"
                  type="submit"
                  isDisabled={!settings || !isValid || !isDirty || !settings.can_store_secrets}
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

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
