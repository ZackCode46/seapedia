/**
 * Strips all HTML tags from user-generated text (app reviews, comments, names,
 * addresses, etc). We render this content as plain text, so we strip tags
 * entirely rather than allow a safe subset.
 *
 * Implementation note: this intentionally avoids isomorphic-dompurify/jsdom.
 * jsdom pulls in html-encoding-sniffer, which has an ESM/CommonJS interop bug
 * when bundled by Turbopack for Vercel serverless functions (it throws
 * ERR_REQUIRE_ESM at runtime, breaking every route that imports this file).
 * A regex-based tag strip is sufficient here since we only need plain text,
 * not safe-HTML rendering, and React's default escaping is the actual XSS
 * defense for anything ultimately rendered in JSX — this function is
 * defense-in-depth on top of that, not a replacement for it.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";

  // Drop HTML tags (including malformed/unclosed ones) and any "javascript:"
  // pseudo-protocol that might survive as plain text inside an href-like value.
  const withoutTags = input.replace(/<[^>]*>?/g, "");
  const withoutJsProtocol = withoutTags.replace(/javascript:/gi, "");

  // Collapse any stray null bytes or control characters that aren't normal whitespace.
  // eslint-disable-next-line no-control-regex
  const withoutControlChars = withoutJsProtocol.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  return withoutControlChars.trim();
}
