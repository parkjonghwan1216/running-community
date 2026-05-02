interface TermDef {
  term: string;
  definition: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeDef(definition: string): string {
  return definition
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Replace the first occurrence of `term` in a text node, skipping any
 * portions that are already inside an HTML tag attribute (i.e. between < >).
 * Returns [newText, wasFound].
 */
function replaceFirstInText(text: string, term: string, def: string): [string, boolean] {
  // Re-split by tags so we never touch attribute values of already-added spans
  const parts = text.split(/(<[^>]*>)/);
  let found = false;
  const regex = new RegExp(escapeRegExp(term), 'i');

  const out = parts.map((part) => {
    if (part.startsWith('<')) return part; // tag — leave untouched
    if (found) return part;               // already replaced — skip

    if (regex.test(part)) {
      found = true;
      return part.replace(regex, (match) => {
        return `<span class="term-link" data-term="${safeDef(def)}">${match}</span>`;
      });
    }
    return part;
  });

  return [out.join(''), found];
}

/**
 * Post-processes sanitized HTML to wrap the first occurrence of each glossary
 * term in a CSS-only tooltip span. Skips text inside <a>, <code>, <pre>.
 */
export function linkGlossaryTerms(html: string, terms: TermDef[]): string {
  if (!terms.length) return html;

  // Longer terms first to prevent partial-match shadowing
  const sorted = [...terms].sort((a, b) => b.term.length - a.term.length);
  const linked = new Set<string>();

  const SKIP_TAGS = new Set(['a', 'code', 'pre']);
  const skipStack: string[] = [];

  // Split into alternating text / tag tokens from the ORIGINAL sanitized HTML
  const tokens = html.split(/(<[^>]*>)/);

  return tokens
    .map((token) => {
      if (token.startsWith('<')) {
        const m = token.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
        if (m) {
          const tag = m[1].toLowerCase();
          if (SKIP_TAGS.has(tag)) {
            if (token.startsWith('</')) {
              if (skipStack[skipStack.length - 1] === tag) skipStack.pop();
            } else if (!token.endsWith('/>')) {
              skipStack.push(tag);
            }
          }
        }
        return token;
      }

      // Text node — skip if inside forbidden tag
      if (skipStack.length > 0 || !token.trim()) return token;

      // Apply each term replacement carefully (re-split after each replacement
      // so subsequent lookups never touch attribute values of added spans)
      let result = token;
      for (const { term, definition } of sorted) {
        const key = term.toLowerCase();
        if (linked.has(key)) continue;
        const [next, found] = replaceFirstInText(result, term, definition);
        if (found) {
          linked.add(key);
          result = next;
        }
      }
      return result;
    })
    .join('');
}
