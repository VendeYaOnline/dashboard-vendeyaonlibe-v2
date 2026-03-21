"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ContactsTable } from "./contacts/contacts-table";
import { ContactDetailsModal } from "./contacts/contact-details-modal";
import { DeleteContactModal } from "./contacts/delete-contact-modal";
import { useQueryContacts } from "@/app/api/queries";
import { useMutationDeleteContact } from "@/app/api/mutations";
import { Contacts } from "@/interfaces/contacts";
import { toast } from "sonner";
import { handleAxiosError } from "@/lib/error-handler";

export function Mensajes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contacts | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contacts | null>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const {
    data: contactsData,
    isLoading,
    isFetching,
  } = useQueryContacts(currentPage, debouncedSearch);

  const deleteMutation = useMutationDeleteContact();

  const handleViewDetails = (contact: Contacts) => {
    setSelectedContact(contact);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClick = (contact: Contacts) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete?.id) {
      deleteMutation.mutate(contactToDelete.id, {
        onSuccess: () => {
          toast.success("Mensaje eliminado correctamente");
          setIsDeleteModalOpen(false);
          setContactToDelete(null);
        },
        onError: (error) => {
          handleAxiosError(error, "Error al eliminar el mensaje");
        },
      });
    }
  };

  const contacts = contactsData?.contacts || [];
  const totalPages = contactsData?.totalPages || 1;
  const totalItems = contactsData?.total || 0;
  const startIndex = (currentPage - 1) * 5;
  const endIndex = Math.min(startIndex + contacts.length, totalItems);

  return (
    <div className="min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Mensajes
              </h1>
              <p className="text-muted-foreground mt-1">
                Revisa los mensajes de contacto recibidos
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Buscar</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por asunto o email..."
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
          <ContactsTable
            contacts={contacts}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteClick}
            isLoading={isLoading || isFetching}
          />

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems}{" "}
                mensajes
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

        <ContactDetailsModal
          contact={selectedContact}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />

        <DeleteContactModal
          subject={contactToDelete?.subject || null}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
