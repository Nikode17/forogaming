/**
 * Sanitización XSS sin dependencias externas.
 * Reemplaza isomorphic-dompurify que tenía incompatibilidad ESM con Vercel/Turbopack
 * a través de su dependencia jsdom → html-encoding-sniffer → @exodus/bytes (ESM-only).
 */

const ALLOWED_POST_TAGS = new Set([
  'h1','h2','h3','h4','h5','h6',
  'p','br','hr',
  'strong','em','b','i','u','s','del','ins',
  'ul','ol','li',
  'blockquote','pre','code',
  'a','img',
  'table','thead','tbody','tr','th','td',
  'div','span',
])

const ALLOWED_POST_ATTRS = new Set([
  'href','src','alt','title','class','id','target','rel','width','height',
])

const ALLOWED_COMMENT_TAGS = new Set([
  'p','br','strong','em','b','i','u','a','code','blockquote',
])

const ALLOWED_COMMENT_ATTRS = new Set(['href','rel'])

// Atributos de evento JS que nunca se permiten
const FORBIDDEN_ATTRS = /^on[a-z]/i

function stripTags(html: string, allowedTags: Set<string>, allowedAttrs: Set<string>): string {
  // Eliminar scripts y style completos primero
  let result = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')

  // Procesar cada tag
  result = result.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)\/?>/g, (match, tag: string, attrs: string) => {
    const tagLower = tag.toLowerCase()
    if (!allowedTags.has(tagLower)) return ''

    // Sanitizar atributos
    const cleanAttrs = (attrs || '').replace(
      /\s([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"| '([^']*)'|(\S+))/g,
      (_: string, attr: string, dq: string, sq: string, uq: string) => {
        const attrLower = attr.toLowerCase()
        if (!allowedAttrs.has(attrLower) || FORBIDDEN_ATTRS.test(attrLower)) return ''
        const val = (dq ?? sq ?? uq ?? '').trim()
        // Bloquear javascript: y data: en href/src
        if ((attrLower === 'href' || attrLower === 'src') &&
            /^\s*(javascript|data|vbscript):/i.test(val)) return ''
        // Añadir rel a links externos
        if (attrLower === 'href') return ` href="${escapeAttr(val)}" rel="noopener noreferrer"`
        return ` ${attrLower}="${escapeAttr(val)}"`
      }
    )

    return `<${tagLower}${cleanAttrs}>`
  })

  // Eliminar closing tags no permitidos
  result = result.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g, (match, tag: string) => {
    return allowedTags.has(tag.toLowerCase()) ? `</${tag.toLowerCase()}>` : ''
  })

  return result
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Escapa todos los caracteres HTML peligrosos. Usar para texto plano. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitiza el HTML del cuerpo de un post.
 * Permite un subconjunto seguro de HTML.
 */
export function sanitizePostBody(html: string): string {
  return stripTags(html, ALLOWED_POST_TAGS, ALLOWED_POST_ATTRS)
}

/**
 * Sanitiza el cuerpo de un comentario.
 */
export function sanitizeComment(html: string): string {
  return stripTags(html, ALLOWED_COMMENT_TAGS, ALLOWED_COMMENT_ATTRS)
}

/**
 * Sanitiza texto plano — elimina todos los tags HTML.
 * Usar para usernames, títulos, bios.
 */
export function sanitizePlainText(text: string): string {
  // Eliminar todos los tags y escapar entidades
  return escapeHtml(text.replace(/<[^>]*>/g, '').trim())
}

/**
 * Valida que una URL de embed sea de un dominio permitido.
 */
export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedHosts = [
      'www.youtube.com','youtube.com','youtu.be',
      'www.vimeo.com','vimeo.com','player.vimeo.com',
    ]
    return allowedHosts.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Valida que una URL de imagen sea HTTPS.
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}
