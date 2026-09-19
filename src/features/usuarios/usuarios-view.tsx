"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, cn, toast } from "@heroui/react";
import { Edit2, Plus, ShieldOff, Trash2, Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchField } from "@/components/shared/search-field";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryUsers } from "@/app/api/queries";
import {
  useMutationDeleteUser,
  useMutationUpdatedUser,
  useMutationUser,
} from "@/app/api/mutations";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_LABELS } from "@/config/navigation";
import type { Users } from "@/interfaces/users";
import {
  UsuarioFormModal,
  type UsuarioFormValues,
} from "./components/usuario-form-modal";

const ROLE_COLOR = {
  admin: "accent",
  editor: "success",
  viewer: "default",
} as const;

export function UsuariosView() {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === "admin";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Users | null>(null);
  const [toDelete, setToDelete] = useState<Users | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useQueryUsers(page, debouncedSearch);
  const createMutation = useMutationUser();
  const updateMutation = useMutationUpdatedUser();
  const deleteMutation = useMutationDeleteUser();

  const users = data?.users ?? [];
  const grandTotal = data?.grandTotal ?? 0;
  const isSelfUser = (user: Users | null) => Boolean(user && user.email === authUser?.email);

  const handleSubmit = (values: UsuarioFormValues) => {
    if (selected) {
      const { username, email, role, password } = values;
      updateMutation.mutate(
        {
          id: selected.id,
          data: { username, email, role, ...(password ? { password } : {}) },
        },
        {
          onSuccess: () => {
            toast.success(
              password
                ? "Usuario actualizado y contraseña cambiada"
                : "Usuario actualizado correctamente",
            );
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) => handleAxiosError(error, "Error al actualizar el usuario"),
        },
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Usuario creado correctamente");
        setIsFormOpen(false);
      },
      onError: (error) => handleAxiosError(error, "Error al crear el usuario"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Usuario eliminado correctamente");
        setToDelete(null);
      },
      onError: (error) => handleAxiosError(error, "Error al eliminar el usuario"),
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-danger-soft">
          <ShieldOff className="size-10 text-danger" />
        </div>
        <h2 className="text-2xl font-bold">Acceso restringido</h2>
        <p className="max-w-sm text-muted">
          Solo los usuarios con rol <strong>Administrador</strong> pueden gestionar
          los usuarios del sistema.
        </p>
      </div>
    );
  }

  const columns: DataTableColumn<Users>[] = [
    {
      key: "username",
      label: "Usuario",
      isRowHeader: true,
      render: (user) => (
        <span className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent">
            {user.username.slice(0, 2)}
          </span>
          <span className="font-medium">{user.username}</span>
          {isSelfUser(user) && (
            <Chip size="sm" variant="soft" color="accent">
              Tú
            </Chip>
          )}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (user) => <span className="text-muted">{user.email}</span>,
    },
    {
      key: "role",
      label: "Rol",
      render: (user) => (
        <Chip size="sm" variant="soft" color={ROLE_COLOR[user.role] ?? "default"}>
          {ROLE_LABELS[user.role] ?? user.role}
        </Chip>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "end",
      render: (user) => {
        // Nadie se elimina a sí mismo (el backend también lo bloquea).
        const isSelf = isSelfUser(user);

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label={`Editar ${user.username}`}
              onPress={() => {
                setSelected(user);
                setIsFormOpen(true);
              }}
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              aria-label={`Eliminar ${user.username}`}
              className="text-danger"
              isDisabled={isSelf}
              onPress={() => setToDelete(user)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UsersIcon}
        title="Usuarios"
        description={
          grandTotal === 0
            ? "Gestiona quién accede al panel"
            : `${grandTotal} ${grandTotal === 1 ? "usuario con acceso" : "usuarios con acceso"} al panel`
        }
        actions={
          <Button
            variant="primary"
            onPress={() => {
              setSelected(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Crear usuario
          </Button>
        }
      />

      <Card>
        <Card.Content className="p-4">
          <SearchField
            aria-label="Buscar usuarios"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={setSearch}
          />
        </Card.Content>
      </Card>

      {/* Al paginar o buscar, la página anterior sigue visible (atenuada) hasta que llega la nueva. */}
      <Card
        className={cn("overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")}
        aria-busy={isPlaceholderData}
      >
        <DataTable
          aria-label="Usuarios"
          items={users}
          columns={columns}
          getRowId={(user) => user.id}
          isLoading={isLoading}
          loadingMessage="Cargando usuarios..."
          emptyMessage={
            debouncedSearch ? "Ningún usuario coincide con la búsqueda" : "Aún no hay usuarios"
          }
        />
        <TablePagination
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          totalItems={data?.total ?? 0}
          itemsInPage={users.length}
          itemLabel="usuarios"
          onPageChange={setPage}
        />
      </Card>

      <UsuarioFormModal
        user={selected}
        isSelf={isSelfUser(selected)}
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelected(null);
        }}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        description={
          <>
            ¿Seguro que deseas eliminar a{" "}
            <span className="font-semibold text-foreground">
              {toDelete?.username}
            </span>
            ? Esta acción no se puede deshacer.
          </>
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
