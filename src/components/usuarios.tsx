"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
} from "lucide-react";
import { UsersTable } from "./users/users-table";
import { CreateUserModal } from "./users/create-user-modal";
import { UpdateUserModal } from "./users/update-user-modal";
import { UserDetailsModal } from "./users/user-details-modal";
import { DeleteUserModal } from "./users/delete-user-modal";
import { useQueryUsers } from "@/app/api/queries";
import {
  useMutationUser,
  useMutationUpdatedUser,
  useMutationDeleteUser,
} from "@/app/api/mutations";
import { Users as UsersType } from "@/interfaces/users";
import { toast } from "sonner";
import { handleAxiosError } from "@/lib/error-handler";
import { useAuthStore } from "@/store/auth.store";

export function Usuarios() {
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UsersType | null>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const {
    data: usersData,
    isLoading,
    isFetching,
  } = useQueryUsers(currentPage, debouncedSearch);

  const createMutation = useMutationUser();
  const updateMutation = useMutationUpdatedUser();
  const deleteMutation = useMutationDeleteUser();

  // --- Access guard ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8 flex items-start justify-center">
        <div className="flex flex-col items-center text-center gap-4 mt-20">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Acceso restringido
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Solo los usuarios con rol <strong>Administrador</strong> pueden
            gestionar los usuarios del sistema.
          </p>
        </div>
      </div>
    );
  }

  const handleViewDetails = (user: UsersType) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (user: UsersType) => {
    setSelectedUser(user);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (user: UsersType) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateUser = (data: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Usuario creado correctamente");
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        handleAxiosError(error, "Error al crear el usuario");
      },
    });
  };

  const handleUpdateUser = (
    id: string,
    data: { username: string; email: string; role: string },
  ) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast.success("Usuario actualizado correctamente");
          setIsUpdateModalOpen(false);
          setSelectedUser(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al actualizar el usuario");
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (userToDelete?.id) {
      deleteMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          toast.success("Usuario eliminado correctamente");
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al eliminar el usuario");
        },
      });
    }
  };

  const users = usersData?.users || [];
  const totalPages = usersData?.totalPages || 1;
  const totalItems = usersData?.total || 0;
  const startIndex = (currentPage - 1) * 5;
  const endIndex = Math.min(startIndex + users.length, totalItems);

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Usuarios
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los usuarios del sistema
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear Usuario
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-[300px]"
              />
            </div>
          </CardHeader>
        </Card>

        <div className="overflow-x-auto bg-white rounded-md border">
          <UsersTable
            users={users}
            selfEmail={authUser?.email}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems} usuarios
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <div className="text-sm font-medium">
                  Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <CreateUserModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateUser={handleCreateUser}
          isLoading={createMutation.isPending}
        />

        <UpdateUserModal
          user={selectedUser}
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          onUpdateUser={handleUpdateUser}
          isLoading={updateMutation.isPending}
        />

        <UserDetailsModal
          user={selectedUser}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />

        <DeleteUserModal
          username={userToDelete?.username || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
