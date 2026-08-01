"use client";

import { useEffect, useState } from "react";

/**
 * Retrasa la propagación de un valor. Se usa para no disparar una petición
 * por cada tecla en los buscadores.
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
