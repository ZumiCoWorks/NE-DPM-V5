/**
 * POPIA-compliant PII hashing utilities.
 * Raw email/phone are NEVER stored in the database — only their SHA-256 hashes.
 */

/**
 * Normalise an identifier before hashing so that different
 * formatting of the same value produces the same hash.
 *
 * - Email  → trim + lowercase
 * - Phone  → strip every non-digit character
 */
export function normalizeIdentifier(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    // Treat as email
    return trimmed.toLowerCase();
  }
  // Treat as phone — keep digits only
  return trimmed.replace(/\D/g, '');
}

/**
 * Returns the lowercase hex-encoded SHA-256 digest of a normalised identifier.
 * Uses the Web Crypto API (available in all modern browsers and Vite/Node 18+).
 */
export async function sha256Hex(input: string): Promise<string> {
  const normalized = normalizeIdentifier(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
