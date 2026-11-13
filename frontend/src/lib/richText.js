import DOMPurify from 'dompurify';
import { marked } from 'marked';

const HTML_TAG = /<\/?[a-z][\s\S]*>/i;

const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr',
  'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const STYLE_RULES = {
  color: /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i,
  'background-color': /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i,
  'font-size': /^\d+(\.\d+)?(px|em|rem|%)$/i,
  'text-align': /^(left|right|center|justify)$/i,
  'font-weight': /^(normal|bold|[1-9]00)$/i,
  'font-style': /^(normal|italic)$/i,
  'text-decoration': /^(none|underline|line-through)$/i,
};

const sanitizeStyle = (value = '') =>
  value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const index = declaration.indexOf(':');
      if (index === -1) return null;
      const property = declaration.slice(0, index).trim().toLowerCase();
      const styleValue = declaration.slice(index + 1).trim();
      const rule = STYLE_RULES[property];
      return rule && rule.test(styleValue) ? `${property}: ${styleValue}` : null;
    })
    .filter(Boolean)
    .join('; ');

let hooked = false;
if (!hooked && typeof window !== 'undefined') {
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'style') data.attrValue = sanitizeStyle(data.attrValue);
  });
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('rel', 'noopener noreferrer');
      if (node.getAttribute('href')?.startsWith('http')) node.setAttribute('target', '_blank');
    }
  });
  hooked = true;
}

export const isRichHtml = (value = '') => HTML_TAG.test(value);

export const toEditorHtml = (value = '') => {
  if (!value) return '';
  const html = isRichHtml(value) ? value : marked.parse(value, { gfm: true, breaks: true });
  return sanitizeRich(html);
};

export const sanitizeRich = (value = '') =>
  DOMPurify.sanitize(value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'style'],
    ALLOW_DATA_ATTR: false,
  });

export const stripRich = (value = '') => {
  if (!value) return '';
  const html = toEditorHtml(value);
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  return body.textContent.replace(/\s+/g, ' ').trim();
};
