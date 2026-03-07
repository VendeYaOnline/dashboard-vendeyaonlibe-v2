"use client";

import { useState, useCallback, useMemo } from "react";
import type { ImageItem, Images, Category } from "@/lib/types";
import { initialMockImages } from "@/lib/mock-data";

const ITEMS_PER_PAGE = 8;

export function useImages() {
  const [allImages, setAllImages] = useState<ImageItem[]>(initialMockImages);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category>("all");

  const filteredImages = useMemo(() => {
    let result = allImages;

    if (categoryFilter !== "all") {
      result = result.filter((img) => img.category === categoryFilter);
    }

    if (searchQuery) {
      result = result.filter((img) =>
        img.Key.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return result;
  }, [allImages, searchQuery, categoryFilter]);

  const paginatedData: Images = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedImages = filteredImages.slice(startIndex, endIndex);

    return {
      images: paginatedImages,
      total: paginatedImages.length,
      grandTotal: allImages.length,
      page,
      totalPages: Math.ceil(filteredImages.length / ITEMS_PER_PAGE),
    };
  }, [filteredImages, page, allImages.length]);

  const addImage = useCallback((image: ImageItem) => {
    setAllImages((prev) => [image, ...prev]);
    setPage(1);
  }, []);

  const updateImage = useCallback((key: string, newKey: string) => {
    setAllImages((prev) =>
      prev.map((img) =>
        img.Key === key
          ? { ...img, Key: newKey, LastModified: new Date().toISOString() }
          : img,
      ),
    );
  }, []);

  const deleteImage = useCallback((key: string) => {
    setAllImages((prev) => prev.filter((img) => img.Key !== key));
  }, []);

  const deleteMultiple = useCallback((keys: string[]) => {
    setAllImages((prev) => prev.filter((img) => !keys.includes(img.Key)));
  }, []);

  return {
    data: paginatedData,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addImage,
    updateImage,
    deleteImage,
    deleteMultiple,
  };
}
