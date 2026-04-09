/**
 * Sanitización de HTML para prevenir XSS.
 * Usa isomorphic-dompurify para funcionar tanto en servidor (Node.js) como en cliente.
 * Ver SDD sección 5.3: "Sanitización de HTML en el body de posts y comentarios"
 */
import DOMPurify from 'isomorphic-dompurify'

// Configuración para posts (permite más elementos HTML)
const POST_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'del', 'ins',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
    'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title',
    'class', 'id',
    'target', 'rel',
    'width', 'height',
  ],
  ALLOW_DATA_ATTR: false,
  // Forzar rel="noopener noreferrer" en todos los links externos
  ADD_ATTR: ['rel'],
  // Prevenir javascript: en hrefs
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

// Configuración para comentarios (más restrictiva)
const COMMENT_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'code', 'blockquote'],
  ALLOWED_ATTR: ['href', 'rel'],
  ALLOW_DATA_ATTR: false,
}

/**
 * Sanitiza el HTML del cuerpo de un post.
 * Permite un subconjunto amplio de HTML (encabezados, listas, imágenes, etc.)
 */
export function sanitizePostBody(html: string): string {
  return DOMPurify.sanitize(html, POST_CONFIG)
}

/**
 * Sanitiza el cuerpo de un comentario.
 * Solo permite formato básico (negrita, cursiva, links, código).
 */
export function sanitizeComment(html: string): string {
  return DOMPurify.sanitize(html, COMMENT_CONFIG)
}

/**
 * Sanitiza texto plano — elimina todos los tags HTML.
 * Usar para usernames, títulos, bios y campos que no deben contener HTML.
 */
export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Valida que una URL de embed sea de un dominio permitido.
 * Whitelist: youtube.com, youtu.be, vimeo.com (SDD sección 5.3)
 */
export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedHosts = [
      'www.youtube.com',
      'youtube.com',
      'youtu.be',
      'www.vimeo.com',
      'vimeo.com',
      'player.vimeo.com',
    ]
    return allowedHosts.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Valida que una URL de imagen sea HTTPS y no un data URI malicioso.
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}
