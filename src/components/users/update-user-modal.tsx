"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "@/interfaces/users";

interface UpdateUserModalProps {
  user: Users | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateUser: (
    id: string,
    data: { username: string; email: string; role: string },
  ) => void;
  isLoading: boolean;
}

export function UpdateUserModal({
  user,
  open,
  onOpenChange,
  onUpdateUser,
  isLoading,
}: UpdateUserModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim() || !email.trim()) return;
    onUpdateUser(user.id, {
      username: username.trim(),
      email: email.trim(),
      role,
    });
  };

  const isValid = username.trim() && email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Actualizar Usuario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="updateUsername">Nombre de usuario</Label>
            <Input
              id="updateUsername"
              placeholder="Ej: juan_perez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="updateEmail">Correo electrónico</Label>
            <Input
              id="updateEmail"
              type="email"
              placeholder="Ej: juan@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="updateRole">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="updateRole" className="w-full">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Espectador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading ? "Actualizando..." : "Actualizar Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
