"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Contacts } from "@/interfaces/contacts";

interface ContactDetailsModalProps {
  contact: Contacts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsModal({
  contact,
  open,
  onOpenChange,
}: ContactDetailsModalProps) {
  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-primary text-primary-foreground p-6 mt-4 rounded-lg text-xl">
            Detalle del Mensaje
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Asunto
            </p>
            <p className="text-sm font-medium">{contact.subject}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Email
            </p>
            <p className="text-sm font-medium">{contact.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Mensaje
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {contact.message}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
