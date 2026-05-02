import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4',
    'strong', 'em', 's', 'u', 'mark',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    code: ['class'],
    pre: ['class'],
    span: ['class', 'data-term'],
    div: ['class'],
    th: ['align'],
    td: ['align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
  },
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

export function htmlToPreview(html: string, max = 140): string {
  const text = htmlToPlain(html);
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function htmlToPlain(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractUploadPaths(html: string): string[] {
  const re = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('/uploads/')) out.push(src);
  }
  return Array.from(new Set(out));
}
