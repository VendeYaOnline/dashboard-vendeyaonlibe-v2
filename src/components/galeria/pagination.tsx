"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  grandTotal: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  grandTotal,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const showEllipsisStart = page > 3;
    const showEllipsisEnd = page < totalPages - 2;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (showEllipsisStart) {
        pages.push("...");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (showEllipsisEnd) {
        pages.push("...");
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{total}</span>{" "}
        de <span className="font-medium text-foreground">{grandTotal}</span>{" "}
        imágenes
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageNum, index) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "secondary"}
              size="icon"
              onClick={() => onPageChange(pageNum)}
              className="h-9 w-9"
            >
              {pageNum}
            </Button>
          ),
        )}

        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
