import slugifyLib from 'slugify';

/**
 * Creates a URL-safe slug from a string.
 * Appends a short random suffix to prevent duplicates.
 */
export function createSlug(text: string, unique = false): string {
  const base = slugifyLib(text, { lower: true, strict: true, trim: true });
  if (!unique) return base;
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
