"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Eye } from "lucide-react";
import { Users } from "@/interfaces/users";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Espectador",
};

interface UsersTableProps {
  users: Users[];
  selfEmail: string | undefined;
  onViewDetails: (user: Users) => void;
  onEdit: (user: Users) => void;
  onDelete: (user: Users) => void;
  isLoading?: boolean;
}

export function UsersTable({
  users,
  selfEmail,
  onViewDetails,
  onEdit,
  onDelete,
  isLoading,
}: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold pl-3 w-12">#</TableHead>
          <TableHead className="font-semibold">Usuario</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="font-semibold">Rol</TableHead>
          <TableHead className="font-semibold text-right pr-4">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground p-8"
            >
              Cargando usuarios...
            </TableCell>
          </TableRow>
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron usuarios
            </TableCell>
          </TableRow>
        ) : (
          users.map((user, index) => {
            const isSelf = user.email === selfEmail;
            return (
              <TableRow key={user.id} className="hover:bg-muted/30">
                <TableCell className="pl-3 text-muted-foreground text-sm">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.username}
                    {isSelf && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        Tú
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Ver detalles — siempre disponible */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(user)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Editar — deshabilitado para el propio usuario */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => !isSelf && onEdit(user)}
                      disabled={isSelf}
                      title={
                        isSelf ? "No puedes editar tu propio perfil" : undefined
                      }
                      className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    {/* Eliminar — deshabilitado para el propio usuario */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => !isSelf && onDelete(user)}
                      disabled={isSelf}
                      title={
                        isSelf
                          ? "No puedes eliminar tu propio perfil"
                          : undefined
                      }
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
