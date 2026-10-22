"use client";

import { useEffect, useState } from "react";
import { Building2, Eye, EyeOff } from "lucide-react";
import {
  Button,
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
import { FormSection } from "@/features/productos/components/form-section";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  isValidEmail,
} from "@/features/usuarios/constants";
import type {
  CreateCompanyPayload,
  PlatformCompany,
  PlatformConfig,
  UpdateCompanyPayload,
} from "@/interfaces/platform";
import { PAID_FEATURES, type PaidFeature } from "@/config/navigation";
import { suggestedImageLimit } from "../utils";

interface EmpresaFormModalProps {
  /** null = crear (con admin); con valor = editar nombre y plan. */
  company: PlatformCompany | null;
  config: PlatformConfig | undefined;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (payload: CreateCompanyPayload) => void;
  onUpdate: (id: string, payload: UpdateCompanyPayload) => void;
  isPending: boolean;
}

const DEFAULT_PRODUCTS = 50;
/** Correos de prueba por tienda (TEST_EMAILS_LIMIT del backend). */
const TEST_EMAILS_LIMIT = 10;

const toDigits = (value: string) => value.replace(/\D/g, "");

export function EmpresaFormModal({
  company,
  config,
  isOpen,
  onOpenChange,
  onCreate,
  onUpdate,
  isPending,
}: EmpresaFormModalProps) {
  const isEdit = company !== null;
  const state = useOverlayState({ isOpen, onOpenChange });

  const [name, setName] = useState("");
  const [limitProducts, setLimitProducts] = useState(true);
  const [maxProducts, setMaxProducts] = useState(String(DEFAULT_PRODUCTS));
  const [limitImages, setLimitImages] = useState(true);
  const [maxImages, setMaxImages] = useState("");
  /** Mientras el usuario no toque el tope de imágenes, se recalcula desde los productos. */
  const [imagesTouched, setImagesTouched] = useState(false);
  /** Envío de la tienda (solo al editar); vacío = no cobra / nunca gratis. */
  const [shippingFee, setShippingFee] = useState("");
  const [freeShippingFrom, setFreeShippingFrom] = useState("");
  /** Vistas de pago activas (solo al editar). */
  const [features, setFeatures] = useState<PaidFeature[]>([]);
  /** Correos de Marketing por mes; vacío = valor por defecto. */
  const [monthlyLimit, setMonthlyLimit] = useState("");
  /** Correos por día y por hora; vacío = los globales de Plataforma. */
  const [dailyLimit, setDailyLimit] = useState("");
  const [hourlyLimit, setHourlyLimit] = useState("");
  /** Correo de prueba de la tienda; vacío = sin pruebas. */
  const [testEmail, setTestEmail] = useState("");
  /** Devolverle los 10 correos de prueba al guardar. */
  const [resetTests, setResetTests] = useState(false);
  /** Reactivar las campañas de correo pausadas por rebotes o quejas al guardar. */
  const [resumeMarketing, setResumeMarketing] = useState(false);
  /** Bloqueo por falta de pago: cambiarlo al guardar (desbloquear o volver a bloquear). */
  const [toggleBlock, setToggleBlock] = useState(false);
  /** Ruta de producto de la tienda (enlaces de Marketing); vacío = /producto/{id}. */
  const [productPath, setProductPath] = useState("");
  /** Correo de su cuenta de VendeYaOnline: con él la tienda suma vistas a su plan. */
  const [accountEmail, setAccountEmail] = useState("");

  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(company?.name ?? "");
    const products = company?.max_products ?? (company ? null : DEFAULT_PRODUCTS);
    setLimitProducts(products !== null);
    setMaxProducts(products === null ? String(DEFAULT_PRODUCTS) : String(products));
    const images = company?.max_images ?? (company ? null : suggestedImageLimit(DEFAULT_PRODUCTS, config));
    setLimitImages(images !== null);
    setMaxImages(images === null ? "" : String(images));
    setImagesTouched(Boolean(company));
    setShippingFee(company?.shipping_fee != null ? String(company.shipping_fee) : "");
    setFreeShippingFrom(company?.free_shipping_from != null ? String(company.free_shipping_from) : "");
    setFeatures(company?.features ?? []);
    setMonthlyLimit(company?.marketing_monthly_limit != null ? String(company.marketing_monthly_limit) : "");
    setProductPath(company?.marketing_product_path ?? "");
    setDailyLimit(company?.marketing_daily_limit != null ? String(company.marketing_daily_limit) : "");
    setHourlyLimit(company?.marketing_hourly_limit != null ? String(company.marketing_hourly_limit) : "");
    setTestEmail(company?.marketing_test_email ?? "");
    setAccountEmail(company?.vendeya_account_email ?? "");
    setResetTests(false);
    setResumeMarketing(false);
    setToggleBlock(false);
    setAdminUsername("");
    setAdminEmail("");
    setAdminPassword("");
    setShowPassword(false);
  }, [isOpen, company, config]);

  const productsValue = Number.parseInt(maxProducts, 10);
  const productsRange = config?.products ?? { min: 50, max: 1000 };
  const imagesRange = config?.images ?? { min: 1, max: 10000 };
  const isProductsValid =
    !limitProducts ||
    (Number.isFinite(productsValue) &&
      productsValue >= productsRange.min &&
      productsValue <= productsRange.max);

  // Sugerencia automática mientras no se haya editado a mano.
  useEffect(() => {
    if (imagesTouched || !limitProducts || !Number.isFinite(productsValue)) return;
    setMaxImages(String(suggestedImageLimit(productsValue, config)));
  }, [productsValue, limitProducts, imagesTouched, config]);

  const imagesValue = Number.parseInt(maxImages, 10);
  const perProduct = config?.imagesPerProduct ?? 6;
  const extra = config?.imagesExtra ?? 5;
  // Sugerencia visible siempre que haya un tope de productos válido.
  const suggestion =
    limitProducts && isProductsValid ? suggestedImageLimit(productsValue, config) : null;
  const isImagesValid =
    !limitImages ||
    (Number.isFinite(imagesValue) &&
      imagesValue >= imagesRange.min &&
      imagesValue <= imagesRange.max);

  const nameTrimmed = name.trim();
  const isNameValid = nameTrimmed.length >= 2 && nameTrimmed.length <= 80;
  const isAdminValid =
    isEdit ||
    (adminUsername.trim().length >= MIN_USERNAME_LENGTH &&
      adminUsername.trim().length <= MAX_USERNAME_LENGTH &&
      isValidEmail(adminEmail.trim()) &&
      adminPassword.length >= MIN_PASSWORD_LENGTH);

  const isTestEmailValid = testEmail.trim() === "" || isValidEmail(testEmail.trim());
  const isAccountEmailValid = accountEmail.trim() === "" || isValidEmail(accountEmail.trim());
  /** Vistas que la tienda sumó a su suscripción (quitarlas también las quita del cobro). */
  const billedFeatures = Object.keys(company?.feature_billing ?? {});
  const isValid =
    isNameValid && isProductsValid && isImagesValid && isAdminValid && isTestEmailValid && isAccountEmailValid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    const limits = {
      max_products: limitProducts ? productsValue : null,
      max_images: limitImages ? imagesValue : null,
    };
    if (isEdit) {
      onUpdate(company.id, {
        name: nameTrimmed,
        ...limits,
        shipping_fee: shippingFee === "" ? null : Number(shippingFee),
        free_shipping_from: shippingFee === "" || freeShippingFrom === "" ? null : Number(freeShippingFrom),
        features,
        vendeya_account_email: accountEmail.trim() === "" ? null : accountEmail.trim(),
        marketing_monthly_limit: monthlyLimit === "" ? null : Number(monthlyLimit),
        marketing_product_path: productPath.trim() === "" ? null : productPath.trim(),
        marketing_daily_limit: dailyLimit === "" ? null : Number(dailyLimit),
        marketing_hourly_limit: hourlyLimit === "" ? null : Number(hourlyLimit),
        marketing_test_email: testEmail.trim() === "" ? null : testEmail.trim(),
        ...(resetTests ? { reset_test_sends: true } : {}),
        ...(resumeMarketing ? { marketing_resume: true } : {}),
        ...(toggleBlock ? { billing_unblock: !company?.billing_block_override } : {}),
      });
      return;
    }
    onCreate({
      name: nameTrimmed,
      ...limits,
      admin: {
        username: adminUsername.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
      },
    });
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ModalFormHeader
                icon={Building2}
                title={isEdit ? "Editar empresa" : "Nueva empresa"}
                description={
                  isEdit
                    ? "Cambia el nombre, los topes del plan, el envío o las vistas de pago. El uso actual no se toca."
                    : "Crea el cliente, su plan y el usuario administrador con el que entrará al panel."
                }
              />

              <Modal.Body className="space-y-5">
                <FormSection title="Empresa" description="Nombre con el que aparecerá en la plataforma.">
                  <TextField
                    value={name}
                    onChange={(value) => setName(value.slice(0, 80))}
                    isRequired
                    isInvalid={name !== "" && !isNameValid}
                    autoFocus
                  >
                    <Label>Nombre de la empresa</Label>
                    <Input placeholder="Ej: Muebles y electrodomésticos del Meta" maxLength={80} />
                  </TextField>
                </FormSection>

                <FormSection
                  title="Plan"
                  description={`Productos entre ${productsRange.min} y ${productsRange.max}. El tope de imágenes se sugiere como productos × ${config?.imagesPerProduct ?? 6} + ${config?.imagesExtra ?? 5} portadas; puedes ajustarlo.`}
                >
                  <div className="grid grid-cols-1 gap-4">
                    <LimitField
                      label="Productos"
                      enabled={limitProducts}
                      onEnabledChange={setLimitProducts}
                      value={maxProducts}
                      onChange={(value) => setMaxProducts(toDigits(value).slice(0, 4))}
                      isInvalid={!isProductsValid}
                      hint={
                        limitProducts
                          ? `Entre ${productsRange.min} y ${productsRange.max}`
                          : "Sin límite de productos"
                      }
                    />
                    <LimitField
                      label="Imágenes en galería"
                      enabled={limitImages}
                      onEnabledChange={setLimitImages}
                      value={maxImages}
                      onChange={(value) => {
                        setImagesTouched(true);
                        setMaxImages(toDigits(value).slice(0, 5));
                      }}
                      isInvalid={!isImagesValid}
                      hint={
                        limitImages
                          ? `Entre ${imagesRange.min} y ${imagesRange.max}`
                          : "Sin límite de imágenes"
                      }
                      suggestion={
                        limitImages && suggestion !== null
                          ? {
                              value: suggestion,
                              label: `Sugerido: ${suggestion} imágenes (${productsValue} productos × ${perProduct} + ${extra} portadas)`,
                              isApplied: imagesValue === suggestion,
                              onApply: () => {
                                setImagesTouched(true);
                                setMaxImages(String(suggestion));
                              },
                            }
                          : undefined
                      }
                    />
                  </div>
                </FormSection>

                {isEdit && (
                  <FormSection
                    title="Envío de la tienda"
                    description="El servidor lo suma al total de cada compra en la tienda. Déjalo vacío si la tienda no cobra envío."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        value={shippingFee}
                        onChange={(value) => setShippingFee(toDigits(value).slice(0, 9))}
                      >
                        <Label>Costo de envío (pesos)</Label>
                        <Input inputMode="numeric" placeholder="Ej: 16900" />
                      </TextField>
                      <TextField
                        value={freeShippingFrom}
                        onChange={(value) => setFreeShippingFrom(toDigits(value).slice(0, 9))}
                        isDisabled={shippingFee === ""}
                      >
                        <Label>Envío gratis desde (pesos)</Label>
                        <Input inputMode="numeric" placeholder="Ej: 250000" />
                        <p className="mt-1 text-xs text-muted">
                          Valor de los productos antes del código promocional. Vacío = nunca gratis.
                        </p>
                      </TextField>
                    </div>
                  </FormSection>
                )}

                {isEdit && (
                  <FormSection
                    title="Vistas de pago"
                    description="La tienda puede desbloquearlas sola desde su panel (se suman a su plan de VendeYaOnline) o puedes activarlas aquí a mano. Si se desactiva una, la ve con candado; sus datos no se borran."
                  >
                    <div className="space-y-3">
                      {company?.billing_alert?.type === "subscription_cancelled" && (
                        <div className="space-y-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 text-xs">
                          <p className="font-semibold text-danger">
                            {company.billing_block_override ? "Panel desbloqueado a mano" : "Panel bloqueado por falta de pago"}
                          </p>
                          <p className="text-muted">
                            Mercado Pago canceló su suscripción de VendeYaOnline
                            {company.billing_alert.since
                              ? ` (${new Date(company.billing_alert.since).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })})`
                              : ""}
                            .{" "}
                            {company.billing_block_override
                              ? `Lo desbloqueaste el ${new Date(company.billing_block_override.at).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}; sigue así hasta que se suscriba de nuevo.`
                              : "Su tienda en línea sigue vendiendo; el panel se desbloquea solo cuando se suscriba de nuevo."}
                          </p>
                          <Switch isSelected={toggleBlock} onChange={setToggleBlock}>
                            <Switch.Content>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              {/* Texto simple (no Label): un label dentro del label del switch no lo activa al hacer clic. */}
                              <span className="text-xs">
                                {company.billing_block_override ? "Volver a bloquear el panel al guardar" : "Desbloquear el panel al guardar"}
                              </span>
                            </Switch.Content>
                          </Switch>
                        </div>
                      )}
                      <TextField
                        value={accountEmail}
                        onChange={(value) => setAccountEmail(value.slice(0, 254))}
                        type="email"
                        isInvalid={!isAccountEmailValid}
                        isDisabled={billedFeatures.length > 0}
                      >
                        <Label>Correo de su cuenta en vendeyaonline.com</Label>
                        <Input placeholder="dueno@tienda.com" autoComplete="off" maxLength={254} />
                        <p className={cn("mt-1 text-xs", isAccountEmailValid ? "text-muted" : "text-danger")}>
                          {!isAccountEmailValid
                            ? "Escribe un correo válido."
                            : billedFeatures.length > 0
                              ? "No se puede cambiar mientras tenga vistas cobradas en su suscripción."
                              : "Con este correo la tienda suma vistas a su suscripción desde su panel. Vacío = solo tú las activas."}
                        </p>
                      </TextField>
                      {(Object.keys(PAID_FEATURES) as PaidFeature[]).map((key) => (
                        <Switch
                          key={key}
                          isSelected={features.includes(key)}
                          onChange={(isSelected) =>
                            setFeatures((current) =>
                              isSelected ? [...current, key] : current.filter((feature) => feature !== key),
                            )
                          }
                        >
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            <div>
                              <Label>{PAID_FEATURES[key].label}</Label>
                              <p className="text-xs text-muted">{PAID_FEATURES[key].description}</p>
                              {billedFeatures.includes(key) && (
                                <p className={cn("text-xs", features.includes(key) ? "text-success" : "text-danger")}>
                                  {features.includes(key)
                                    ? `La activó la tienda: se cobra en su suscripción (+${PAID_FEATURES[key].price.toLocaleString("es-CO")} al mes).`
                                    : "Al guardar se quitará también de su suscripción."}
                                </p>
                              )}
                            </div>
                          </Switch.Content>
                        </Switch>
                      ))}
                      {features.includes("marketing") && (
                        <div className="space-y-1">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <TextField value={dailyLimit} onChange={(value) => setDailyLimit(toDigits(value).slice(0, 5))}>
                              <Label>Correos por día</Label>
                              <Input inputMode="numeric" placeholder="Global" />
                            </TextField>
                            <TextField value={hourlyLimit} onChange={(value) => setHourlyLimit(toDigits(value).slice(0, 5))}>
                              <Label>Correos por hora</Label>
                              <Input inputMode="numeric" placeholder="Global" />
                            </TextField>
                            <TextField value={monthlyLimit} onChange={(value) => setMonthlyLimit(toDigits(value).slice(0, 6))}>
                              <Label>Correos por mes</Label>
                              <Input inputMode="numeric" placeholder="Global" />
                            </TextField>
                          </div>
                          <p className="text-xs text-muted">
                            Límites de correos de campaña de esta tienda (hora de Colombia). WhatsApp no cuenta. Vacío = los
                            límites globales de Plataforma.
                          </p>
                        </div>
                      )}
                      {features.includes("marketing") && company?.marketing_pause && (
                        <div className="space-y-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 text-xs">
                          <p className="font-semibold text-danger">Campañas de correo pausadas</p>
                          <p className="text-muted">
                            Desde el {new Date(company.marketing_pause.at).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}:{" "}
                            {company.marketing_pause.sends} envíos, {company.marketing_pause.bounced} rebotes (
                            {(company.marketing_pause.bounce_rate * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })} %) y {company.marketing_pause.complained} quejas de spam (
                            {(company.marketing_pause.complaint_rate * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })} %). Se pausa con 2 % de rebotes o 0,3 % de quejas.
                            Reactívala cuando la tienda haya limpiado su lista; los rebotes anteriores dejan de contar.
                          </p>
                          <Switch isSelected={resumeMarketing} onChange={setResumeMarketing}>
                            <Switch.Content>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              <Label className="text-xs">Reactivar las campañas de correo al guardar</Label>
                            </Switch.Content>
                          </Switch>
                        </div>
                      )}
                      {features.includes("marketing") && (
                        <div className="space-y-2">
                          <TextField value={testEmail} onChange={(value) => setTestEmail(value.slice(0, 254))} type="email" isInvalid={!isTestEmailValid}>
                            <Label>Correo para pruebas</Label>
                            <Input placeholder="pruebas@tienda.com" autoComplete="off" maxLength={254} />
                            <p className={cn("mt-1 text-xs", isTestEmailValid ? "text-muted" : "text-danger")}>
                              {isTestEmailValid
                                ? `A este correo llegan los botones «Enviar prueba» de la tienda: máximo ${TEST_EMAILS_LIMIT}, no cuentan en sus límites. Vacío = la tienda no puede enviar pruebas.`
                                : "Escribe un correo válido."}
                            </p>
                          </TextField>
                          {company && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-secondary px-3 py-2 text-xs">
                              <span>
                                Pruebas usadas: <strong className="tabular-nums">{Math.min(company.marketing_test_sends, TEST_EMAILS_LIMIT)} de {TEST_EMAILS_LIMIT}</strong>
                              </span>
                              <Switch isSelected={resetTests} onChange={setResetTests} isDisabled={company.marketing_test_sends === 0}>
                                <Switch.Content>
                                  <Switch.Control>
                                    <Switch.Thumb />
                                  </Switch.Control>
                                  <Label className="text-xs">Devolverle las {TEST_EMAILS_LIMIT} pruebas al guardar</Label>
                                </Switch.Content>
                              </Switch>
                            </div>
                          )}
                        </div>
                      )}
                      {features.includes("marketing") && (
                        <TextField value={productPath} onChange={(value) => setProductPath(value.trim().slice(0, 120))}>
                          <Label>Ruta de un producto en la tienda</Label>
                          <Input className="font-mono text-sm" placeholder="/producto/{id}" />
                          <p className="mt-1 text-xs text-muted">
                            Para los botones «Comprar» de los correos. {"{id}"} = id del producto; {"{slug}"} = su nombre en la
                            URL. Ej.: Jarameni /producto/{"{id}"}, Muebles /products/{"{slug}"}-{"{id}"}. Vacío = /producto/{"{id}"}.
                          </p>
                        </TextField>
                      )}
                    </div>
                  </FormSection>
                )}

                {!isEdit && (
                  <FormSection
                    title="Usuario administrador"
                    description="Con este usuario el cliente entra al panel y puede crear a su equipo."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        value={adminUsername}
                        onChange={(value) => setAdminUsername(value.slice(0, MAX_USERNAME_LENGTH))}
                        isRequired
                        isInvalid={
                          adminUsername !== "" && adminUsername.trim().length < MIN_USERNAME_LENGTH
                        }
                      >
                        <Label>Nombre</Label>
                        <Input placeholder="Ej: Carlos Pérez" maxLength={MAX_USERNAME_LENGTH} />
                      </TextField>
                      <TextField
                        value={adminEmail}
                        onChange={setAdminEmail}
                        type="email"
                        isRequired
                        isInvalid={adminEmail !== "" && !isValidEmail(adminEmail.trim())}
                      >
                        <Label>Correo electrónico</Label>
                        <Input placeholder="admin@empresa.com" autoComplete="off" maxLength={120} />
                      </TextField>
                      <TextField
                        value={adminPassword}
                        onChange={(value) => setAdminPassword(value.slice(0, MAX_PASSWORD_LENGTH))}
                        type={showPassword ? "text" : "password"}
                        isRequired
                        isInvalid={adminPassword !== "" && adminPassword.length < MIN_PASSWORD_LENGTH}
                        className="min-w-0 sm:col-span-2"
                      >
                        <Label>Contraseña inicial</Label>
                        <InputGroup className="w-full min-w-0">
                          <InputGroup.Input
                            className="min-w-0"
                            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                            autoComplete="new-password"
                          />
                          <InputGroup.Suffix>
                            <button
                              type="button"
                              onClick={() => setShowPassword((visible) => !visible)}
                              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                              className="text-muted transition-colors hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </InputGroup.Suffix>
                        </InputGroup>
                        <p className="mt-1 text-xs text-muted">
                          Compártela con el cliente por un medio seguro; podrá cambiarla desde Usuarios.
                        </p>
                      </TextField>
                    </div>
                  </FormSection>
                )}
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
                <PendingButton
                  variant="primary"
                  type="submit"
                  isDisabled={!isValid}
                  isPending={isPending}
                  pendingLabel={isEdit ? "Guardando" : "Creando"}
                >
                  {isEdit ? "Guardar cambios" : "Crear empresa"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function LimitField({
  label,
  enabled,
  onEnabledChange,
  value,
  onChange,
  isInvalid,
  hint,
  suggestion,
}: {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  isInvalid: boolean;
  hint: string;
  /** Valor recomendado con un enlace para aplicarlo. */
  suggestion?: { value: number; label: string; isApplied: boolean; onApply: () => void };
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Switch isSelected={enabled} onChange={onEnabledChange}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-xs text-muted">Limitar</Label>
          </Switch.Content>
        </Switch>
      </div>
      <TextField
        value={value}
        onChange={onChange}
        isDisabled={!enabled}
        isInvalid={enabled && isInvalid}
        aria-label={label}
      >
        <Input inputMode="numeric" placeholder="—" />
      </TextField>
      <p className={cn("text-xs", enabled && isInvalid ? "text-danger" : "text-muted")}>{hint}</p>
      {suggestion && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">
          <span>{suggestion.label}</span>
          {suggestion.isApplied ? (
            <span className="font-medium">· aplicado</span>
          ) : (
            <button type="button" onClick={suggestion.onApply} className="font-medium underline">
              Usar sugerencia
            </button>
          )}
        </p>
      )}
    </div>
  );
}
