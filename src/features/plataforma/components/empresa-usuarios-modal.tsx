"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Edit2, Plus, Trash2, Users as UsersIcon, X } from "lucide-react";
import { Button, Chip, Modal, Spinner, toast, useOverlayState } from "@heroui/react";
import { IconAction } from "@/components/shared/icon-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQueryCompanyUsers } from "@/app/api/queries";
import {
  useMutationCreateCompanyUser,
  useMutationDeleteCompanyUser,
  useMutationUpdateCompanyUser,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { ROLE_LABELS } from "@/config/navigation";
import type { PlatformCompany } from "@/interfaces/platform";
import type { Users } from "@/interfaces/users";
import { UsuarioFormModal, type UsuarioFormValues } from "@/features/usuarios/components/usuario-form-modal";

interface EmpresaUsuariosModalProps {
  /** Empresa cuyos usuarios se gestionan; null = cerrado. */
  company: PlatformCompany | null;
  onClose: () => void;
}

const ROLE_COLOR = { admin: "accent", editor: "success", viewer: "default" } as const;

/** Contraseña que se acaba de fijar: se muestra una vez para copiarla y entregarla. */
interface IssuedCredentials {
  title: string;
  email: string;
  password: string;
}

/**
 * Usuarios de una empresa vistos por el superadmin: reemplazar a un
 * administrador perdido, cambiar una contraseña o dar de baja a alguien. El
 * backend cierra las sesiones abiertas de quien cambie de contraseña, correo o
 * rol, o sea eliminado.
 */
export function EmpresaUsuariosModal({ company, onClose }: EmpresaUsuariosModalProps) {
  const state = useOverlayState({ isOpen: company !== null, onOpenChange: (open) => !open && handleClose() });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Users | null>(null);
  const [toDelete, setToDelete] = useState<Users | null>(null);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  const companyId = company?.id ?? null;
  const { data, isLoading, isError, refetch } = useQueryCompanyUsers(companyId);
  const createMutation = useMutationCreateCompanyUser();
  const updateMutation = useMutationUpdateCompanyUser();
  const deleteMutation = useMutationDeleteCompanyUser();

  const users = data?.users ?? [];
  const adminCount = users.filter((user) => user.role === "admin").length;

  const handleClose = () => {
    setIsFormOpen(false);
    setEditing(null);
    setToDelete(null);
    setIssued(null);
    onClose();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado");
    } catch {
      toast.danger("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  };

  const handleSubmit = (values: UsuarioFormValues) => {
    if (!companyId) return;
    const { username, email, role, password } = values;

    if (!editing) {
      createMutation.mutate(
        { companyId, data: { username, email, role, password } },
        {
          onSuccess: () => {
            toast.success("Usuario creado");
            setIsFormOpen(false);
            setIssued({ title: `Usuario creado: ${username}`, email, password });
          },
          onError: (error) => handleAxiosError(error, "No se pudo crear el usuario"),
        },
      );
      return;
    }

    updateMutation.mutate(
      { companyId, id: editing.id, data: { username, email, role, ...(password ? { password } : {}) } },
      {
        onSuccess: () => {
          const revoked = Boolean(password) || email !== editing.email || role !== editing.role;
          toast.success(
            revoked ? "Usuario actualizado. Sus sesiones abiertas se cerraron." : "Usuario actualizado",
          );
          setIsFormOpen(false);
          if (password) setIssued({ title: `Contraseña cambiada: ${username}`, email, password });
          setEditing(null);
        },
        onError: (error) => handleAxiosError(error, "No se pudo actualizar el usuario"),
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!companyId || !toDelete) return;
    deleteMutation.mutate(
      { companyId, id: toDelete.id },
      {
        onSuccess: () => {
          toast.success("Usuario eliminado. Su sesión se cerró.");
          setToDelete(null);
        },
        onError: (error) => handleAxiosError(error, "No se pudo eliminar el usuario"),
      },
    );
  };

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop isDismissable={!isFormOpen && toDelete === null}>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-2xl">
              <ModalFormHeader
                icon={UsersIcon}
                title={`Usuarios · ${company?.name ?? ""}`}
                description="Reemplaza al administrador, cambia contraseñas o da de baja a quien ya no deba entrar."
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => {
                      setEditing(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Nuevo usuario
                  </Button>
                }
              />

              <Modal.Body className="space-y-4">
                {issued && (
                  <section className="space-y-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm" aria-live="polite">
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex items-center gap-2 font-medium text-success">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {issued.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIssued(null)}
                        aria-label="Cerrar aviso"
                        className="text-muted transition-colors hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-muted">
                      Copia la contraseña y entrégala por un medio seguro: <strong>no se vuelve a mostrar</strong>.
                    </p>
                    <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1">
                      <dt className="text-muted">Correo</dt>
                      <dd className="min-w-0 truncate font-medium">{issued.email}</dd>
                      <Button size="sm" variant="ghost" isIconOnly aria-label="Copiar correo" onPress={() => handleCopy(issued.email)}>
                        <Copy className="size-4" />
                      </Button>
                      <dt className="text-muted">Contraseña</dt>
                      <dd className="min-w-0 break-all font-mono font-medium">{issued.password}</dd>
                      <Button size="sm" variant="ghost" isIconOnly aria-label="Copiar contraseña" onPress={() => handleCopy(issued.password)}>
                        <Copy className="size-4" />
                      </Button>
                    </dl>
                  </section>
                )}

                {data && adminCount === 0 && (
                  <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    Esta empresa no tiene administrador. Crea uno con «Nuevo usuario» para que pueda entrar al panel.
                  </p>
                )}

                {isError ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="text-sm text-muted">No se pudieron cargar los usuarios.</p>
                    <Button variant="secondary" onPress={() => refetch()}>
                      Reintentar
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
                    <Spinner size="sm" />
                    Cargando usuarios...
                  </div>
                ) : users.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">Esta empresa no tiene usuarios.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                    {users.map((user) => {
                      const isOnlyAdmin = user.role === "admin" && adminCount <= 1;
                      return (
                        <li key={user.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent">
                            {user.username.slice(0, 2)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{user.username}</p>
                            <p className="truncate text-xs text-muted">{user.email}</p>
                          </div>
                          <Chip size="sm" variant="soft" color={ROLE_COLOR[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Chip>
                          <div className="flex shrink-0 gap-1">
                            <IconAction
                              tooltip="Editar o cambiar contraseña"
                              aria-label={`Editar ${user.username}`}
                              onPress={() => {
                                setEditing(user);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit2 className="size-4" />
                            </IconAction>
                            <IconAction
                              tooltip={
                                isOnlyAdmin
                                  ? "Es el único administrador: crea otro antes de eliminarlo"
                                  : "Eliminar usuario"
                              }
                              aria-label={`Eliminar ${user.username}`}
                              className="text-danger"
                              isDisabled={isOnlyAdmin}
                              onPress={() => setToDelete(user)}
                            >
                              <Trash2 className="size-4" />
                            </IconAction>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <p className="text-xs text-muted">
                  Cambiar la contraseña, el correo o el rol de un usuario, o eliminarlo, cierra sus sesiones abiertas
                  de inmediato.
                </p>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="ghost" onPress={handleClose}>
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {isFormOpen && (
        <UsuarioFormModal
          user={editing}
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditing(null);
          }}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
          allowGenerate
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        description={
          <>
            ¿Seguro que deseas eliminar a{" "}
            <span className="font-semibold text-foreground">{toDelete?.username}</span> ({toDelete?.email})? Su sesión
            se cerrará de inmediato. Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
