import DOMPurify from "isomorphic-dompurify";

/**
 * Strips all HTML/script content from user-generated text (app reviews, comments).
 * We render reviews as plain text, so we strip tags entirely rather than allow a safe subset.
 */
export function sanitizePlainText(input: string): string {
  const noTags = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return noTags.trim();
}
