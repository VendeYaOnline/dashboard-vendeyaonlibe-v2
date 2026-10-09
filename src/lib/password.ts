/**
 * Letras y números sin los que se confunden al leerlos o dictarlos por
 * teléfono (0/O, 1/l/I). Sin símbolos: con 16 caracteres de estos 57 son
 * ~93 bits de entropía, y no se rompen al copiar/pegar ni al dictar.
 */
const GROUPS = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789"];

/** Entero uniforme en [0, max) con el generador criptográfico del navegador (sin sesgo de módulo). */
const randomBelow = (max: number) => {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
};

/**
 * Contraseña aleatoria segura, con al menos una mayúscula, una minúscula y un
 * número. Se genera en el navegador: no viaja a ningún lado hasta que se guarda.
 */
export const generatePassword = (length = 16) => {
  const all = GROUPS.join("");
  const pick = (chars: string) => chars[randomBelow(chars.length)];
  const chars = GROUPS.map(pick);
  while (chars.length < length) chars.push(pick(all));
  // Fisher-Yates: que los tres caracteres obligatorios no queden siempre al inicio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};
