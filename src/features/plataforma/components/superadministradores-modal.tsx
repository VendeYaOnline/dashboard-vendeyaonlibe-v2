"use client";

import { useState } from "react";
import { Crown, Edit2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Button, Chip, Modal, Spinner, toast, useOverlayState } from "@heroui/react";
import { IconAction } from "@/components/shared/icon-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ModalFormHeader } from "@/components/shared/modal-form-header";
import { useQuerySuperadmins } from "@/app/api/queries";
import {
  useMutationCreateSuperadmin,
  useMutationDeleteSuperadmin,
  useMutationUpdateSuperadmin,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import type { Superadmin } from "@/interfaces/platform";
import { UsuarioFormModal, type UsuarioFormValues } from "@/features/usuarios/components/usuario-form-modal";
import { IssuedCredentialsNotice, type IssuedCredentials } from "./issued-credentials";

interface SuperadministradoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Superadministradores de la plataforma. Solo lo abre el propietario (el
 * backend también lo exige): un superadmin ve y gestiona TODAS las empresas,
 * así que solo se crea para personas de confianza. Eliminar a alguien o
 * cambiarle la contraseña o el correo cierra sus sesiones al instante.
 */
export function SuperadministradoresModal({ isOpen, onClose }: SuperadministradoresModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => !open && handleClose() });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Superadmin | null>(null);
  const [toDelete, setToDelete] = useState<Superadmin | null>(null);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  const { data, isLoading, isError, refetch } = useQuerySuperadmins(isOpen);
  const createMutation = useMutationCreateSuperadmin();
  const updateMutation = useMutationUpdateSuperadmin();
  const deleteMutation = useMutationDeleteSuperadmin();

  const superadmins = data?.superadmins ?? [];

  const handleClose = () => {
    setIsFormOpen(false);
    setEditing(null);
    setToDelete(null);
    setIssued(null);
    onClose();
  };

  const handleSubmit = (values: UsuarioFormValues) => {
    const { username, email, password } = values;

    if (!editing) {
      createMutation.mutate(
        { username, email, password },
        {
          onSuccess: () => {
            toast.success("Superadministrador creado");
            setIsFormOpen(false);
            setIssued({ title: `Superadministrador creado: ${username}`, email, password });
          },
          onError: (error) => handleAxiosError(error, "No se pudo crear el superadministrador"),
        },
      );
      return;
    }

    updateMutation.mutate(
      { id: editing.id, data: { username, email, ...(password ? { password } : {}) } },
      {
        onSuccess: () => {
          const revoked = Boolean(password) || email !== editing.email;
          toast.success(revoked ? "Actualizado. Sus sesiones abiertas se cerraron." : "Actualizado");
          setIsFormOpen(false);
          if (password) setIssued({ title: `Contraseña cambiada: ${username}`, email, password });
          setEditing(null);
        },
        onError: (error) => handleAxiosError(error, "No se pudo actualizar el superadministrador"),
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Superadministrador eliminado. Su sesión se cerró.");
        setToDelete(null);
        setIssued(null);
      },
      onError: (error) => handleAxiosError(error, "No se pudo eliminar el superadministrador"),
    });
  };

  return (
    <>
      <Modal state={state}>
        <Modal.Backdrop isDismissable={!isFormOpen && toDelete === null}>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="max-w-2xl">
              <ModalFormHeader
                icon={ShieldCheck}
                title="Superadministradores"
                description="Quienes pueden gestionar todas las empresas de la plataforma. Solo tú, como propietario, ves y administras esta lista."
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
                    Nuevo
                  </Button>
                }
              />

              <Modal.Body className="space-y-4">
                {issued && <IssuedCredentialsNotice credentials={issued} onDismiss={() => setIssued(null)} />}

                {isError ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="text-sm text-muted">No se pudieron cargar los superadministradores.</p>
                    <Button variant="secondary" onPress={() => refetch()}>
                      Reintentar
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
                    <Spinner size="sm" />
                    Cargando superadministradores...
                  </div>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                    {superadmins.map((superadmin) => (
                      <li key={superadmin.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent">
                          {superadmin.username.slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{superadmin.username}</p>
                          <p className="truncate text-xs text-muted">{superadmin.email}</p>
                        </div>
                        {superadmin.is_owner && (
                          <Chip size="sm" variant="soft" color="warning">
                            <Crown className="mr-1 size-3" />
                            Propietario
                          </Chip>
                        )}
                        <div className="flex shrink-0 gap-1">
                          <IconAction
                            tooltip="Editar o cambiar contraseña"
                            aria-label={`Editar ${superadmin.username}`}
                            onPress={() => {
                              setEditing(superadmin);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 className="size-4" />
                          </IconAction>
                          <IconAction
                            tooltip={
                              superadmin.is_owner
                                ? "El propietario no se puede eliminar"
                                : "Eliminar superadministrador"
                            }
                            aria-label={`Eliminar ${superadmin.username}`}
                            className="text-danger"
                            isDisabled={superadmin.is_owner}
                            onPress={() => setToDelete(superadmin)}
                          >
                            <Trash2 className="size-4" />
                          </IconAction>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-xs text-muted">
                  Un superadministrador ve los datos de todas las tiendas: créalo solo para personas de confianza.
                  Eliminarlo, o cambiarle la contraseña o el correo, cierra sus sesiones abiertas de inmediato.
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
          hideRole
          lockEmail={editing?.is_owner ?? false}
        />
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar superadministrador"
        description={
          <>
            ¿Seguro que deseas eliminar a{" "}
            <span className="font-semibold text-foreground">{toDelete?.username}</span> ({toDelete?.email})? Perderá
            el acceso y su sesión se cerrará de inmediato. Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
