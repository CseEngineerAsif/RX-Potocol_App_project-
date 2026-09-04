import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'p',
  'b',
  'strong',
  'i',
  'em',
  'u',
  'ul',
  'ol',
  'li',
  'br',
  'span',
  'div',
  'a',
];

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'title',
];

// Configure DOMPurify hook to ensure all links have safe targets and rels
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    // Only allow http, https, mailto, tel
    const href = node.getAttribute('href');
    if (href && !/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
      if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(href)) {
        node.setAttribute('href', `https://${href}`);
      } else {
        node.removeAttribute('href');
      }
    }
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitize rich text HTML to prevent any XSS or unsafe HTML injections.
 * Only allows formatting tags and safe attributes.
 */
export function sanitizeRichText(dirtyHtml: string): string {
  if (!dirtyHtml) return '';
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
  });
}

/**
 * Converts rich-text HTML into clean, human-readable plain text
 * for search indexing, snippet extraction, and clipboard copying.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof html !== 'string') return String(html);

  // If no HTML tags are present, return trimmed
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.trim();
  }

  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<em>(.*?)<\/em>/gi, '$1')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Collapse 3+ newlines to double newlines
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Prepares initial content for the Rich Text Editor.
 * If content is plain text with newlines, convert to clean HTML paragraphs.
 * If already HTML, sanitize and return.
 */
export function formatInitialRichText(content: string): string {
  if (!content) return '';
  if (typeof content !== 'string') return String(content);

  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    return sanitizeRichText(content);
  }

  // Convert plain text lines into paragraphs
  const lines = content.split(/\r?\n/);
  return lines
    .map((line) => {
      const trimmed = line.trim();
      return trimmed ? `<p>${escapeHtml(trimmed)}</p>` : '<p><br></p>';
    })
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

