/**
 * Simple nanoid-like random string generator.
 * No external dependency needed.
 */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(size: number = 10): string {
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}
