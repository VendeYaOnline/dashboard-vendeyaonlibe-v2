"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { ROLE_LABELS } from "@/config/navigation";
import type { Users } from "@/interfaces/users";
import { PendingButton } from "@/components/shared/pending-button";

export interface UsuarioFormValues {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface UsuarioFormModalProps {
  /** null = crear, con valor = editar (sin contraseña) */
  user: Users | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: UsuarioFormValues) => void;
  isPending: boolean;
}

const ROLES = ["admin", "editor", "viewer"] as const;

export function UsuarioFormModal({
  user,
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
  const [role, setRole] = useState<string>("viewer");

  useEffect(() => {
    if (!isOpen) return;
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "viewer");
    setPassword("");
  }, [isOpen, user]);

  // En edición la contraseña no se envía, así que no se pide.
  const isValid =
    username.trim() !== "" &&
    email.trim() !== "" &&
    (isEdit || password.trim() !== "");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
      role,
    });
  };

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
                  <TextField value={username} onChange={setUsername} isRequired autoFocus>
                    <Label>Nombre de usuario</Label>
                    <Input placeholder="Ej: maria.gomez" />
                  </TextField>

                  <Select selectedKey={role} onSelectionChange={(key) => setRole(String(key))}>
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
                  </Select>

                  <TextField
                    value={email}
                    onChange={setEmail}
                    type="email"
                    isRequired
                    className={isEdit ? "sm:col-span-2" : undefined}
                  >
                    <Label>Correo electrónico</Label>
                    <Input placeholder="usuario@empresa.com" />
                  </TextField>

                  {!isEdit && (
                    <TextField value={password} onChange={setPassword} type="password" isRequired>
                      <Label>Contraseña</Label>
                      <Input placeholder="Mínimo 8 caracteres" />
                    </TextField>
                  )}
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
                <PendingButton variant="primary" type="submit" isDisabled={!isValid} isPending={isPending} pendingLabel="Guardando">
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
