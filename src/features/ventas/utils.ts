/**
 * `<input type="date">` entrega `YYYY-MM-DD`, pero el backend espera
 * `DD/MM/YYYY` y la parte manualmente por "/" (ver getSales en
 * sales.controller.js).
 */
export const toBackendDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};
