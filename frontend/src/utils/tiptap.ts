import type { TipTapContent } from '@/types';

export const EMPTY_TIPTAP_JSON = '{"type":"doc","content":[{"type":"paragraph"}]}';

/** Convert TipTapContent to JSON string for the editor */
export function contentToJsonString(content: TipTapContent | null | undefined): string {
  if (!content) return EMPTY_TIPTAP_JSON;
  if (typeof content === 'string') {
    try { JSON.parse(content); return content; } catch { return content; }
  }
  return JSON.stringify(content);
}

/** Check if a TipTap JSON doc is effectively empty */
export function isEmptyDoc(doc: Record<string, unknown>): boolean {
  const content = doc.content as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(content) || content.length === 0) return true;
  return content.every(node => {
    if (node.type !== 'paragraph') return false;
    const inner = node.content as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(inner) || inner.length === 0) return true;
    return inner.every((n: Record<string, unknown>) =>
      n.type === 'text' && !(n.text as string || '').trim()
    );
  });
}

/** Convert editor JSON string to TipTapContent or undefined (if empty) */
export function jsonStringToContent(json: string): TipTapContent | undefined {
  if (!json) return undefined;
  try {
    const parsed = JSON.parse(json);
    if (isEmptyDoc(parsed)) return undefined;
    return parsed;
  } catch {
    const stripped = json.replace(/<[^>]*>/g, '').trim();
    return stripped || undefined;
  }
}

/** Extract plain text from TipTap JSON for validation/preview */
export function extractTextFromTipTap(content: TipTapContent | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') {
    // Might be a JSON string or HTML
    try {
      const parsed = JSON.parse(content);
      return _extractFromNode(parsed);
    } catch {
      return content.replace(/<[^>]*>/g, '').trim();
    }
  }
  return _extractFromNode(content);
}

function _extractFromNode(node: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof node.text === 'string') {
    parts.push(node.text);
  }
  const children = node.content as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(children)) {
    for (const child of children) {
      parts.push(_extractFromNode(child));
    }
  }
  return parts.join(' ').trim();
}
