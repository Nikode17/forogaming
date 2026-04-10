#!/usr/bin/env node
// scripts/generate-docs.js
// Genera documentacion-proyecto.pdf con Puppeteer + Microsoft Edge

const puppeteer = require('puppeteer')
const path = require('path')

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUTPUT_PATH = path.join(__dirname, '..', 'documentacion-proyecto.pdf')

// ─────────────────────────────────────────────────────────────────────────────
// CONTENIDO HTML DEL DOCUMENTO
// ─────────────────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Forogaming — Documentación del Proyecto</title>
<style>
  /* ── Reset & Base ─────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #1a1a2e;
    background: #ffffff;
  }

  /* ── Portada ──────────────────────────────────────────────────────── */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    color: white;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover-logo {
    font-size: 52pt;
    font-weight: 900;
    letter-spacing: -2px;
    margin-bottom: 12px;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #e879f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cover-tagline {
    font-size: 16pt;
    color: #a5b4fc;
    margin-bottom: 48px;
    font-weight: 300;
  }
  .cover-meta {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 32px 48px;
    display: inline-block;
    text-align: left;
  }
  .cover-meta table { border-collapse: collapse; }
  .cover-meta td { padding: 6px 16px 6px 0; color: #c7d2fe; font-size: 11pt; }
  .cover-meta td:first-child { color: #818cf8; font-weight: 600; min-width: 120px; }
  .cover-badge {
    display: inline-block;
    background: #4f46e5;
    color: white;
    padding: 4px 14px;
    border-radius: 100px;
    font-size: 9pt;
    font-weight: 600;
    margin-top: 32px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ── Índice ───────────────────────────────────────────────────────── */
  .toc {
    padding: 60px 72px;
    page-break-after: always;
    min-height: 100vh;
  }
  .toc h2 { font-size: 22pt; color: #4f46e5; margin-bottom: 36px; padding-bottom: 12px; border-bottom: 3px solid #e0e7ff; }
  .toc ol { list-style: none; counter-reset: toc; }
  .toc li { counter-increment: toc; display: flex; align-items: baseline; gap: 8px; padding: 8px 0; border-bottom: 1px dotted #e2e8f0; font-size: 12pt; }
  .toc li::before { content: counter(toc) "."; color: #818cf8; font-weight: 700; min-width: 28px; }
  .toc li span { color: #64748b; font-size: 10pt; margin-left: auto; }

  /* ── Layout principal ─────────────────────────────────────────────── */
  .page {
    padding: 56px 72px;
    page-break-before: always;
  }

  /* ── Cabeceras de sección ─────────────────────────────────────────── */
  .section-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 3px solid #e0e7ff;
  }
  .section-num {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18pt; font-weight: 800;
    flex-shrink: 0;
  }
  .section-title { font-size: 22pt; font-weight: 800; color: #1e1b4b; }

  /* ── Subtítulos ───────────────────────────────────────────────────── */
  h3 {
    font-size: 14pt;
    font-weight: 700;
    color: #312e81;
    margin: 28px 0 12px;
    padding-left: 12px;
    border-left: 4px solid #818cf8;
  }
  h4 {
    font-size: 11.5pt;
    font-weight: 600;
    color: #4338ca;
    margin: 20px 0 8px;
  }

  /* ── Párrafos ─────────────────────────────────────────────────────── */
  p { margin-bottom: 14px; color: #334155; }

  /* ── Código inline ────────────────────────────────────────────────── */
  code {
    font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 1px 6px;
    color: #7c3aed;
  }

  /* ── Bloques de código ────────────────────────────────────────────── */
  pre {
    background: #1e1b4b;
    color: #c7d2fe;
    border-radius: 10px;
    padding: 20px 24px;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 9pt;
    line-height: 1.6;
    overflow: hidden;
    margin: 16px 0 20px;
    border-left: 4px solid #818cf8;
  }
  pre .comment { color: #6b7280; }
  pre .keyword { color: #a78bfa; }
  pre .string  { color: #34d399; }
  pre .value   { color: #fbbf24; }

  /* ── Tablas ───────────────────────────────────────────────────────── */
  .table-wrap { overflow: hidden; border-radius: 10px; border: 1px solid #e2e8f0; margin: 16px 0 24px; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
  thead th { color: white; padding: 10px 16px; text-align: left; font-size: 10pt; font-weight: 600; }
  tbody tr:nth-child(odd)  { background: #fafafa; }
  tbody tr:nth-child(even) { background: #f1f5f9; }
  tbody td { padding: 9px 16px; font-size: 9.5pt; color: #334155; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 100px;
    font-size: 8.5pt;
    font-weight: 600;
  }
  .badge-get    { background: #d1fae5; color: #065f46; }
  .badge-post   { background: #dbeafe; color: #1e40af; }
  .badge-put    { background: #fef3c7; color: #92400e; }
  .badge-delete { background: #fee2e2; color: #991b1b; }
  .badge-auth   { background: #ede9fe; color: #5b21b6; }
  .badge-admin  { background: #fce7f3; color: #9d174d; }
  .badge-public { background: #ecfdf5; color: #065f46; }

  /* ── Listas ───────────────────────────────────────────────────────── */
  ul, ol { margin: 10px 0 16px 24px; }
  li { margin-bottom: 6px; color: #334155; }

  /* ── Info boxes ───────────────────────────────────────────────────── */
  .info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-left: 4px solid #3b82f6;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 16px 0;
    font-size: 10.5pt;
    color: #1e40af;
  }
  .warn-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 16px 0;
    font-size: 10.5pt;
    color: #92400e;
  }
  .success-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 4px solid #22c55e;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 16px 0;
    font-size: 10.5pt;
    color: #14532d;
  }
  .error-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 16px 0;
    font-size: 10.5pt;
    color: #991b1b;
  }

  /* ── Árbol de archivos ────────────────────────────────────────────── */
  .file-tree {
    background: #0f172a;
    color: #94a3b8;
    border-radius: 10px;
    padding: 20px 24px;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 9pt;
    line-height: 1.8;
    margin: 16px 0 20px;
  }
  .file-tree .dir  { color: #93c5fd; font-weight: 600; }
  .file-tree .file { color: #a5f3fc; }
  .file-tree .note { color: #6b7280; font-style: italic; }

  /* ── Diagrama ─────────────────────────────────────────────────────── */
  .diagram {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px;
    margin: 16px 0;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 9pt;
    color: #334155;
    line-height: 1.9;
  }

  /* ── Pasos de instalación ─────────────────────────────────────────── */
  .steps { margin: 16px 0; }
  .step {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .step-num {
    background: #4f46e5;
    color: white;
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 11pt;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .step-content { flex: 1; }
  .step-content strong { display: block; font-size: 11.5pt; color: #1e1b4b; margin-bottom: 4px; }

  /* ── Footer de página ─────────────────────────────────────────────── */
  @page { margin: 0; size: A4; }

  /* ── Print ────────────────────────────────────────────────────────── */
  @media print {
    .page { page-break-before: always; }
    h3, h4 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
    .step { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- PORTADA                                                           -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-logo">Forogaming</div>
  <div class="cover-tagline">Foro comunitario de Videojuegos — Guías, Easter Eggs &amp; Reviews</div>

  <div class="cover-meta">
    <table>
      <tr><td>Documento</td><td>Documentación técnica del proyecto</td></tr>
      <tr><td>Versión</td><td>1.2.0</td></tr>
      <tr><td>Fecha</td><td>10 de abril de 2026</td></tr>
      <tr><td>Estado</td><td>Producción · https://forogaming.vercel.app</td></tr>
      <tr><td>Stack</td><td>Next.js 16 · TypeScript · PostgreSQL (Neon) · Tailwind CSS</td></tr>
      <tr><td>Servicios</td><td>Vercel · Neon · Uploadthing · IGDB API</td></tr>
    </table>
  </div>

  <div class="cover-badge">Documentación generada automáticamente</div>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- ÍNDICE                                                            -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="toc page" style="page-break-before: avoid;">
  <h2>Índice de contenidos</h2>
  <ol>
    <li>Visión general del proyecto <span>Propósito, audiencia y stack tecnológico</span></li>
    <li>Instalación paso a paso <span>Entorno, dependencias, variables de entorno y migraciones</span></li>
    <li>Estructura del proyecto <span>Árbol de carpetas y descripción de archivos clave</span></li>
    <li>Base de datos <span>Tablas, campos, relaciones e índices</span></li>
    <li>API y endpoints <span>Lista completa de rutas, métodos y respuestas</span></li>
    <li>Sistema de autenticación <span>JWT, refresh tokens, proxy y flujo completo</span></li>
    <li>Correcciones aplicadas <span>Deprecaciones resueltas en Next.js 16</span></li>
    <li>Estado actual y próximos pasos <span>Qué funciona, qué falta y roadmap</span></li>
  </ol>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 1. VISIÓN GENERAL                                                 -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">1</div>
    <div class="section-title">Visión general del proyecto</div>
  </div>

  <h3>¿Qué es Forogaming?</h3>
  <p>
    Forogaming es una plataforma web de tipo foro comunitario especializada en videojuegos. Permite a los usuarios
    publicar y descubrir <strong>guías paso a paso</strong>, <strong>easter eggs</strong> y <strong>reviews</strong>
    de títulos, con un sistema de interacción social completo: votos, likes, comentarios anidados y favoritos.
  </p>
  <p>
    El estilo de interacción es similar a Reddit: feed principal con posts ordenables (nuevo, top, trending),
    sidebar con navegación por juego y categoría, y vista de artículo con multimedia y pasos numerados.
    El diseño es oscuro y gaming-first, responsive con prioridad desktop.
  </p>

  <h3>Público objetivo</h3>
  <ul>
    <li>Jugadores que buscan guías detalladas y trucos para sus juegos favoritos.</li>
    <li>Creadores de contenido que quieren publicar análisis y descubrimientos.</li>
    <li>Comunidades de juegos específicos que necesitan un espacio propio de discusión.</li>
  </ul>

  <h3>Funcionalidades principales</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Funcionalidad</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td>Posts</td><td>CRUD completo con categorías, multimedia, steps numerados y soft-delete</td><td>✅ Implementado</td></tr>
        <tr><td>Comentarios</td><td>Árbol anidado con 2–4 niveles (adjacency list, ADR-002)</td><td>✅ Implementado</td></tr>
        <tr><td>Votos</td><td>Upvote / Downvote en posts y comentarios, impacta el ranking</td><td>✅ Implementado</td></tr>
        <tr><td>Likes</td><td>Interacción emocional independiente del ranking (ADR-005)</td><td>✅ Implementado</td></tr>
        <tr><td>Favoritos</td><td>Guardar posts para lectura posterior</td><td>✅ Implementado</td></tr>
        <tr><td>Trending</td><td>Score tipo Reddit: (votos_netos) / (horas + 2)^1.8 — vista SQL</td><td>✅ Implementado</td></tr>
        <tr><td>Auth</td><td>JWT (15 min) + refresh token (7 días, httpOnly cookie)</td><td>✅ Implementado</td></tr>
        <tr><td>Moderación</td><td>Reportes, baneos, eliminación de contenido por moderadores</td><td>✅ Implementado</td></tr>
        <tr><td>Búsqueda</td><td>Full-text con ILIKE en título y cuerpo</td><td>✅ Implementado</td></tr>
        <tr><td>Upload imágenes</td><td>Avatares (2 MB) e imágenes de posts (8 MB) vía Uploadthing</td><td>✅ Implementado</td></tr>
        <tr><td>IGDB</td><td>Búsqueda de juegos en tiempo real, páginas enriquecidas con portada, capturas, géneros y rating</td><td>✅ Implementado</td></tr>
        <tr><td>Seguir usuarios</td><td>Follow / unfollow con contador de seguidores/seguidos en el perfil</td><td>✅ Implementado</td></tr>
        <tr><td>Mensajería directa</td><td>Chat privado con polling cada 3 s, marca de leído (✓), badge de no leídos en Navbar</td><td>✅ Implementado</td></tr>
        <tr><td>Sistema de amigos</td><td>Solicitudes de amistad, aceptar/rechazar, lista de amigos, badge de solicitudes pendientes</td><td>✅ Implementado</td></tr>
        <tr><td>Configuración de perfil</td><td>Página /settings: cambiar avatar (Uploadthing) y bio</td><td>✅ Implementado</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Stack tecnológico completo</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Capa</th><th>Tecnología</th><th>Versión</th><th>Justificación</th></tr></thead>
      <tbody>
        <tr><td>Framework</td><td>Next.js (App Router)</td><td>16.2.3</td><td>SSR nativo para SEO de posts públicos, fullstack en un solo repo</td></tr>
        <tr><td>Lenguaje</td><td>TypeScript</td><td>5.x (strict)</td><td>Tipado fuerte en todo el proyecto, sin <code>any</code></td></tr>
        <tr><td>Estilos</td><td>Tailwind CSS</td><td>3.4</td><td>Utility-first, tema oscuro gaming con variables CSS</td></tr>
        <tr><td>Base de datos</td><td>PostgreSQL</td><td>17.9</td><td>Relacional, soporte ENUM nativo, extensión pgcrypto</td></tr>
        <tr><td>Cliente DB</td><td>pg (node-postgres)</td><td>8.11</td><td>Pool de conexiones, queries tipadas, transacciones</td></tr>
        <tr><td>Auth tokens</td><td>jose</td><td>5.x</td><td>JWT compatible con Edge Runtime de Next.js</td></tr>
        <tr><td>Passwords</td><td>bcryptjs</td><td>2.4</td><td>Hashing con cost factor 12 (SDD §5.4)</td></tr>
        <tr><td>Validación</td><td>Zod</td><td>3.22</td><td>Schemas en servidor y cliente, formateo de errores unificado</td></tr>
        <tr><td>Sanitización</td><td>Implementación nativa</td><td>—</td><td>Reemplaza isomorphic-dompurify (incompatible con Turbopack/ESM). Prevención XSS sin dependencias externas.</td></tr>
        <tr><td>Rate limiting</td><td>Implementación propia</td><td>—</td><td>Sliding window en memoria; migrar a Redis en v2</td></tr>
        <tr><td>Upload de imágenes</td><td>Uploadthing</td><td>v7</td><td>Avatares (2 MB) e imágenes de posts (8 MB). Auth vía JWT en el file router.</td></tr>
        <tr><td>API de juegos</td><td>IGDB (Twitch)</td><td>v4</td><td>Búsqueda Apicalypse, token OAuth cached en módulo, cover CDN. Enriquece páginas de juego con screenshots, géneros y rating.</td></tr>
        <tr><td>Runtime</td><td>Node.js</td><td>22.20</td><td>Versión LTS activa</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Decisiones de diseño clave (ADRs)</h3>
  <ul>
    <li><strong>ADR-001:</strong> Stack Next.js fullstack (Opción A) — SSR, ecosistema maduro, menor overhead.</li>
    <li><strong>ADR-002:</strong> Comentarios con adjacency list (<code>parent_id</code>) — simple, suficiente para 2–4 niveles.</li>
    <li><strong>ADR-003:</strong> Trending con score tipo Reddit recalculado sobre vista SQL <code>post_scores</code>.</li>
    <li><strong>ADR-004:</strong> Upload con Uploadthing v7 — file router con auth JWT, sin configuración de S3 propia. Avatares 2 MB, imágenes de posts 8 MB.</li>
    <li><strong>ADR-005:</strong> Votos y likes son sistemas separados — votos afectan ranking, likes son emocionales.</li>
    <li><strong>ADR-006:</strong> Mensajería con polling cada 3 s (no WebSocket) — compatible con Vercel serverless, suficiente para el volumen actual.</li>
    <li><strong>ADR-007:</strong> IGDB como fuente de metadatos de juegos — Twitch OAuth con token cacheado en módulo, query Apicalypse sin cláusula <code>where</code> (incompatible con <code>search</code>).</li>
    <li><strong>ADR-008:</strong> Sanitización HTML nativa sin dependencias — reemplaza isomorphic-dompurify que fallaba en Vercel/Turbopack por incompatibilidad ESM de jsdom → @exodus/bytes.</li>
  </ul>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 2. INSTALACIÓN PASO A PASO                                        -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">2</div>
    <div class="section-title">Instalación paso a paso</div>
  </div>

  <p>A continuación se documenta cada paso realizado para poner en marcha el entorno de desarrollo desde cero en Windows 11.</p>

  <h3>Requisitos previos del sistema</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Software</th><th>Versión instalada</th><th>Verificación</th></tr></thead>
      <tbody>
        <tr><td>Windows 11 Home</td><td>10.0.26200</td><td>Sistema operativo del entorno</td></tr>
        <tr><td>Node.js</td><td>22.20.0 (LTS)</td><td><code>node --version</code></td></tr>
        <tr><td>npm</td><td>10.9.3</td><td><code>npm --version</code></td></tr>
        <tr><td>winget</td><td>v1.28.220</td><td><code>winget --version</code></td></tr>
        <tr><td>PostgreSQL 17</td><td>17.9</td><td>Instalado en este proceso</td></tr>
        <tr><td>Microsoft Edge</td><td>Chromium</td><td>Preinstalado en Windows 11</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Pasos de instalación</h3>
  <div class="steps">

    <div class="step">
      <div class="step-num">1</div>
      <div class="step-content">
        <strong>Instalar PostgreSQL 17 con winget</strong>
        <p>Se verificó que PostgreSQL no estaba instalado (ni en PATH, ni en Program Files, ni como servicio Windows). Se usó el gestor de paquetes <code>winget</code> — disponible en Windows 11 de forma nativa — para instalar la versión oficial 17.9.</p>
        <pre>winget install --id PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements</pre>
        <p>El instalador gráfico de EnterpriseDB descargó 354 MB e instaló PostgreSQL con contraseña <code>postgres</code> para el superusuario, puerto 5432 y servicio de Windows registrado como <code>postgresql-x64-17</code>.</p>
        <div class="success-box">✅ Resultado: PostgreSQL 17.9 instalado en <code>C:\\Program Files (x86)\\PostgreSQL\\17\\</code></div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">2</div>
      <div class="step-content">
        <strong>Verificar y arrancar el servicio PostgreSQL</strong>
        <p>Se comprobó el estado del servicio de Windows con <code>sc query</code>. El instalador lo registró y arrancó automáticamente.</p>
        <pre>sc query type= all state= all | grep postgres
# NOMBRE_SERVICIO: postgresql-x64-17
# ESTADO: 4  RUNNING</pre>
        <div class="success-box">✅ Servicio activo en localhost:5432. Conexión verificada: <code>PGPASSWORD=postgres psql -U postgres -c "\l"</code></div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">3</div>
      <div class="step-content">
        <strong>Crear la base de datos del proyecto</strong>
        <p>Se creó la base de datos <code>forogaming</code> con codificación UTF8 usando el superusuario <code>postgres</code>.</p>
        <pre>PGPASSWORD=postgres psql -U postgres -c "CREATE DATABASE forogaming ENCODING 'UTF8';"</pre>
        <p><strong>Por qué:</strong> la aplicación necesita una base de datos dedicada, separada de la base <code>postgres</code> por defecto. Usar una base propia permite gestionar permisos, backups y migraciones de forma aislada.</p>
        <div class="success-box">✅ Base de datos <code>forogaming</code> creada correctamente.</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">4</div>
      <div class="step-content">
        <strong>Instalar dependencias npm</strong>
        <p>Desde el directorio del proyecto, se instalaron las 434 dependencias declaradas en <code>package.json</code>.</p>
        <pre>cd C:\\Users\\nicol\\Desktop\\Forogaming
npm install</pre>
        <p>Las dependencias principales instaladas incluyen: <code>next</code>, <code>react</code>, <code>pg</code>, <code>jose</code>, <code>bcryptjs</code>, <code>zod</code>, <code>isomorphic-dompurify</code>, <code>uuid</code>, <code>slugify</code>.</p>
        <div class="warn-box">⚠️ Se detectó CVE-2025-66478 en Next.js 15.1.0. Se actualizó inmediatamente a 16.2.3 (ver paso 6).</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">5</div>
      <div class="step-content">
        <strong>Configurar variables de entorno (.env.local)</strong>
        <p>Se copió el archivo de ejemplo y se rellenaron automáticamente los dos valores críticos:</p>
        <pre><span class="comment"># .env.local generado automáticamente</span>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forogaming
JWT_SECRET=uSXbN5HHIZvITzfkr7PWVNAf9DmcrfQ3uOynXRMz7aIq7PYf
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development</pre>
        <ul>
          <li><strong>DATABASE_URL:</strong> cadena de conexión que usa el pool de <code>pg</code> para conectarse a PostgreSQL.</li>
          <li><strong>JWT_SECRET:</strong> secreto criptográficamente aleatorio de 48 caracteres (generado con <code>crypto.randomBytes(36).toString('base64url')</code>) usado para firmar y verificar todos los JWT.</li>
        </ul>
        <div class="info-box">ℹ️ <code>.env.local</code> está en <code>.gitignore</code> y nunca se sube al repositorio.</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">6</div>
      <div class="step-content">
        <strong>Ejecutar las migraciones de base de datos</strong>
        <p>El script <code>scripts/migrate.js</code> lee el archivo <code>migrations/001_initial_schema.sql</code>, se conecta a PostgreSQL usando <code>DATABASE_URL</code> de <code>.env.local</code> y ejecuta el SQL completo en una sola transacción.</p>
        <pre>npm run db:migrate
<span class="comment"># [migrate] Cargado .env.local</span>
<span class="comment"># [migrate] Ejecutando migración 001_initial_schema.sql...</span>
<span class="comment"># [migrate] ✅ Migración completada exitosamente</span></pre>
        <p><strong>Efecto:</strong> se crearon 7 tipos ENUM, 11 tablas, 10 índices, 3 triggers de <code>updated_at</code> y la vista <code>post_scores</code> para trending.</p>
        <div class="success-box">✅ 11 tablas verificadas con <code>\dt</code> en psql.</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">7</div>
      <div class="step-content">
        <strong>Actualizar Next.js (parche de seguridad CVE-2025-66478)</strong>
        <p>La versión 15.1.0 declarada en <code>package.json</code> tenía una vulnerabilidad crítica. Se actualizó a la última versión estable antes de arrancar el servidor.</p>
        <pre>npm install next@latest
<span class="comment"># Resultado: Next.js 16.2.3 instalado, 0 vulnerabilidades</span></pre>
      </div>
    </div>

    <div class="step">
      <div class="step-num">8</div>
      <div class="step-content">
        <strong>Arrancar el servidor de desarrollo</strong>
        <pre>npm run dev
<span class="comment"># ▲ Next.js 16.2.3 (Turbopack)</span>
<span class="comment"># - Local: http://localhost:3000</span>
<span class="comment"># ✓ Ready in 408ms</span></pre>
        <p>Verificación del health check:</p>
        <pre>curl http://localhost:3000/api/health
<span class="string">{"status":"ok","db":"connected","timestamp":"2026-04-09T16:52:53.379Z"}</span></pre>
        <div class="success-box">✅ Servidor corriendo. API responde. Base de datos conectada.</div>
      </div>
    </div>

  </div>

  <h3>Comandos útiles de mantenimiento</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Comando</th><th>Qué hace</th></tr></thead>
      <tbody>
        <tr><td><code>npm run dev</code></td><td>Arranca el servidor de desarrollo con Turbopack (hot reload)</td></tr>
        <tr><td><code>npm run build</code></td><td>Compila el proyecto para producción</td></tr>
        <tr><td><code>npm run start</code></td><td>Arranca el servidor de producción (requiere build previo)</td></tr>
        <tr><td><code>npm run db:migrate</code></td><td>Ejecuta las migraciones SQL pendientes</td></tr>
        <tr><td><code>npm run lint</code></td><td>Ejecuta ESLint sobre todo el código fuente</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 3. ESTRUCTURA DEL PROYECTO                                        -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">3</div>
    <div class="section-title">Estructura del proyecto</div>
  </div>

  <div class="file-tree">
<span class="dir">Forogaming/</span>
├── <span class="file">.env.example</span>          <span class="note">← Variables de entorno plantilla (sin secretos)</span>
├── <span class="file">.env.local</span>            <span class="note">← Variables reales (ignorado por git)</span>
├── <span class="file">.gitignore</span>
├── <span class="file">package.json</span>          <span class="note">← Dependencias y scripts npm</span>
├── <span class="file">tsconfig.json</span>         <span class="note">← TypeScript strict mode, alias @/*</span>
├── <span class="file">next.config.ts</span>        <span class="note">← Security headers, remotePatterns</span>
├── <span class="file">tailwind.config.ts</span>    <span class="note">← Tema oscuro gaming</span>
├── <span class="file">postcss.config.js</span>
├── <span class="file">SDD.md</span>                <span class="note">← Software Design Document (origen del proyecto)</span>
├── <span class="file">documentacion-proyecto.pdf</span>  <span class="note">← Este documento</span>
│
├── <span class="dir">migrations/</span>
│   └── <span class="file">001_initial_schema.sql</span>  <span class="note">← Schema completo de PostgreSQL</span>
│
├── <span class="dir">scripts/</span>
│   ├── <span class="file">migrate.js</span>         <span class="note">← Runner de migraciones SQL</span>
│   └── <span class="file">generate-docs.js</span>   <span class="note">← Generador de este PDF</span>
│
└── <span class="dir">src/</span>
    ├── <span class="file">proxy.ts</span>           <span class="note">← Proxy global (antes middleware.ts) — inyecta headers de usuario</span>
    │
    ├── <span class="dir">types/</span>
    │   └── <span class="file">index.ts</span>        <span class="note">← Interfaces TypeScript de todas las entidades del dominio</span>
    │
    ├── <span class="dir">contexts/</span>
    │   └── <span class="file">AuthContext.tsx</span> <span class="note">← Estado de autenticación global (React Context + hooks)</span>
    │
    ├── <span class="dir">lib/</span>               <span class="note">← Utilidades compartidas del servidor</span>
    │   ├── <span class="file">db.ts</span>           <span class="note">← Pool de conexiones PostgreSQL, query(), withTransaction()</span>
    │   ├── <span class="file">auth.ts</span>         <span class="note">← JWT: signAccessToken, signRefreshToken, verifyAccessToken</span>
    │   ├── <span class="file">password.ts</span>     <span class="note">← hashPassword(), verifyPassword() con bcrypt cost 12</span>
    │   ├── <span class="file">ratelimit.ts</span>    <span class="note">← Rate limiter sliding window en memoria</span>
    │   ├── <span class="file">sanitize.ts</span>     <span class="note">← Sanitización XSS nativa (sin dependencias externas)</span>
    │   ├── <span class="file">validation.ts</span>   <span class="note">← Schemas Zod para todos los inputs de API</span>
    │   ├── <span class="file">uploadthing.ts</span>  <span class="note">← generateReactHelpers para useUploadThing en el cliente</span>
    │   └── <span class="file">igdb.ts</span>         <span class="note">← Twitch OAuth + IGDB Apicalypse: searchIGDBGames, getIGDBGameDetails</span>
    │
    ├── <span class="dir">components/</span>        <span class="note">← Componentes React reutilizables</span>
    │   ├── <span class="file">Navbar.tsx</span>      <span class="note">← Logo, búsqueda, menú usuario, badge mensajes y amigos</span>
    │   ├── <span class="file">Sidebar.tsx</span>     <span class="note">← Navegación lateral: categorías y juegos</span>
    │   ├── <span class="file">Feed.tsx</span>        <span class="note">← Lista de PostCards con paginación</span>
    │   ├── <span class="file">PostCard.tsx</span>    <span class="note">← Tarjeta de post con votos, badges y metadatos</span>
    │   ├── <span class="file">VoteButtons.tsx</span> <span class="note">← Botones ▲/▼ con optimistic updates</span>
    │   ├── <span class="file">CommentTree.tsx</span> <span class="note">← Árbol de comentarios anidados recursivo</span>
    │   ├── <span class="file">CommentForm.tsx</span> <span class="note">← Formulario inline de nuevo comentario / respuesta</span>
    │   ├── <span class="file">GameSearch.tsx</span>  <span class="note">← Buscador IGDB con debounce para el formulario de post</span>
    │   ├── <span class="file">FollowButton.tsx</span><span class="note">← Botón seguir/dejar de seguir con estado real desde el cliente</span>
    │   └── <span class="file">AddFriendModal.tsx</span><span class="note">← Modal de búsqueda de usuarios y envío de solicitud de amistad</span>
    │
    └── <span class="dir">app/</span>               <span class="note">← Next.js App Router</span>
        ├── <span class="file">layout.tsx</span>      <span class="note">← Root layout: AuthProvider + Navbar + main</span>
        ├── <span class="file">page.tsx</span>        <span class="note">← / — Home con feed principal y trending</span>
        ├── <span class="file">globals.css</span>     <span class="note">← Tailwind base + variables CSS tema oscuro</span>
        │
        ├── <span class="dir">(auth)/</span>
        │   ├── <span class="file">login/page.tsx</span>
        │   └── <span class="file">register/page.tsx</span>
        │
        ├── <span class="dir">game/[slug]/page.tsx</span>      <span class="note">← Página enriquecida: hero IGDB, screenshots, rating, géneros</span>
        ├── <span class="dir">games/page.tsx</span>            <span class="note">← Catálogo de juegos con portadas</span>
        ├── <span class="dir">post/[id]/page.tsx</span>        <span class="note">← Vista completa del post + comentarios</span>
        ├── <span class="dir">category/[type]/page.tsx</span>  <span class="note">← Feed por categoría</span>
        ├── <span class="dir">search/page.tsx</span>           <span class="note">← Búsqueda full-text</span>
        ├── <span class="dir">user/[username]/page.tsx</span>  <span class="note">← Perfil público con FollowButton, stats y posts</span>
        ├── <span class="dir">settings/page.tsx</span>         <span class="note">← Ajustes de perfil: avatar (Uploadthing) y bio</span>
        ├── <span class="dir">messages/page.tsx</span>         <span class="note">← Lista de conversaciones con última mensaje y no leídos</span>
        ├── <span class="dir">messages/[username]/page.tsx</span><span class="note">← Chat con polling 3 s, separadores de fecha, ✓ de leído</span>
        ├── <span class="dir">friends/page.tsx</span>          <span class="note">← Lista de amigos + solicitudes pendientes con aceptar/rechazar</span>
        ├── <span class="dir">submit/page.tsx</span>           <span class="note">← Crear post con buscador IGDB integrado</span>
        ├── <span class="dir">admin/page.tsx</span>            <span class="note">← Panel de moderación</span>
        ├── <span class="dir">admin/reports/page.tsx</span>    <span class="note">← Gestión de reportes</span>
        ├── <span class="dir">admin/users/page.tsx</span>      <span class="note">← Gestión de usuarios</span>
        │
        └── <span class="dir">api/</span>               <span class="note">← 40+ rutas API REST</span>
            ├── <span class="dir">auth/</span>            <span class="note">register · login · refresh · logout</span>
            ├── <span class="dir">posts/</span>           <span class="note">CRUD · trending · search · [id]/comments</span>
            ├── <span class="dir">comments/[id]/</span>
            ├── <span class="dir">votes/ · likes/ · favorites/[postId]/</span>
            ├── <span class="dir">games/ · games/search/</span>   <span class="note">IGDB search + upsert en DB</span>
            ├── <span class="dir">users/</span>           <span class="note">me · [username] · [username]/follow · search</span>
            ├── <span class="dir">messages/</span>        <span class="note">conversaciones · [username] · unread</span>
            ├── <span class="dir">friends/</span>         <span class="note">lista · request · respond · pending</span>
            ├── <span class="dir">uploadthing/</span>     <span class="note">file router: avatarUploader · postImageUploader</span>
            ├── <span class="dir">reports/ · admin/</span>
            └── <span class="dir">health/</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 4. BASE DE DATOS                                                  -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">4</div>
    <div class="section-title">Base de datos</div>
  </div>

  <p>Motor: <strong>PostgreSQL 17</strong>. Base de datos: <code>forogaming</code>. La migración crea todo el schema desde cero con el comando <code>npm run db:migrate</code>.</p>

  <h3>Tipos ENUM personalizados</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Valores posibles</th></tr></thead>
      <tbody>
        <tr><td><code>user_role</code></td><td><code>admin</code> · <code>moderator</code> · <code>user</code> · <code>guest</code></td></tr>
        <tr><td><code>post_category</code></td><td><code>guide</code> · <code>easter-egg</code> · <code>review</code> · <code>general</code></td></tr>
        <tr><td><code>media_type</code></td><td><code>image</code> · <code>video_embed</code></td></tr>
        <tr><td><code>vote_target</code></td><td><code>post</code> · <code>comment</code></td></tr>
        <tr><td><code>like_target</code></td><td><code>post</code> · <code>comment</code></td></tr>
        <tr><td><code>report_target</code></td><td><code>post</code> · <code>comment</code> · <code>user</code></td></tr>
        <tr><td><code>report_status</code></td><td><code>pending</code> · <code>resolved</code> · <code>dismissed</code></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Tablas</h3>

  <h4>users — Usuarios registrados</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descripción</th></tr></thead>
      <tbody>
        <tr><td><code>id</code></td><td>UUID PK</td><td>Generado con <code>gen_random_uuid()</code> (extensión pgcrypto)</td></tr>
        <tr><td><code>username</code></td><td>VARCHAR(50) UNIQUE</td><td>Nombre de usuario público, solo <code>[a-zA-Z0-9_-]</code></td></tr>
        <tr><td><code>email</code></td><td>VARCHAR(255) UNIQUE</td><td>Email de acceso, nunca se devuelve en endpoints públicos</td></tr>
        <tr><td><code>password_hash</code></td><td>VARCHAR(255)</td><td>Bcrypt con cost factor 12</td></tr>
        <tr><td><code>role</code></td><td>user_role</td><td>Default <code>user</code></td></tr>
        <tr><td><code>avatar_url</code></td><td>TEXT nullable</td><td>URL HTTPS de avatar</td></tr>
        <tr><td><code>bio</code></td><td>TEXT nullable</td><td>Descripción del perfil</td></tr>
        <tr><td><code>is_banned</code></td><td>BOOLEAN</td><td>Default <code>false</code>; si <code>true</code>, login rechazado con 403</td></tr>
        <tr><td><code>created_at</code></td><td>TIMESTAMPTZ</td><td>Automático</td></tr>
        <tr><td><code>updated_at</code></td><td>TIMESTAMPTZ</td><td>Actualizado por trigger automático</td></tr>
      </tbody>
    </table>
  </div>

  <h4>games — Catálogo de videojuegos</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descripción</th></tr></thead>
      <tbody>
        <tr><td><code>id</code></td><td>UUID PK</td><td>Auto-generado</td></tr>
        <tr><td><code>name</code></td><td>VARCHAR(255)</td><td>Nombre visible del juego</td></tr>
        <tr><td><code>slug</code></td><td>VARCHAR(255) UNIQUE</td><td>URL-friendly: <code>the-witcher-3</code></td></tr>
        <tr><td><code>cover_url</code></td><td>TEXT nullable</td><td>URL de la imagen de portada</td></tr>
        <tr><td><code>description</code></td><td>TEXT nullable</td><td>Descripción del juego</td></tr>
        <tr><td><code>created_at</code></td><td>TIMESTAMPTZ</td><td>Automático</td></tr>
      </tbody>
    </table>
  </div>

  <h4>posts — Publicaciones del foro</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descripción</th></tr></thead>
      <tbody>
        <tr><td><code>id</code></td><td>UUID PK</td><td>Auto-generado</td></tr>
        <tr><td><code>title</code></td><td>VARCHAR(500)</td><td>Título del post</td></tr>
        <tr><td><code>body</code></td><td>TEXT</td><td>Contenido HTML sanitizado con DOMPurify</td></tr>
        <tr><td><code>category</code></td><td>post_category</td><td>Categoría del post</td></tr>
        <tr><td><code>game_id</code></td><td>UUID FK → games</td><td>Juego asociado (nullable)</td></tr>
        <tr><td><code>author_id</code></td><td>UUID FK → users</td><td>Autor (SET NULL si se borra el usuario)</td></tr>
        <tr><td><code>is_published</code></td><td>BOOLEAN</td><td>Default <code>true</code>; <code>false</code> = borrador</td></tr>
        <tr><td><code>is_deleted</code></td><td>BOOLEAN</td><td>Soft-delete: el registro permanece pero no se muestra</td></tr>
        <tr><td><code>view_count</code></td><td>INTEGER</td><td>Incrementado en cada GET (fire &amp; forget)</td></tr>
        <tr><td><code>created_at / updated_at</code></td><td>TIMESTAMPTZ</td><td>Trigger automático en UPDATE</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Otras tablas del schema inicial</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tabla</th><th>Propósito</th><th>Claves foráneas</th></tr></thead>
      <tbody>
        <tr><td><code>post_media</code></td><td>Imágenes y embeds de vídeo por post</td><td>post_id → posts (CASCADE)</td></tr>
        <tr><td><code>post_steps</code></td><td>Pasos numerados para guías</td><td>post_id → posts (CASCADE); UNIQUE(post_id, step_num)</td></tr>
        <tr><td><code>comments</code></td><td>Comentarios con threading (adjacency list)</td><td>post_id → posts; author_id → users; parent_id → comments</td></tr>
        <tr><td><code>votes</code></td><td>Upvote (+1) / Downvote (-1) en posts y comentarios</td><td>user_id → users; UNIQUE(user_id, target_type, target_id)</td></tr>
        <tr><td><code>likes</code></td><td>Likes emocionales (no afectan ranking)</td><td>user_id → users; UNIQUE(user_id, target_type, target_id)</td></tr>
        <tr><td><code>favorites</code></td><td>Posts guardados por el usuario</td><td>user_id → users; post_id → posts; UNIQUE(user_id, post_id)</td></tr>
        <tr><td><code>reports</code></td><td>Denuncias de contenido o usuarios</td><td>reporter_id → users</td></tr>
        <tr><td><code>revoked_tokens</code></td><td>Lista negra de refresh tokens revocados en logout</td><td>jti (PK VARCHAR)</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Tablas añadidas en producción (Neon)</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tabla</th><th>Campos principales</th><th>Propósito</th></tr></thead>
      <tbody>
        <tr>
          <td><code>follows</code></td>
          <td><code>follower_id</code> UUID FK → users<br/><code>following_id</code> UUID FK → users<br/>UNIQUE(follower_id, following_id)</td>
          <td>Sistema de seguimiento entre usuarios. Un row = un follow.</td>
        </tr>
        <tr>
          <td><code>direct_messages</code></td>
          <td><code>id</code> UUID PK<br/><code>sender_id</code> UUID FK → users<br/><code>receiver_id</code> UUID FK → users<br/><code>body</code> TEXT (max 2000)<br/><code>read_at</code> TIMESTAMPTZ nullable<br/><code>created_at</code> TIMESTAMPTZ</td>
          <td>Mensajes directos entre usuarios. <code>read_at</code> NULL = no leído. El receptor los marca como leídos al abrir el chat.</td>
        </tr>
        <tr>
          <td><code>friend_requests</code></td>
          <td><code>id</code> UUID PK<br/><code>sender_id</code> UUID FK → users<br/><code>receiver_id</code> UUID FK → users<br/><code>status</code> TEXT CHECK (pending/accepted/rejected)<br/><code>created_at</code> TIMESTAMPTZ<br/>UNIQUE(sender_id, receiver_id)</td>
          <td>Solicitudes de amistad. Auto-acepta si ya existe solicitud inversa pendiente. La restricción UNIQUE evita duplicados.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Vista: post_scores (trending)</h3>
  <p>Vista SQL que calcula el score de trending en tiempo real usando el algoritmo tipo Reddit (ADR-003):</p>
  <pre><span class="keyword">SCORE</span> = votos_netos / (horas_desde_publicacion + 2) ^ 1.8</pre>
  <p>Usada por el endpoint <code>GET /api/posts/trending</code> para devolver los 10 posts más relevantes del momento.</p>

  <h3>Índices creados</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Índice</th><th>Tabla · Columna(s)</th><th>Beneficio</th></tr></thead>
      <tbody>
        <tr><td><code>idx_posts_game_id</code></td><td>posts.game_id</td><td>Filtrado de posts por juego</td></tr>
        <tr><td><code>idx_posts_category</code></td><td>posts.category</td><td>Filtrado por categoría</td></tr>
        <tr><td><code>idx_posts_author_id</code></td><td>posts.author_id</td><td>Posts por usuario (perfil)</td></tr>
        <tr><td><code>idx_posts_created_at</code></td><td>posts.created_at DESC</td><td>Ordenación "nuevos primero"</td></tr>
        <tr><td><code>idx_posts_published</code></td><td>posts(is_published, is_deleted)</td><td>Filtro de visibilidad</td></tr>
        <tr><td><code>idx_comments_post_id</code></td><td>comments.post_id</td><td>Carga de comentarios de un post</td></tr>
        <tr><td><code>idx_comments_parent</code></td><td>comments.parent_id</td><td>Árbol de respuestas</td></tr>
        <tr><td><code>idx_votes_target</code></td><td>votes(target_type, target_id)</td><td>Conteo de votos por post/comentario</td></tr>
        <tr><td><code>idx_likes_target</code></td><td>likes(target_type, target_id)</td><td>Conteo de likes</td></tr>
        <tr><td><code>idx_revoked_tokens_exp</code></td><td>revoked_tokens.expires_at</td><td>Limpieza de tokens caducados</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 5. API Y ENDPOINTS                                                -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">5</div>
    <div class="section-title">API y endpoints</div>
  </div>

  <p>Base URL: <code>http://localhost:3000/api</code>. Formato: JSON. Autenticación: <code>Authorization: Bearer &lt;accessToken&gt;</code>.</p>

  <div class="info-box">
    <strong>Respuesta de error estándar:</strong><br/>
    <code>{ "error": { "code": "UNAUTHORIZED", "message": "Token inválido o expirado" } }</code>
  </div>

  <h3>Auth — /api/auth</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/register</code></td><td>Registro de nuevo usuario. Devuelve accessToken + cookie refreshToken</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/login</code></td><td>Login con email+password. Devuelve accessToken + cookie refreshToken</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/refresh</code></td><td>Renueva accessToken usando la cookie refreshToken (rotación automática)</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/logout</code></td><td>Revoca el refreshToken y limpia la cookie</td><td><span class="badge badge-auth">JWT</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Posts — /api/posts</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/posts</code></td><td>Lista paginada de posts. Params: <code>game</code>, <code>category</code>, <code>sort</code> (new/top/trending), <code>page</code>, <code>limit</code></td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/posts/trending</code></td><td>Top 10 posts por score de trending (vista post_scores)</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/posts/search?q=</code></td><td>Búsqueda full-text ILIKE en título y body</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/posts/:id</code></td><td>Post completo con media, steps, conteo de votos y likes</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/posts</code></td><td>Crear post con título, body, categoría, juego, media y steps opcionales</td><td><span class="badge badge-auth">Usuario+</span></td></tr>
        <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/posts/:id</code></td><td>Editar post propio (o cualquiera si rol es mod+)</td><td><span class="badge badge-auth">Autor/Mod</span></td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/posts/:id</code></td><td>Soft-delete del post (is_deleted = true)</td><td><span class="badge badge-auth">Autor/Mod</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Comentarios — /api/posts/:id/comments · /api/comments</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/posts/:id/comments</code></td><td>Árbol anidado de comentarios. Deleted = <code>[eliminado]</code></td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/posts/:id/comments</code></td><td>Añadir comentario raíz o respuesta (<code>parent_id</code> opcional)</td><td><span class="badge badge-auth">Usuario+</span></td></tr>
        <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/comments/:id</code></td><td>Editar propio (solo el autor)</td><td><span class="badge badge-auth">Autor</span></td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/comments/:id</code></td><td>Soft-delete del comentario</td><td><span class="badge badge-auth">Autor/Mod</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Interacciones — votes · likes · favorites</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/votes</code></td><td>Votar (upsert): <code>{ target_type, target_id, value: 1|-1 }</code></td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/votes</code></td><td>Quitar voto: <code>{ target_type, target_id }</code></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/likes</code></td><td>Dar like. Devuelve <code>{ liked: true, like_count }</code></td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/likes</code></td><td>Quitar like. Devuelve <code>{ liked: false, like_count }</code></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/favorites/:postId</code></td><td>Guardar post en favoritos</td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/favorites/:postId</code></td><td>Eliminar de favoritos</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Juegos — /api/games</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/games</code></td><td>Lista de juegos con post_count y portada</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/games/:slug</code></td><td>Detalle de juego + últimos posts</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/games/search?q=</code></td><td>Búsqueda en IGDB con Apicalypse (debounce 350 ms en cliente)</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/games/search</code></td><td>Upsert de juego IGDB en la DB local (ON CONFLICT slug DO UPDATE)</td><td><span class="badge badge-auth">Usuario+</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/games</code></td><td>Crear juego manualmente</td><td><span class="badge badge-admin">Admin</span></td></tr>
        <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/games/:slug</code></td><td>Editar juego</td><td><span class="badge badge-admin">Admin</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Usuarios — /api/users</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/users/:username</code></td><td>Perfil público con followers_count, following_count, is_following</td><td><span class="badge badge-public">Pública</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/users/me</code></td><td>Mi perfil completo</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/users/me</code></td><td>Actualizar username / bio / avatar_url</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/users/me/favorites</code></td><td>Mis favoritos paginados</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/users/search?q=</code></td><td>Búsqueda ILIKE de usuarios por username (para AddFriendModal)</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/users/:username/follow</code></td><td>Estado de seguimiento del usuario autenticado hacia el target</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/users/:username/follow</code></td><td>Seguir usuario (INSERT ON CONFLICT DO NOTHING)</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/users/:username/follow</code></td><td>Dejar de seguir usuario</td><td><span class="badge badge-auth">JWT</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Mensajería — /api/messages</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/messages</code></td><td>Lista de conversaciones activas con última mensaje, timestamp y unread count (LATERAL join)</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/messages/:username</code></td><td>Mensajes con un usuario. Acepta <code>?since=ISO</code> para polling incremental. Marca mensajes recibidos como leídos.</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/messages/:username</code></td><td>Enviar mensaje (máx 2000 caracteres). Bloquea auto-mensajes.</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/messages/unread</code></td><td>Número de mensajes no leídos (para badge de Navbar, poll 10 s)</td><td><span class="badge badge-auth">JWT</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Amigos — /api/friends</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/friends</code></td><td>Lista de amigos aceptados + solicitudes entrantes pendientes</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/friends/request</code></td><td>Enviar solicitud. Auto-acepta si ya existe solicitud inversa pendiente.</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/friends/respond</code></td><td>Aceptar o rechazar solicitud por <code>request_id</code></td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/friends/pending</code></td><td>Número de solicitudes entrantes pendientes (badge Navbar, poll 15 s)</td><td><span class="badge badge-auth">JWT</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Upload · Reportes · Admin · Health</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span><span class="badge badge-post">POST</span></td><td><code>/api/uploadthing</code></td><td>File router Uploadthing: <code>avatarUploader</code> (2 MB) y <code>postImageUploader</code> (8 MB). Auth vía JWT en middleware.</td><td><span class="badge badge-auth">JWT</span></td></tr>
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/reports</code></td><td>Reportar post / comentario / usuario</td><td><span class="badge badge-auth">Usuario+</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/admin/reports</code></td><td>Ver reportes (filtro por status)</td><td><span class="badge badge-admin">Mod+</span></td></tr>
        <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/admin/reports/:id</code></td><td>Resolver / desestimar reporte</td><td><span class="badge badge-admin">Mod+</span></td></tr>
        <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/admin/users/:id/ban</code></td><td>Banear / desbanear usuario</td><td><span class="badge badge-admin">Mod+</span></td></tr>
        <tr><td><span class="badge badge-delete">DELETE</span></td><td><code>/api/admin/posts/:id</code></td><td>Eliminar cualquier post</td><td><span class="badge badge-admin">Mod+</span></td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/health</code></td><td>Health check: <code>{ status: "ok", db: "connected" }</code></td><td><span class="badge badge-public">Pública</span></td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 6. AUTENTICACIÓN                                                  -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">6</div>
    <div class="section-title">Sistema de autenticación</div>
  </div>

  <h3>Arquitectura de tokens</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Token</th><th>Duración</th><th>Almacenamiento</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td><strong>Access Token</strong> (JWT)</td><td>15 minutos</td><td>Memoria del cliente (React state)</td><td>Header <code>Authorization: Bearer …</code> en cada request</td></tr>
        <tr><td><strong>Refresh Token</strong> (JWT)</td><td>7 días</td><td>Cookie <code>httpOnly</code> + <code>Secure</code> + <code>SameSite=Strict</code></td><td>Renovar el access token sin relogin</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Flujo de registro y login</h3>
  <div class="diagram">
Cliente                         Servidor (Next.js)              PostgreSQL
  │                                   │                              │
  ├── POST /api/auth/register ────────►                              │
  │   { username, email, password }    ├── Validar Zod schema        │
  │                                    ├── Verificar unicidad ───────►
  │                                    ◄── OK                        │
  │                                    ├── bcrypt hash (cost 12)     │
  │                                    ├── INSERT users ─────────────►
  │                                    ├── signAccessToken (15m)     │
  │                                    ├── signRefreshToken (7d)     │
  ◄── 201 { user, accessToken } ───────│                             │
  ◄── Set-Cookie: fg_refresh_token ────│                             │
  │                                   │                              │
  ├── POST /api/auth/login ───────────►                              │
  │   { email, password }              ├── SELECT user by email ─────►
  │                                    ◄── user row                  │
  │                                    ├── bcrypt.compare()          │
  │                                    ├── Verificar !is_banned      │
  ◄── 200 { user, accessToken } ───────│                             │
  ◄── Set-Cookie: fg_refresh_token ────│                             │
  </div>

  <h3>Flujo de refresco de token (rotación)</h3>
  <div class="diagram">
Cliente                         Servidor                        PostgreSQL
  │                                   │                              │
  ├── POST /api/auth/refresh ─────────►                              │
  │   Cookie: fg_refresh_token         ├── verifyRefreshToken()      │
  │                                    ├── SELECT revoked_tokens ────►
  │                                    ◄── (no revocado)             │
  │                                    ├── SELECT user, !is_banned ──►
  │                                    ├── INSERT revoked_tokens ────►  ← revoca el antiguo
  │                                    ├── signAccessToken  (nuevo)  │
  │                                    ├── signRefreshToken (nuevo)  │
  ◄── 200 { accessToken } ─────────────│                             │
  ◄── Set-Cookie: fg_refresh_token ────│  (nuevo refresh token)      │
  </div>

  <h3>Flujo de logout</h3>
  <div class="diagram">
Cliente                         Servidor                        PostgreSQL
  │                                   │                              │
  ├── POST /api/auth/logout ──────────►                              │
  │   Cookie: fg_refresh_token         ├── verifyRefreshToken()      │
  │                                    ├── INSERT revoked_tokens ────►  ← invalida token
  │                                    ├── Set-Cookie: MaxAge=0      │
  ◄── 200 { message: "Sesión cerrada" }│                             │
  </div>

  <h3>Proxy (antes middleware) — src/proxy.ts</h3>
  <p>
    El archivo <code>src/proxy.ts</code> intercepta <strong>todas las requests</strong> a la aplicación.
    Si la request incluye un <code>Authorization: Bearer &lt;token&gt;</code> válido,
    extrae el payload del JWT y añade tres headers al request antes de pasarlo al route handler:
  </p>
  <pre><span class="comment">// Headers inyectados por el proxy en cada request autenticada</span>
x-user-id       → payload.sub       <span class="comment">// UUID del usuario</span>
x-user-role     → payload.role      <span class="comment">// admin | moderator | user | guest</span>
x-user-username → payload.username</pre>
  <p>
    Cada route handler lee estos headers con <code>request.headers.get('x-user-id')</code>.
    Si el token es inválido o no existe, los headers no se añaden y la route handler
    devuelve 401 si requiere autenticación.
  </p>

  <h3>Matriz de permisos por rol</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Acción</th><th>Invitado</th><th>Usuario</th><th>Moderador</th><th>Admin</th></tr></thead>
      <tbody>
        <tr><td>Leer posts y comentarios</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td></tr>
        <tr><td>Votar / likear / favoritos</td><td>❌</td><td>✅</td><td>✅</td><td>✅</td></tr>
        <tr><td>Crear post</td><td>❌</td><td>✅</td><td>✅</td><td>✅</td></tr>
        <tr><td>Editar / eliminar post propio</td><td>❌</td><td>✅</td><td>✅</td><td>✅</td></tr>
        <tr><td>Eliminar cualquier post</td><td>❌</td><td>❌</td><td>✅</td><td>✅</td></tr>
        <tr><td>Gestionar reportes</td><td>❌</td><td>❌</td><td>✅</td><td>✅</td></tr>
        <tr><td>Banear usuarios</td><td>❌</td><td>❌</td><td>✅</td><td>✅</td></tr>
        <tr><td>Crear / editar juegos</td><td>❌</td><td>❌</td><td>❌</td><td>✅</td></tr>
        <tr><td>Gestionar roles de usuario</td><td>❌</td><td>❌</td><td>❌</td><td>✅</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Seguridad adicional implementada</h3>
  <ul>
    <li><strong>Rate limiting:</strong> login 10 req/15 min, registro 5 req/h, posts 10 req/h, votos 100 req/h — todo por IP o userId.</li>
    <li><strong>Sanitización XSS:</strong> posts con DOMPurify permisivo (permite headings, listas, imágenes); comentarios con configuración restrictiva (solo formato básico).</li>
    <li><strong>Whitelist de embeds:</strong> solo youtube.com, youtu.be y vimeo.com permitidos como <code>video_embed</code>.</li>
    <li><strong>SQL injection:</strong> todas las queries usan <code>$1, $2, …</code> (parametrizadas), nunca interpolación de strings.</li>
    <li><strong>Security headers:</strong> CSP, X-Frame-Options: DENY, X-Content-Type-Options, HSTS, Referrer-Policy — configurados en <code>next.config.ts</code>.</li>
  </ul>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 7. CORRECCIONES APLICADAS                                         -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">7</div>
    <div class="section-title">Correcciones aplicadas</div>
  </div>

  <p>A lo largo del desarrollo se detectaron y corrigieron varios problemas técnicos significativos.</p>

  <h3>Corrección 1 — images.domains → images.remotePatterns</h3>

  <h4>¿Qué era el problema?</h4>
  <p>
    La propiedad <code>images.domains</code> de <code>next.config.ts</code> fue deprecada en Next.js 13
    y eliminada en Next.js 16. Permitía indicar dominios permitidos para la optimización de imágenes,
    pero sin control sobre protocolo ni rutas.
  </p>

  <h4>¿Qué se cambió?</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th></th><th>Código antiguo (deprecado)</th><th>Código nuevo (correcto)</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>Propiedad</strong></td>
          <td><code>images.domains: ['images.example.com', 'i.imgur.com']</code></td>
          <td><code>images.remotePatterns: [{ protocol: 'https', hostname: '…' }]</code></td>
        </tr>
      </tbody>
    </table>
  </div>
  <pre><span class="comment">// Antes (deprecado)</span>
images: {
  domains: [<span class="string">'images.example.com'</span>, <span class="string">'i.imgur.com'</span>],
}

<span class="comment">// Después (correcto — next.config.ts)</span>
images: {
  remotePatterns: [
    { protocol: <span class="string">'https'</span>, hostname: <span class="string">'images.example.com'</span> },
    { protocol: <span class="string">'https'</span>, hostname: <span class="string">'i.imgur.com'</span> },
    <span class="comment">// TODO: Añadir dominio CDN real cuando se configure el storage</span>
  ],
},</pre>
  <p><strong>Beneficio adicional:</strong> <code>remotePatterns</code> es más seguro porque permite especificar protocolo, hostname, pathname y port, evitando que se sirvan imágenes desde rutas inesperadas del mismo dominio.</p>

  <h3>Corrección 2 — middleware.ts → proxy.ts + renombrar función</h3>

  <h4>¿Qué era el problema?</h4>
  <p>
    En Next.js 16, el archivo convencional <code>src/middleware.ts</code> fue renombrado a
    <code>src/proxy.ts</code> y la función exportada debe llamarse <code>proxy</code> (no <code>middleware</code>).
    El servidor mostraba: <em>"The 'middleware' file convention is deprecated. Please use 'proxy' instead."</em>
    y luego al crear el archivo: <em>"Proxy is missing expected function export name"</em>.
  </p>

  <h4>¿Qué se cambió?</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th></th><th>Antes</th><th>Después</th></tr></thead>
      <tbody>
        <tr><td><strong>Nombre del archivo</strong></td><td><code>src/middleware.ts</code></td><td><code>src/proxy.ts</code></td></tr>
        <tr><td><strong>Nombre de la función exportada</strong></td><td><code>export async function middleware(request)</code></td><td><code>export async function proxy(request)</code></td></tr>
        <tr><td><strong>Resto del código</strong></td><td colspan="2">Idéntico — misma lógica de inyección de headers JWT</td></tr>
      </tbody>
    </table>
  </div>

  <div class="success-box">
    ✅ Tras ambas correcciones, el servidor arrancó sin ningún aviso y el health check respondió correctamente:
    <code>{ "status": "ok", "db": "connected" }</code>
  </div>

  <h3>Corrección 3 — isomorphic-dompurify crasheaba todas las API routes en Vercel</h3>

  <h4>¿Qué era el problema?</h4>
  <p>
    Todas las rutas API que usaban <code>sanitize.ts</code> (posts, comentarios, usuarios) fallaban en producción con
    <code>ERR_REQUIRE_ESM</code>. La cadena de dependencias era:
    <code>isomorphic-dompurify → jsdom → html-encoding-sniffer → @exodus/bytes</code>.
    El paquete <code>@exodus/bytes</code> es ESM-only y Vercel/Turbopack no puede importarlo con <code>require()</code>.
  </p>

  <h4>¿Qué se cambió?</h4>
  <p>Se reemplazó completamente <code>isomorphic-dompurify</code> con una implementación nativa en <code>src/lib/sanitize.ts</code>
  que no tiene ninguna dependencia externa:</p>
  <ul>
    <li><code>sanitizePlainText(text)</code> — elimina todas las etiquetas HTML y escapa entidades.</li>
    <li><code>sanitizePostBody(html)</code> — whitelist de tags permitidos en posts (headings, listas, imágenes, enlaces, embeds).</li>
    <li><code>sanitizeComment(html)</code> — whitelist restrictiva para comentarios (solo formato básico: <code>b, i, u, a, code</code>).</li>
  </ul>
  <div class="success-box">✅ Tras el fix, todos los endpoints de posts, comentarios y perfil volvieron a funcionar en producción.</div>

  <h3>Corrección 4 — Mensajes duplicándose por precisión de microsegundos</h3>

  <h4>¿Qué era el problema?</h4>
  <p>
    El chat usaba <code>created_at</code> del último mensaje como parámetro <code>?since=</code> para el polling incremental.
    PostgreSQL almacena TIMESTAMPTZ con precisión de microsegundos (<code>.123456</code>), pero <code>JSON.stringify</code>
    trunca los timestamps de Date a milisegundos (<code>.123Z</code>). El mismo mensaje se devolvía en el siguiente poll
    porque <code>.123456 &gt; .123000</code> pasaba el filtro <code>WHERE created_at &gt; $since</code>.
  </p>

  <h4>¿Qué se cambió?</h4>
  <p>
    El cliente ahora suma 1 ms al timestamp antes de usarlo como <code>since</code>:
    <code>new Date(lastCreatedAt.getTime() + 1).toISOString()</code>.
    Además, se añadió deduplicación por <code>id</code> al añadir mensajes al estado para mayor robustez.
  </p>
  <div class="success-box">✅ Los mensajes ya no se duplican en el chat.</div>
</div>

<!-- ══════════════════════════════════════════════════════════════════ -->
<!-- 8. ESTADO ACTUAL Y PRÓXIMOS PASOS                                -->
<!-- ══════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">8</div>
    <div class="section-title">Estado actual y próximos pasos</div>
  </div>

  <h3>¿Qué funciona hoy?</h3>

  <div class="success-box">
    ✅ Servidor corriendo en <strong>http://localhost:3000</strong> · Next.js 16.2.3 (Turbopack) · Ready in ~400ms
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Capa</th><th>Estado</th><th>Detalles</th></tr></thead>
      <tbody>
        <tr><td>Infraestructura</td><td>✅ Completo</td><td>PostgreSQL 17 corriendo, DB creada, 11 tablas, 10 índices</td></tr>
        <tr><td>API de autenticación</td><td>✅ Completo</td><td>Register, login, refresh (rotación), logout (revocación)</td></tr>
        <tr><td>API de posts</td><td>✅ Completo</td><td>CRUD, trending, búsqueda, paginación, filtros</td></tr>
        <tr><td>API de comentarios</td><td>✅ Completo</td><td>Árbol anidado, create, edit, soft-delete</td></tr>
        <tr><td>API de interacciones</td><td>✅ Completo</td><td>Votos (upsert), likes, favoritos</td></tr>
        <tr><td>API de juegos</td><td>✅ Completo</td><td>CRUD por admin, detalle con últimos posts</td></tr>
        <tr><td>API de usuarios</td><td>✅ Completo</td><td>Perfil público, mi perfil, edición, mis favoritos</td></tr>
        <tr><td>API de moderación</td><td>✅ Completo</td><td>Reportes, baneos, eliminación de contenido</td></tr>
        <tr><td>Seguridad</td><td>✅ Completo</td><td>Rate limiting, XSS sanitization, security headers, Zod validation</td></tr>
        <tr><td>Frontend — componentes</td><td>✅ Completo</td><td>Navbar, Sidebar, Feed, PostCard, VoteButtons, CommentTree, GameSearch, FollowButton, AddFriendModal</td></tr>
        <tr><td>Frontend — páginas</td><td>✅ Completo</td><td>19 páginas: home, post, game (IGDB), games, category, search, user, submit, settings, messages, messages/chat, friends, login, register, admin (×4)</td></tr>
        <tr><td>Upload de imágenes</td><td>✅ Completo</td><td>Uploadthing v7: avatares en /settings, imágenes en formulario de post</td></tr>
        <tr><td>IGDB</td><td>✅ Completo</td><td>Búsqueda en tiempo real, upsert en DB, páginas enriquecidas con screenshots y rating</td></tr>
        <tr><td>Seguimiento</td><td>✅ Completo</td><td>Follow/unfollow, contadores en perfil, FollowButton con estado real desde cliente</td></tr>
        <tr><td>Mensajería directa</td><td>✅ Completo</td><td>Chat con polling 3 s, marca de leído, badge en Navbar, lista de conversaciones</td></tr>
        <tr><td>Sistema de amigos</td><td>✅ Completo</td><td>Solicitudes, aceptar/rechazar, lista de amigos, badge en Navbar</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Qué falta por configurar</h3>

  <h4>1. Búsqueda full-text optimizada (GIN)</h4>
  <p>La búsqueda actual usa ILIKE (suficiente para el volumen actual). Para producción con alto volumen de posts, migrar a índice GIN:</p>
  <pre><span class="keyword">ALTER TABLE</span> posts <span class="keyword">ADD COLUMN</span> search_vector tsvector
  <span class="keyword">GENERATED ALWAYS AS</span> (to_tsvector(<span class="string">'spanish'</span>, title || <span class="string">' '</span> || body)) STORED;
<span class="keyword">CREATE INDEX</span> idx_posts_fts <span class="keyword">ON</span> posts <span class="keyword">USING GIN</span>(search_vector);</pre>

  <h4>2. Rate limiter en Redis</h4>
  <p>El rate limiter actual usa memoria en proceso (sliding window). En Vercel serverless cada instancia tiene su propia memoria, por lo que el límite no es global. Para producción real migrar a Upstash Redis:</p>
  <pre>npm install @upstash/ratelimit @upstash/redis</pre>

  <h3>Roadmap — próximas iteraciones</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Prioridad</th><th>Feature</th><th>Notas</th></tr></thead>
      <tbody>
        <tr><td>🟡 Media</td><td>Migrar rate limiter a Upstash Redis</td><td>Necesario al escalar a múltiples instancias serverless</td></tr>
        <tr><td>🟡 Media</td><td>Índice GIN para búsqueda full-text</td><td>Mejora rendimiento con alto volumen de posts</td></tr>
        <tr><td>🟡 Media</td><td>Tests unitarios e integración</td><td>Cobertura mínima objetivo 70%</td></tr>
        <tr><td>🟡 Media</td><td>Notificaciones en tiempo real</td><td>WebSocket o SSE para reemplazar los pollings actuales</td></tr>
        <tr><td>🟢 Baja</td><td>Estado de amistad en perfiles</td><td>Mostrar "Amigos" / "Solicitud enviada" en /user/:username</td></tr>
        <tr><td>🟢 Baja</td><td>i18n (internacionalización)</td><td>Actualmente en español; arquitectura preparada para múltiples idiomas</td></tr>
        <tr><td>🟢 Baja</td><td>CDN para assets estáticos</td><td>Configurar en next.config.ts remotePatterns</td></tr>
        <tr><td>🟢 Baja</td><td>Moderación de mensajes privados</td><td>Reportar mensajes individuales</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Credenciales del entorno de desarrollo</h3>
  <div class="warn-box">
    ⚠️ Las credenciales a continuación son solo para desarrollo local. No usar en producción.
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Variable</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>PostgreSQL host</td><td>localhost:5432</td></tr>
        <tr><td>PostgreSQL user</td><td>postgres</td></tr>
        <tr><td>PostgreSQL database</td><td>forogaming</td></tr>
        <tr><td>App URL</td><td>http://localhost:3000</td></tr>
        <tr><td>JWT_ACCESS_EXPIRES</td><td>15m</td></tr>
        <tr><td>JWT_REFRESH_EXPIRES</td><td>7d</td></tr>
      </tbody>
    </table>
  </div>

  <br/><br/>
  <div class="info-box" style="text-align:center;">
    <strong>Forogaming v1.2.0</strong> · Documentación generada el 10 de abril de 2026<br/>
    Proyecto desarrollado íntegramente con Claude Code (Anthropic) · Next.js 16 + PostgreSQL (Neon) + Uploadthing + IGDB
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!--  SECCIÓN 9 — DESPLIEGUE EN PRODUCCIÓN                                 -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">9</div>
    <div class="section-title">Despliegue en Producción</div>
  </div>

  <div class="success-box">
    ✅ Forogaming está desplegado y operativo en producción desde el 9 de abril de 2026.
    Stack: GitHub (código) + Vercel (hosting) + Neon (PostgreSQL serverless) — coste mensual: 0 €.
  </div>

  <h3>Infraestructura</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Servicio</th><th>Proveedor</th><th>URL / Detalle</th><th>Plan</th></tr></thead>
      <tbody>
        <tr><td>Frontend + API</td><td>Vercel</td><td>https://forogaming.vercel.app</td><td>Hobby (gratuito)</td></tr>
        <tr><td>Base de datos</td><td>Neon</td><td>PostgreSQL 16 serverless · eu-west-2 (AWS Londres)</td><td>Free tier</td></tr>
        <tr><td>Código fuente</td><td>GitHub</td><td>https://github.com/Nikode17/forogaming</td><td>Public repo</td></tr>
        <tr><td>CI/CD</td><td>Vercel</td><td>Deploy automático en cada push a <code>master</code></td><td>Incluido</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Variables de entorno en producción (Vercel)</h3>
  <div class="warn-box">⚠️ Estos valores son privados. Se configuran en el panel de Vercel, nunca en el repositorio.</div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Variable</th><th>Descripción</th></tr></thead>
      <tbody>
        <tr><td><code>DATABASE_URL</code></td><td>Connection string de Neon con <code>sslmode=require</code></td></tr>
        <tr><td><code>JWT_SECRET</code></td><td>Secreto de 48 bytes para firmar access/refresh tokens</td></tr>
        <tr><td><code>NEXT_PUBLIC_APP_URL</code></td><td><code>https://forogaming.vercel.app</code></td></tr>
        <tr><td><code>APP_ENV</code></td><td><code>production</code> — activa SSL en el pool de PG y headers de seguridad</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Proceso de despliegue paso a paso</h3>
  <ol>
    <li><strong>Instalación de gh CLI</strong> — <code>winget install --id GitHub.cli</code></li>
    <li><strong>Autenticación GitHub</strong> — <code>gh auth login</code> → Continue with GitHub (navegador)</li>
    <li><strong>Inicialización del repositorio</strong> — <code>git init</code>, commit inicial (69 ficheros), push</li>
    <li><strong>Creación del repo en GitHub</strong> — <code>gh repo create forogaming --public --source=. --push</code></li>
    <li><strong>Neon</strong> — Proyecto <em>forogaming</em> creado manualmente en neon.tech; migraciones ejecutadas vía Node.js con <code>pg</code> Pool</li>
    <li><strong>Vercel CLI</strong> — <code>npm i -g vercel</code> · <code>vercel login</code> (GitHub OAuth)</li>
    <li><strong>Variables de entorno</strong> — <code>vercel env add DATABASE_URL production</code> (×4 variables)</li>
    <li><strong>Deploy</strong> — <code>vercel --prod --yes</code>; build exitoso en 38 s, 27 rutas generadas</li>
  </ol>

  <h3>Fix aplicado durante el despliegue</h3>
  <p>El build de producción falló por un error de TypeScript en <code>src/lib/db.ts</code>: el tipo genérico
  <code>T</code> de la función <code>query&lt;T&gt;</code> no tenía la restricción requerida por la librería <code>pg</code>.</p>
  <pre><span class="comment">// Antes (fallaba en producción)</span>
export async function query&lt;<span class="keyword">T</span> = Record&lt;string, unknown&gt;&gt;(...)

<span class="comment">// Después (correcto)</span>
export async function query&lt;<span class="keyword">T</span> extends QueryResultRow = QueryResultRow&gt;(...)</pre>
  <p>El fix se commiteó, se hizo push y Vercel desplegó automáticamente en el siguiente push.</p>

  <h3>Panel de administración</h3>
  <p>Se añadieron dos mejoras al panel de admin tras el despliegue inicial:</p>
  <ul>
    <li><strong>Catálogo de juegos</strong> (<code>/admin/games</code>) — CRUD completo: crear juego con slug automático, editar nombre/descripción/portada, listar con conteo de posts. Acceso restringido a rol <code>admin</code>.</li>
    <li><strong>Enlace en la Navbar</strong> — El dropdown del usuario muestra "Panel de administración" en color indigo cuando <code>user.role === 'admin'</code>, enlazando a <code>/admin</code>.</li>
  </ul>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Ruta</th><th>Descripción</th><th>Acceso</th></tr></thead>
      <tbody>
        <tr><td><code>/admin</code></td><td>Dashboard con métricas y accesos rápidos</td><td>Admin</td></tr>
        <tr><td><code>/admin/games</code></td><td>Gestión del catálogo de juegos (CRUD)</td><td>Admin</td></tr>
        <tr><td><code>/admin/users</code></td><td>Gestión de usuarios (ban/unban)</td><td>Admin</td></tr>
        <tr><td><code>/admin/reports</code></td><td>Revisión de reportes de contenido</td><td>Admin</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Cuenta de administrador</h3>
  <p>El usuario <strong>Nikode17</strong> tiene rol <code>admin</code> en la base de datos de producción (Neon).
  El rol se asignó directamente vía SQL tras el registro en la web de producción:</p>
  <pre>UPDATE users SET role = <span class="string">'admin'</span> WHERE username = <span class="string">'Nikode17'</span>;</pre>

  <h3>Flujo CI/CD activo</h3>
  <p>Cada <code>git push</code> a la rama <code>master</code> desencadena automáticamente un nuevo build y deploy
  en Vercel. El tiempo medio de deploy es ~60 s. No se requiere ninguna acción manual.</p>

  <br/>
  <h3>Usuarios administradores</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Usuario</th><th>Rol</th></tr></thead>
      <tbody>
        <tr><td>Nikode17</td><td>admin</td></tr>
        <tr><td>MuckMaster</td><td>admin</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Variables de entorno adicionales (Uploadthing + IGDB)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Variable</th><th>Descripción</th></tr></thead>
      <tbody>
        <tr><td><code>UPLOADTHING_TOKEN</code></td><td>Token JWT de la app Uploadthing (panel uploadthing.com)</td></tr>
        <tr><td><code>TWITCH_CLIENT_ID</code></td><td>Client ID de la app Twitch para IGDB OAuth</td></tr>
        <tr><td><code>TWITCH_CLIENT_SECRET</code></td><td>Client Secret de la app Twitch para IGDB OAuth</td></tr>
      </tbody>
    </table>
  </div>

  <div class="success-box" style="text-align:center;">
    <strong>Forogaming v1.2.0 — en producción</strong><br/>
    https://forogaming.vercel.app · GitHub: Nikode17/forogaming<br/>
    Actualizado el 10 de abril de 2026
  </div>
</div>

</body>
</html>`

// ─────────────────────────────────────────────────────────────────────────────
// GENERAR PDF CON PUPPETEER + EDGE
// ─────────────────────────────────────────────────────────────────────────────
async function generatePdf() {
  console.log('[docs] Iniciando generación de PDF...')

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    console.log(`[docs] ✅ PDF generado: ${OUTPUT_PATH}`)
  } finally {
    await browser.close()
  }
}

generatePdf().catch(err => {
  console.error('[docs] ❌ Error:', err.message)
  process.exit(1)
})
