import { randomBytes } from "node:crypto";

// Crockford base32: no I, L, O, U, so a code read aloud or typed at the gate can't be confused.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const TICKET_CODE_LENGTH = 12;

/**
 * 12 symbols × 5 bits = 60 bits from the OS CSPRNG. `byte & 31` is uniform because 256 is a multiple of 32.
 * Unguessable is the point: the code is the only thing a QR carries, so it must not be enumerable.
 */
export function generateTicketCode(): string {
  const bytes = randomBytes(TICKET_CODE_LENGTH);
  let code = "";
  for (const byte of bytes) {
    code += ALPHABET[byte & 31];
  }
  return code;
}

/**
 * Accepts what a person might type: lowercase, dashes/spaces, and the Crockford look-alikes (O→0, I/L→1).
 * Returns null when the result can't be a valid code, so the caller answers 400 without touching the DB.
 */
export function normalizeTicketCode(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (cleaned.length !== TICKET_CODE_LENGTH) {
    return null;
  }
  for (const char of cleaned) {
    if (!ALPHABET.includes(char)) {
      return null;
    }
  }
  return cleaned;
}
