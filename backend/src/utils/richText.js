import sanitizeHtml from 'sanitize-html';

const HTML_TAG = /<\/?[a-z][\s\S]*>/i;

const COLOR =
  /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.%\s,/]+\)|hsla?\(\s*[\d.%\s,/]+\)|[a-z]+)$/i;
const FONT_SIZE = /^\d+(?:\.\d+)?(?:px|em|rem|%)$/i;
const ALIGN = /^(left|right|center|justify)$/i;
const FONT_WEIGHT = /^(normal|bold|bolder|lighter|[1-9]00)$/i;
const FONT_STYLE = /^(normal|italic|oblique)$/i;
const TEXT_DECORATION = /^(none|underline|line-through|overline)(\s+(underline|line-through|overline))*$/i;

const OPTIONS = {
  allowedTags: [
    'p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr',
    'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title'],
    '*': ['style'],
  },
  allowedStyles: {
    '*': {
      color: [COLOR],
      'background-color': [COLOR],
      'font-size': [FONT_SIZE],
      'text-align': [ALIGN],
      'font-weight': [FONT_WEIGHT],
      'font-style': [FONT_STYLE],
      'text-decoration': [TEXT_DECORATION],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href || '');
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        },
      };
    },
  },
};

export function cleanRichText(value, max = 20000) {
  const raw = typeof value === 'string' ? value : '';
  if (!raw.trim()) return '';
  if (!HTML_TAG.test(raw)) return raw.trim().slice(0, max);
  return sanitizeHtml(raw, OPTIONS).trim().slice(0, max);
}
