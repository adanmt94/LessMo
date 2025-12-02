/**
 * Hook optimizado para listas con paginación, búsqueda y ordenamiento
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { logger, LogCategory } from '../utils/logger';

interface UseListOptions<T> {
  items: T[];
  pageSize?: number;
  searchFields?: (keyof T)[];
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  filterFn?: (item: T) => boolean;
}

export function useList<T extends Record<string, any>>({
  items,
  pageSize = 20,
  searchFields = [],
  sortBy,
  sortDirection = 'asc',
  filterFn,
}: UseListOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSortBy, setCurrentSortBy] = useState<keyof T | undefined>(sortBy);
  const [currentSortDirection, setCurrentSortDirection] = useState<'asc' | 'desc'>(sortDirection);

  /**
   * Filtrar items por búsqueda
   */
  const filteredItems = useMemo(() => {
    let result = items;

    // Filtro personalizado
    if (filterFn) {
      result = result.filter(filterFn);
    }

    // Búsqueda por texto
    if (searchQuery.trim() && searchFields.length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    logger.debug(LogCategory.UI, 'Items filtrados', { 
      total: items.length, 
      filtered: result.length,
      searchQuery 
    });

    return result;
  }, [items, searchQuery, searchFields, filterFn]);

  /**
   * Ordenar items
   */
  const sortedItems = useMemo(() => {
    if (!currentSortBy) {
      return filteredItems;
    }

    const sorted = [...filteredItems].sort((a, b) => {
      const aValue = a[currentSortBy];
      const bValue = b[currentSortBy];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    logger.debug(LogCategory.UI, 'Items ordenados', { 
      sortBy: currentSortBy, 
      direction: currentSortDirection 
    });

    return sorted;
  }, [filteredItems, currentSortBy, currentSortDirection]);

  /**
   * Paginar items
   */
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, currentPage, pageSize]);

  /**
   * Calcular información de paginación
   */
  const paginationInfo = useMemo(() => {
    const totalItems = sortedItems.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage,
      hasPrevPage,
      startIndex: (currentPage - 1) * pageSize + 1,
      endIndex: Math.min(currentPage * pageSize, totalItems),
    };
  }, [sortedItems.length, currentPage, pageSize]);

  /**
   * Cambiar página
   */
  const goToPage = useCallback((page: number) => {
    const maxPage = Math.ceil(sortedItems.length / pageSize);
    const validPage = Math.max(1, Math.min(page, maxPage));
    setCurrentPage(validPage);
    logger.debug(LogCategory.UI, 'Cambio de página', { page: validPage });
  }, [sortedItems.length, pageSize]);

  /**
   * Página siguiente
   */
  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, paginationInfo.hasNextPage, goToPage]);

  /**
   * Página anterior
   */
  const prevPage = useCallback(() => {
    if (paginationInfo.hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, paginationInfo.hasPrevPage, goToPage]);

  /**
   * Cambiar ordenamiento
   */
  const setSorting = useCallback((field: keyof T, direction?: 'asc' | 'desc') => {
    setCurrentSortBy(field);
    setCurrentSortDirection(direction || 'asc');
    setCurrentPage(1); // Reset a primera página
    logger.debug(LogCategory.UI, 'Ordenamiento cambiado', { field, direction });
  }, []);

  /**
   * Toggle dirección de ordenamiento
   */
  const toggleSortDirection = useCallback(() => {
    setCurrentSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    logger.debug(LogCategory.UI, 'Dirección de ordenamiento cambiada');
  }, []);

  /**
   * Actualizar búsqueda
   */
  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset a primera página
    logger.debug(LogCategory.UI, 'Búsqueda actualizada', { query });
  }, []);

  /**
   * Limpiar búsqueda
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  /**
   * Reset todo
   */
  const reset = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
    setCurrentSortBy(sortBy);
    setCurrentSortDirection(sortDirection);
    logger.debug(LogCategory.UI, 'Lista reseteada');
  }, [sortBy, sortDirection]);

  // Reset página cuando cambian los items
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    // Items procesados
    items: paginatedItems,
    allItems: sortedItems,
    filteredCount: sortedItems.length,
    totalCount: items.length,
    
    // Búsqueda
    searchQuery,
    updateSearch,
    clearSearch,
    
    // Paginación
    pagination: paginationInfo,
    goToPage,
    nextPage,
    prevPage,
    
    // Ordenamiento
    sortBy: currentSortBy,
    sortDirection: currentSortDirection,
    setSorting,
    toggleSortDirection,
    
    // Utilidades
    reset,
    isEmpty: sortedItems.length === 0,
    isFiltered: searchQuery.trim() !== '' || sortedItems.length !== items.length,
  };
}
