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
import { Trash2, Eye } from "lucide-react";
import { Contacts } from "@/interfaces/contacts";

interface ContactsTableProps {
  contacts: Contacts[];
  onViewDetails: (contact: Contacts) => void;
  onDelete: (contact: Contacts) => void;
  isLoading?: boolean;
}

export function ContactsTable({
  contacts,
  onViewDetails,
  onDelete,
  isLoading,
}: ContactsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold pl-3 w-12">#</TableHead>
          <TableHead className="font-semibold">Asunto</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="font-semibold text-right pr-4">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground p-8"
            >
              Cargando mensajes...
            </TableCell>
          </TableRow>
        ) : contacts.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground p-8"
            >
              No se encontraron mensajes
            </TableCell>
          </TableRow>
        ) : (
          contacts.map((contact, index) => (
            <TableRow key={contact.id} className="hover:bg-muted/30">
              <TableCell className="pl-3 text-muted-foreground text-sm">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">{contact.subject}</TableCell>
              <TableCell className="text-muted-foreground">
                {contact.email}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(contact)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(contact)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
