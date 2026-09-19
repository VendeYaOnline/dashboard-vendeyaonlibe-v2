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

  const isValid = isNameValid && isProductsValid && isImagesValid && isAdminValid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    const limits = {
      max_products: limitProducts ? productsValue : null,
      max_images: limitImages ? imagesValue : null,
    };
    if (isEdit) {
      onUpdate(company.id, { name: nameTrimmed, ...limits });
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
                    ? "Cambia el nombre o los topes del plan. El uso actual no se toca."
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          ? imagesTouched
                            ? `Entre ${imagesRange.min} y ${imagesRange.max}`
                            : "Sugerido según los productos"
                          : "Sin límite de imágenes"
                      }
                    />
                  </div>
                </FormSection>

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
}: {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  isInvalid: boolean;
  hint: string;
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
    </div>
  );
}
