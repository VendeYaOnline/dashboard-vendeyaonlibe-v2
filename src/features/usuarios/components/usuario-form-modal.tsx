"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import {
  Button,
  Input,
  InputGroup,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  TextField,
  cn,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { PendingButton } from "@/components/shared/pending-button";
import { ROLE_LABELS } from "@/config/navigation";
import type { Users } from "@/interfaces/users";
import {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  ROLES,
  ROLE_DESCRIPTIONS,
  isValidEmail,
} from "../constants";

export interface UsuarioFormValues {
  username: string;
  email: string;
  /** En edición, vacío = conservar la contraseña actual. */
  password: string;
  role: string;
}

interface UsuarioFormModalProps {
  /** null = crear, con valor = editar */
  user: Users | null;
  /** true cuando el usuario editado es el que ha iniciado sesión. */
  isSelf?: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: UsuarioFormValues) => void;
  isPending: boolean;
}

export function UsuarioFormModal({
  user,
  isSelf = false,
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: UsuarioFormModalProps) {
  const isEdit = user !== null;
  const state = useOverlayState({ isOpen, onOpenChange });

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>("viewer");

  useEffect(() => {
    if (!isOpen) return;
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "viewer");
    setPassword("");
    setShowPassword(false);
  }, [isOpen, user]);

  const usernameTrimmed = username.trim();
  const emailTrimmed = email.trim();
  const isUsernameValid =
    usernameTrimmed.length >= MIN_USERNAME_LENGTH && usernameTrimmed.length <= MAX_USERNAME_LENGTH;
  const isEmailValid = isValidEmail(emailTrimmed);
  // Crear exige contraseña; editar la admite opcionalmente (vacía = sin cambio).
  const isPasswordValid = password === "" ? isEdit : password.length >= MIN_PASSWORD_LENGTH;
  const isValid = isUsernameValid && isEmailValid && isPasswordValid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({ username: usernameTrimmed, email: emailTrimmed, password, role });
  };

  const passwordField = (
    <TextField
      value={password}
      onChange={setPassword}
      type={showPassword ? "text" : "password"}
      isRequired={!isEdit}
      isInvalid={password !== "" && password.length < MIN_PASSWORD_LENGTH}
      className={cn("min-w-0", isEdit && "sm:col-span-2")}
    >
      <Label>{isEdit ? "Nueva contraseña" : "Contraseña"}</Label>
      <InputGroup className="w-full min-w-0">
        <InputGroup.Input
          className="min-w-0"
          placeholder={isEdit ? "Déjala vacía para no cambiarla" : `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
          autoComplete="new-password"
          maxLength={72}
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
        {password !== "" && password.length < MIN_PASSWORD_LENGTH
          ? `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
          : isEdit
            ? "Solo se cambia si escribes una nueva."
            : `Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Compártela con la persona por un medio seguro.`}
      </p>
    </TextField>
  );

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!isPending}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <form onSubmit={handleSubmit}>
              <ModalFormHeader
                icon={UserPlus}
                title={isEdit ? "Editar usuario" : "Crear usuario"}
                description={
                  isEdit
                    ? "Actualiza sus datos y el rol con el que accede al panel."
                    : "Da acceso al panel y define qué podrá gestionar según su rol."
                }
              />

              <Modal.Body>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    value={username}
                    onChange={(value) => setUsername(value.slice(0, MAX_USERNAME_LENGTH))}
                    isRequired
                    isInvalid={username !== "" && !isUsernameValid}
                    autoFocus
                  >
                    <Label>Nombre de usuario</Label>
                    <Input placeholder="Ej: maria.gomez" maxLength={MAX_USERNAME_LENGTH} />
                    <p className="mt-1 text-xs text-muted">
                      {username !== "" && !isUsernameValid
                        ? `Entre ${MIN_USERNAME_LENGTH} y ${MAX_USERNAME_LENGTH} caracteres.`
                        : `${usernameTrimmed.length}/${MAX_USERNAME_LENGTH}`}
                    </p>
                  </TextField>

                  <Select
                    selectedKey={role}
                    onSelectionChange={(key) => setRole(String(key))}
                    isDisabled={isSelf}
                  >
                    <Label>Rol</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {ROLES.map((value) => (
                          <ListBoxItem key={value} id={value}>
                            {ROLE_LABELS[value]}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <p className="mt-1 text-xs text-muted">
                      {isSelf ? "No puedes cambiar tu propio rol." : ROLE_DESCRIPTIONS[role]}
                    </p>
                  </Select>

                  <TextField
                    value={email}
                    onChange={setEmail}
                    type="email"
                    isRequired
                    isInvalid={email !== "" && !isEmailValid}
                    className={isEdit ? "sm:col-span-2" : undefined}
                  >
                    <Label>Correo electrónico</Label>
                    <Input placeholder="usuario@empresa.com" autoComplete="off" maxLength={120} />
                    {email !== "" && !isEmailValid && (
                      <p className="mt-1 text-xs text-danger">Escribe un correo válido.</p>
                    )}
                  </TextField>

                  {passwordField}
                </div>
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
                  pendingLabel="Guardando"
                >
                  {isEdit ? "Guardar cambios" : "Crear usuario"}
                </PendingButton>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
