#!/usr/bin/env node
// scripts/generate-learning-guide.js
// Genera guia-aprendizaje-respawn.pdf en el Escritorio

const puppeteer = require('puppeteer')
const path = require('path')
const os = require('os')

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUTPUT_PATH = path.join(os.homedir(), 'Desktop', 'guia-aprendizaje-respawn.pdf')

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Guía de Aprendizaje — Respawn</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11pt; line-height: 1.85; color: #1e1e2e; background: #fff; }

  .cover {
    min-height: 100vh; display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1040 50%, #0d1a2e 100%);
    color: white; text-align: center; padding: 60px 40px;
    page-break-after: always;
  }
  .cover h1 { font-size: 44pt; font-weight: 900; background: linear-gradient(90deg, #38bdf8, #818cf8, #e879f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
  .cover .sub { font-size: 15pt; color: #94a3b8; margin-bottom: 10px; }
  .cover .desc { font-size: 11pt; color: #64748b; margin-bottom: 48px; max-width: 520px; }
  .cover .badge { background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); border-radius: 8px; padding: 6px 18px; color: #818cf8; font-size: 10pt; margin-bottom: 32px; display: inline-block; }
  .cover .toc { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px 40px; text-align: left; color: #cbd5e1; font-size: 10pt; line-height: 2.2; max-width: 560px; }
  .cover .toc strong { color: #818cf8; }

  .page { padding: 48px 56px; page-break-after: always; max-width: 800px; margin: 0 auto; }
  .page:last-child { page-break-after: avoid; }

  .section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #4f46e5; }
  .section-num { width: 46px; height: 46px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 17pt; font-weight: 900; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .section-title { font-size: 19pt; font-weight: 800; color: #1e1e2e; }
  .section-subtitle { font-size: 10pt; color: #6366f1; font-weight: 600; margin-top: 2px; }

  h2 { font-size: 13pt; font-weight: 700; color: #312e81; margin: 26px 0 10px; border-left: 3px solid #6366f1; padding-left: 10px; }
  h3 { font-size: 11.5pt; font-weight: 700; color: #4338ca; margin: 18px 0 7px; }
  p { margin-bottom: 12px; color: #374151; }
  ul, ol { padding-left: 22px; margin-bottom: 14px; color: #374151; }
  li { margin-bottom: 7px; }
  strong { color: #1e1e2e; }

  pre {
    background: #0f172a; color: #e2e8f0; padding: 18px 20px;
    border-radius: 10px; font-size: 9.5pt; line-height: 1.7;
    margin: 14px 0 18px; overflow-x: auto; white-space: pre-wrap;
    word-break: break-word; border-left: 4px solid #6366f1;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  }
  .kw { color: #f472b6; }
  .fn { color: #38bdf8; }
  .str { color: #86efac; }
  .cm { color: #64748b; font-style: italic; }
  .num { color: #fb923c; }
  .ty { color: #fbbf24; }
  .prop { color: #a5f3fc; }

  .box { border-radius: 10px; padding: 16px 20px; margin: 14px 0 18px; }
  .tip { background: #f0fdf4; border-left: 4px solid #22c55e; }
  .tip::before { content: "💡 "; font-size: 11pt; }
  .warn { background: #fef3c7; border-left: 4px solid #f59e0b; }
  .warn::before { content: "⚠️ "; }
  .analogy { background: #eef2ff; border-left: 4px solid #6366f1; }
  .analogy::before { content: "🔁 Analogía — "; font-weight: 700; color: #4338ca; font-size: 10pt; }
  .concept { background: #fdf4ff; border-left: 4px solid #d946ef; }
  .concept::before { content: "📌 Concepto clave — "; font-weight: 700; color: #9333ea; font-size: 10pt; }
  .flow { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 14px 0 18px; font-size: 10.5pt; }
  .flow .step { display: flex; gap: 12px; margin-bottom: 8px; align-items: flex-start; }
  .flow .step-n { background: #4f46e5; color: white; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .box p, .box li { margin-bottom: 6px; color: inherit; }

  table { width: 100%; border-collapse: collapse; margin: 14px 0 18px; font-size: 10pt; }
  th { background: #4f46e5; color: white; padding: 10px 14px; text-align: left; font-weight: 600; }
  td { padding: 9px 14px; border-bottom: 1px solid #e5e7eb; color: #374151; }
  tr:nth-child(even) td { background: #f9fafb; }

  .divider { border: none; border-top: 1px dashed #e5e7eb; margin: 22px 0; }
  .tag { background: #eef2ff; color: #4338ca; border-radius: 4px; padding: 2px 8px; font-size: 9pt; font-weight: 600; display: inline-block; margin: 2px; }
  .file { background: #0f172a; color: #94a3b8; border-radius: 4px; padding: 2px 8px; font-size: 9pt; font-family: monospace; display: inline-block; }
</style>
</head>
<body>

<!-- ══════════════════ PORTADA ══════════════════ -->
<div class="cover">
  <div class="badge">Guía técnica de aprendizaje · Abril 2026</div>
  <h1>Guía de Aprendizaje</h1>
  <div class="sub">Respawn — Comunidad de videojuegos</div>
  <div class="desc">Aprende la lógica real del código: por qué se tomó cada decisión, cómo funcionan los patrones de programación usados y cómo encajan todas las piezas.</div>
  <div class="toc">
    <strong>Índice de contenidos</strong><br/>
    01 · Cómo está organizado el proyecto (estructura de carpetas)<br/>
    02 · TypeScript: tipos, interfaces y por qué los usamos<br/>
    03 · React: componentes, estado y hooks explicados con código real<br/>
    04 · Next.js: rutas, Server vs Client, API Routes<br/>
    05 · Base de datos: SQL, consultas parametrizadas y transacciones<br/>
    06 · Autenticación: JWT, bcrypt, cookies httpOnly — de dentro hacia fuera<br/>
    07 · El middleware: cómo fluye cada petición<br/>
    08 · Validación de datos con Zod<br/>
    09 · El sistema de votos y el algoritmo de trending<br/>
    10 · El chat: polling, estado y renderizado en tiempo real<br/>
    11 · Gestión de imágenes: presigned URLs y Uploadthing<br/>
    12 · Rate limiting: protección contra abuso<br/>
    13 · Patrones de código que se repiten — y por qué<br/>
    14 · Errores reales que se cometieron y cómo se corrigieron
  </div>
</div>

<!-- ══════════════════ 01 · ESTRUCTURA ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">1</div>
    <div><div class="section-title">Cómo está organizado el proyecto</div><div class="section-subtitle">Estructura de carpetas y convenciones de Next.js</div></div>
  </div>

  <p>La estructura de carpetas no es arbitraria. En Next.js 15 con App Router, <strong>la ubicación de un archivo determina su comportamiento</strong>. Entender esto es fundamental antes de leer cualquier línea de código.</p>

  <h2>La raíz del proyecto</h2>
  <pre><span class="prop">Forogaming/</span>
  <span class="cm">├── src/                  ← TODO el código vive aquí</span>
  <span class="cm">│   ├── app/              ← rutas de la aplicación (= páginas y APIs)</span>
  <span class="cm">│   ├── components/       ← piezas de UI reutilizables</span>
  <span class="cm">│   ├── contexts/         ← estado global compartido (React Context)</span>
  <span class="cm">│   ├── lib/              ← utilidades puras: DB, auth, validación...</span>
  <span class="cm">│   └── types/            ← definiciones de tipos TypeScript</span>
  <span class="cm">├── migrations/           ← scripts SQL para crear/modificar la BD</span>
  <span class="cm">├── scripts/              ← utilidades de línea de comandos</span>
  <span class="cm">├── public/               ← archivos estáticos (logo, favicon...)</span>
  <span class="cm">├── next.config.ts        ← configuración de Next.js</span>
  <span class="cm">└── package.json          ← dependencias del proyecto</span></pre>

  <h2>La carpeta <code>app/</code> — convención basada en archivos</h2>
  <div class="analogy">
    <p>Piensa en <code>app/</code> como un árbol de carpetas donde <strong>cada carpeta es una URL</strong>. Si creas <code>app/juegos/page.tsx</code>, la URL <code>/juegos</code> mostrará ese archivo automáticamente, sin configurar nada más.</p>
  </div>

  <table>
    <tr><th>Archivo especial</th><th>Qué hace</th></tr>
    <tr><td><code>page.tsx</code></td><td>La página visible en esa URL</td></tr>
    <tr><td><code>layout.tsx</code></td><td>Envuelve todas las páginas hijas (Navbar, Footer van aquí)</td></tr>
    <tr><td><code>route.ts</code></td><td>API endpoint — responde a GET, POST, etc.</td></tr>
    <tr><td><code>loading.tsx</code></td><td>Pantalla de carga mientras carga la página</td></tr>
    <tr><td><code>error.tsx</code></td><td>Pantalla de error si la página falla</td></tr>
  </table>

  <h2>Rutas dinámicas: los corchetes <code>[ ]</code></h2>
  <p>Cuando una carpeta tiene corchetes, el valor en la URL se convierte en un parámetro:</p>
  <pre><span class="cm">app/user/[username]/page.tsx</span>    <span class="cm">→  /user/Nikode17  →  username = "Nikode17"</span>
<span class="cm">app/post/[id]/page.tsx</span>          <span class="cm">→  /post/abc-123   →  id = "abc-123"</span>
<span class="cm">app/api/users/[username]/route.ts</span>  <span class="cm">→  API: /api/users/Nikode17</span></pre>

  <div class="concept">
    <p>La carpeta <code>(auth)/</code> tiene paréntesis — eso es un <em>route group</em>. Los paréntesis le dicen a Next.js "agrupa estas rutas pero no incluyas esta carpeta en la URL". Así <code>(auth)/login/page.tsx</code> genera la URL <code>/login</code>, no <code>/auth/login</code>.</p>
  </div>

  <h2>La carpeta <code>lib/</code> — el "motor" sin interfaz</h2>
  <p>Aquí vive código que no tiene nada que ver con la UI. Son funciones puras que hacen una sola cosa:</p>
  <ul>
    <li><span class="file">lib/db.ts</span> — conectarse a PostgreSQL y ejecutar queries</li>
    <li><span class="file">lib/auth.ts</span> — crear y verificar tokens JWT</li>
    <li><span class="file">lib/password.ts</span> — hashear y verificar contraseñas con bcrypt</li>
    <li><span class="file">lib/validation.ts</span> — esquemas Zod para validar datos de entrada</li>
    <li><span class="file">lib/ratelimit.ts</span> — controlar cuántas peticiones puede hacer cada usuario</li>
    <li><span class="file">lib/igdb.ts</span> — comunicarse con la API externa de videojuegos</li>
    <li><span class="file">lib/sanitize.ts</span> — limpiar HTML para evitar ataques XSS</li>
  </ul>
</div>

<!-- ══════════════════ 02 · TYPESCRIPT ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">2</div>
    <div><div class="section-title">TypeScript</div><div class="section-subtitle">Tipos, interfaces y por qué el compilador es tu aliado</div></div>
  </div>

  <p>TypeScript es JavaScript con una capa encima que te dice <em>antes de ejecutar el código</em> si algo va a fallar. Es como tener un corrector ortográfico, pero para la lógica del programa.</p>

  <h2>El problema que resuelve</h2>
  <pre><span class="cm">// JavaScript normal — esto no da error hasta que lo ejecutas</span>
<span class="kw">function</span> <span class="fn">saludar</span>(usuario) {
  <span class="kw">return</span> <span class="str">"Hola "</span> + usuario.nombre  <span class="cm">// ¿tiene .nombre? ¿y si es undefined?</span>
}
saludar(<span class="kw">null</span>)  <span class="cm">// 💥 TypeError en tiempo de ejecución</span>

<span class="cm">// TypeScript — el error aparece mientras escribes, antes de ejecutar</span>
<span class="kw">function</span> <span class="fn">saludar</span>(usuario: <span class="ty">{ nombre: string }</span>) {
  <span class="kw">return</span> <span class="str">"Hola "</span> + usuario.nombre
}
saludar(<span class="kw">null</span>)  <span class="cm">// ❌ Error: null no tiene .nombre (el editor lo subraya en rojo)</span></pre>

  <h2>Interfaces — describir la forma de los datos</h2>
  <p>Una interfaz es un "contrato" que dice exactamente qué campos tiene un objeto y de qué tipo son cada uno. En <span class="file">src/types/index.ts</span> están todas las interfaces del proyecto:</p>
  <pre><span class="kw">export interface</span> <span class="ty">Post</span> {
  id: <span class="ty">string</span>           <span class="cm">// UUID, ej: "a3f1bc..."</span>
  title: <span class="ty">string</span>
  body: <span class="ty">string</span>
  category: <span class="ty">'guide' | 'easter-egg' | 'review' | 'general'</span>  <span class="cm">// solo estos 4 valores</span>
  author: <span class="ty">{ id: string; username: string; avatar_url: string | null }</span>
  upvotes: <span class="ty">number</span>
  created_at: <span class="ty">string</span>   <span class="cm">// fecha ISO: "2026-04-11T10:30:00Z"</span>
  is_deleted: <span class="ty">boolean</span>
}</pre>

  <div class="concept">
    <p><code>string | null</code> significa "puede ser texto O puede ser nulo". El <code>|</code> funciona como un "o". TypeScript te obliga a comprobar si el valor es null antes de usarlo, evitando el clásico "Cannot read property of null".</p>
  </div>

  <h2>Tipos de utilidad — transformar interfaces existentes</h2>
  <pre><span class="cm">// Partial&lt;T&gt; hace todos los campos opcionales</span>
<span class="kw">function</span> <span class="fn">updateUser</span>(partial: <span class="ty">Partial&lt;AuthUser&gt;</span>) {
  <span class="cm">// partial puede tener solo { avatar_url: "..." } sin necesitar todos los campos</span>
  setUser(prev => prev ? { ...prev, ...partial } : prev)
}</pre>

  <h2>El operador <code>as</code> — forzar un tipo</h2>
  <pre><span class="cm">// A veces TypeScript no sabe el tipo de algo que viene de fuera (ej: JSON de una API)</span>
<span class="kw">const</span> data = <span class="kw">await</span> res.<span class="fn">json</span>() <span class="kw">as</span> { accessToken: <span class="ty">string</span>; user: <span class="ty">AuthUser</span> }
<span class="cm">// Le estamos diciendo: "confía en mí, esto tiene esa forma"</span>
<span class="cm">// Úsalo con cuidado — si mientes, TypeScript no puede protegerte</span></pre>

  <h2>Genéricos — funciones que funcionan con cualquier tipo</h2>
  <pre><span class="cm">// La función query de lib/db.ts usa un genérico &lt;T&gt;</span>
<span class="kw">async function</span> <span class="fn">query</span>&lt;<span class="ty">T</span>&gt;(text: <span class="ty">string</span>, params?: <span class="ty">unknown[]</span>): <span class="ty">Promise&lt;QueryResult&lt;T&gt;&gt;</span>

<span class="cm">// Al usarla, dices qué tipo tendrán las filas devueltas:</span>
<span class="kw">const</span> result = <span class="kw">await</span> <span class="fn">query</span>&lt;{ id: <span class="ty">string</span>; username: <span class="ty">string</span> }&gt;(
  <span class="str">'SELECT id, username FROM users WHERE id = $1'</span>,
  [userId]
)
<span class="cm">// Ahora result.rows[0].username tiene autocompletado y verificación de tipo ✅</span></pre>

  <div class="tip">
    <p>Los tipos son documentación ejecutable. Cuando lees <code>role: 'admin' | 'moderator' | 'user' | 'guest'</code> entiendes todos los valores posibles sin leer ningún otro archivo.</p>
  </div>
</div>

<!-- ══════════════════ 03 · REACT HOOKS ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">3</div>
    <div><div class="section-title">React — Hooks en profundidad</div><div class="section-subtitle">useState, useEffect, useContext, useRef, useCallback</div></div>
  </div>

  <p>React es una librería para construir interfaces de usuario como si fueran piezas de LEGO. Cada pieza (componente) gestiona su propia información (estado) y reacciona a cambios automáticamente.</p>

  <h2>useState — la memoria de un componente</h2>
  <pre><span class="kw">const</span> [user, setUser] = <span class="fn">useState</span>&lt;<span class="ty">AuthUser | null</span>&gt;(<span class="kw">null</span>)
<span class="cm">//     ↑ valor actual   ↑ función para cambiarlo   ↑ valor inicial</span></pre>

  <div class="analogy">
    <p>Imagina una pizarra. <code>user</code> es lo que hay escrito en ella ahora mismo. <code>setUser</code> es el borrador+tiza — la única forma de cambiar lo que hay. Cada vez que llamas a <code>setUser</code>, React re-dibuja el componente con el nuevo valor automáticamente.</p>
  </div>

  <h2>useEffect — código que se ejecuta "después" de renderizar</h2>
  <pre><span class="cm">// Ejecutar UNA VEZ al montar el componente (array vacío [])</span>
<span class="fn">useEffect</span>(() => {
  <span class="fn">restoreSession</span>()
}, [])  <span class="cm">// ← dependencias: si está vacío, solo se ejecuta al montar</span>

<span class="cm">// Ejecutar cuando cambia accessToken o isLoading</span>
<span class="fn">useEffect</span>(() => {
  <span class="kw">if</span> (isLoading || !accessToken) <span class="kw">return</span>  <span class="cm">// guardia: salir si no está listo</span>
  <span class="fn">loadFriends</span>()
}, [accessToken, isLoading])  <span class="cm">// ← se re-ejecuta cuando alguno de estos cambia</span>

<span class="cm">// Ejecutar en intervalos + cleanup cuando el componente se desmonta</span>
<span class="fn">useEffect</span>(() => {
  <span class="kw">const</span> interval = <span class="fn">setInterval</span>(<span class="fn">checkUnread</span>, <span class="num">10000</span>)
  <span class="kw">return</span> () => <span class="fn">clearInterval</span>(interval)  <span class="cm">// ← IMPORTANTE: limpiar al desmontar</span>
}, [accessToken])</pre>

  <div class="warn">
    <p>El error más común con useEffect: olvidar incluir una variable en las dependencias. Si tu efecto usa <code>accessToken</code> pero no lo pones en el array <code>[]</code>, el efecto "verá" siempre el valor que tenía cuando se creó, no el actual. Esto causó el bug de la página de amigos que aparecía vacía.</p>
  </div>

  <h2>useRef — un valor que persiste sin causar re-render</h2>
  <pre><span class="kw">const</span> bottomRef = <span class="fn">useRef</span>&lt;<span class="ty">HTMLDivElement</span>&gt;(<span class="kw">null</span>)
<span class="kw">const</span> lastCreatedAt = <span class="fn">useRef</span>&lt;<span class="ty">string | null</span>&gt;(<span class="kw">null</span>)

<span class="cm">// Hacer scroll automático al último mensaje:</span>
bottomRef.current?.<span class="fn">scrollIntoView</span>({ behavior: <span class="str">'smooth'</span> })

<span class="cm">// Guardar el timestamp del último mensaje SIN re-renderizar:</span>
lastCreatedAt.current = messages[messages.length - <span class="num">1</span>].created_at</pre>

  <div class="concept">
    <p><code>useRef</code> vs <code>useState</code>: ambos persisten información entre renders, pero <strong>cambiar un ref NO redibuja el componente</strong>. Úsalo para valores que el código necesita recordar pero el usuario no necesita ver (timestamps, referencias a elementos del DOM, intervalos...).</p>
  </div>

  <h2>useCallback — evitar re-crear funciones innecesariamente</h2>
  <pre><span class="cm">// Sin useCallback: restoreSession se crea de nuevo en cada render</span>
<span class="cm">// Con useCallback: solo se crea una vez (o cuando cambian sus dependencias)</span>
<span class="kw">const</span> restoreSession = <span class="fn">useCallback</span>(<span class="kw">async</span> () => {
  <span class="kw">const</span> res = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'/api/auth/refresh'</span>, { method: <span class="str">'POST'</span> })
  <span class="cm">// ...</span>
}, [])  <span class="cm">// ← dependencias vacías: nunca se recrea</span>

<span class="cm">// Importante: useEffect que usa restoreSession puede listarla como dependencia segura</span>
<span class="fn">useEffect</span>(() => { <span class="fn">restoreSession</span>() }, [restoreSession])</pre>

  <h2>El ciclo de vida de un componente</h2>
  <div class="flow">
    <div class="step"><div class="step-n">1</div><div><strong>Montaje</strong> — el componente aparece en pantalla. Los <code>useEffect(fn, [])</code> se ejecutan.</div></div>
    <div class="step"><div class="step-n">2</div><div><strong>Actualización</strong> — alguien llama a <code>setState</code> o cambia un prop. React re-renderiza. Los <code>useEffect</code> con dependencias que cambiaron se vuelven a ejecutar.</div></div>
    <div class="step"><div class="step-n">3</div><div><strong>Desmontaje</strong> — el componente desaparece (ej: navegas a otra página). Se ejecutan las funciones <code>return () => ...</code> de los useEffect (cleanup).</div></div>
  </div>
</div>

<!-- ══════════════════ 04 · NEXT.JS ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">4</div>
    <div><div class="section-title">Next.js en detalle</div><div class="section-subtitle">Server Components, Client Components y API Routes</div></div>
  </div>

  <h2>Server Components vs Client Components</h2>
  <p>Esta es la decisión más importante en Next.js 15. Por defecto, <strong>todos los componentes son Server Components</strong>: se ejecutan en el servidor, generan HTML y lo envían al navegador. No tienen estado, no tienen eventos.</p>
  <p>Para hacer un componente interactivo, escribes <code>'use client'</code> en la primera línea:</p>

  <pre><span class="cm">// Server Component (sin 'use client') — se ejecuta en el servidor</span>
<span class="cm">// Puede hacer fetch directo a la BD, leer archivos, etc.</span>
<span class="kw">export default async function</span> <span class="fn">GamePage</span>({ params }) {
  <span class="kw">const</span> game = <span class="kw">await</span> <span class="fn">query</span>(<span class="str">'SELECT * FROM games WHERE slug = $1'</span>, [params.slug])
  <span class="kw">return</span> &lt;div&gt;{game.name}&lt;/div&gt;
}

<span class="cm">// Client Component (con 'use client') — se ejecuta en el navegador</span>
<span class="cm">// Puede usar useState, useEffect, onClick, etc.</span>
<span class="str">'use client'</span>
<span class="kw">export default function</span> <span class="fn">VoteButtons</span>() {
  <span class="kw">const</span> [votes, setVotes] = <span class="fn">useState</span>(<span class="num">0</span>)
  <span class="kw">return</span> &lt;button <span class="prop">onClick</span>={() => <span class="fn">setVotes</span>(v => v + <span class="num">1</span>)}&gt;{votes}&lt;/button&gt;
}</pre>

  <table>
    <tr><th></th><th>Server Component</th><th>Client Component</th></tr>
    <tr><td>Dónde se ejecuta</td><td>Servidor (Vercel)</td><td>Navegador del usuario</td></tr>
    <tr><td>Puede usar useState/useEffect</td><td>❌ No</td><td>✅ Sí</td></tr>
    <tr><td>Puede leer la BD directamente</td><td>✅ Sí</td><td>❌ No (solo vía API)</td></tr>
    <tr><td>El usuario puede ver el código</td><td>❌ No (solo el HTML)</td><td>⚠️ Sí (en el bundle JS)</td></tr>
    <tr><td>Marcador</td><td>Nada (por defecto)</td><td><code>'use client'</code> arriba del todo</td></tr>
  </table>

  <h2>API Routes — endpoints HTTP dentro del proyecto</h2>
  <p>Cualquier archivo <code>route.ts</code> dentro de <code>app/api/</code> es un endpoint HTTP. Exportas funciones con el nombre del método HTTP que quieres manejar:</p>

  <pre><span class="cm">// app/api/votes/route.ts</span>
<span class="kw">export async function</span> <span class="fn">POST</span>(request: <span class="ty">NextRequest</span>) {
  <span class="cm">// Maneja POST /api/votes</span>
  <span class="kw">const</span> body = <span class="kw">await</span> request.<span class="fn">json</span>()  <span class="cm">// leer el body de la petición</span>
  <span class="cm">// ... lógica ...</span>
  <span class="kw">return</span> <span class="ty">NextResponse</span>.<span class="fn">json</span>({ ok: <span class="kw">true</span> })  <span class="cm">// responder con JSON</span>
}

<span class="kw">export async function</span> <span class="fn">DELETE</span>(request: <span class="ty">NextRequest</span>) {
  <span class="cm">// Maneja DELETE /api/votes</span>
}</pre>

  <h2>Cómo el frontend llama a la API</h2>
  <pre><span class="cm">// Desde un Client Component, nunca puedes tocar la BD directamente</span>
<span class="cm">// Siempre hay que pasar por fetch() hacia tu propia API</span>
<span class="kw">const</span> res = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'/api/votes'</span>, {
  method: <span class="str">'POST'</span>,
  headers: {
    <span class="str">'Content-Type'</span>: <span class="str">'application/json'</span>,
    <span class="str">'Authorization'</span>: <span class="str">\`Bearer \${accessToken}\`</span>  <span class="cm">// token JWT en la cabecera</span>
  },
  body: <span class="ty">JSON</span>.<span class="fn">stringify</span>({ target_type: <span class="str">'post'</span>, target_id: id, value: <span class="num">1</span> })
})

<span class="kw">if</span> (!res.ok) {
  <span class="kw">const</span> err = <span class="kw">await</span> res.<span class="fn">json</span>()
  <span class="kw">throw new</span> <span class="ty">Error</span>(err.error.message)
}</pre>

  <h2>El layout.tsx — el envoltorio de toda la app</h2>
  <pre><span class="cm">// app/layout.tsx — se aplica a TODAS las páginas</span>
<span class="kw">export default function</span> <span class="fn">RootLayout</span>({ children }) {
  <span class="kw">return</span> (
    &lt;html lang=<span class="str">"es"</span>&gt;
      &lt;body&gt;
        &lt;<span class="ty">AuthProvider</span>&gt;      <span class="cm">← estado de sesión disponible en toda la app</span>
          &lt;<span class="ty">Navbar</span> /&gt;        <span class="cm">← se renderiza en todas las páginas</span>
          &lt;main&gt;{children}&lt;/main&gt;  <span class="cm">← aquí va cada página concreta</span>
          &lt;<span class="ty">Footer</span> /&gt;
          &lt;<span class="ty">ChatWidget</span> /&gt;    <span class="cm">← el chat flota encima de todo</span>
        &lt;/<span class="ty">AuthProvider</span>&gt;
      &lt;/body&gt;
    &lt;/html&gt;
  )
}</pre>

  <div class="tip">
    <p><code>children</code> en React es como un "hueco" donde se insertará el contenido. El layout dice "todo va entre el Navbar y el Footer" y cada página rellena ese hueco automáticamente.</p>
  </div>
</div>

<!-- ══════════════════ 05 · BASE DE DATOS ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">5</div>
    <div><div class="section-title">Base de datos PostgreSQL</div><div class="section-subtitle">SQL real, consultas parametrizadas, transacciones y vistas</div></div>
  </div>

  <h2>La capa de abstracción: lib/db.ts</h2>
  <p>Nunca se habla con la base de datos directamente en los componentes. Todo pasa por <span class="file">src/lib/db.ts</span>, que ofrece dos herramientas principales:</p>

  <pre><span class="cm">// 1. query() — para la mayoría de consultas</span>
<span class="kw">const</span> result = <span class="kw">await</span> <span class="fn">query</span>(
  <span class="str">'SELECT * FROM posts WHERE author_id = $1 AND is_deleted = FALSE'</span>,
  [userId]   <span class="cm">// ← los valores van separados del texto SQL (previene SQL injection)</span>
)
result.rows   <span class="cm">// ← array con las filas devueltas</span>
result.rowCount  <span class="cm">// ← cuántas filas se encontraron/afectaron</span>

<span class="cm">// 2. withTransaction() — cuando varias operaciones deben ocurrir juntas o fallar juntas</span>
<span class="kw">await</span> <span class="fn">withTransaction</span>(<span class="kw">async</span> (client) => {
  <span class="kw">await</span> client.<span class="fn">query</span>(<span class="str">'INSERT INTO posts ...'</span>)
  <span class="kw">await</span> client.<span class="fn">query</span>(<span class="str">'INSERT INTO post_steps ...'</span>)
  <span class="cm">// Si la segunda falla, la primera se deshace automáticamente (ROLLBACK)</span>
})</pre>

  <div class="concept">
    <p><strong>SQL injection</strong>: si construyes SQL con strings (<code>"WHERE id = " + userId</code>), un atacante puede poner <code>"1 OR 1=1"</code> como userId y obtener todos los registros. Los <strong>parámetros</strong> (<code>$1, $2...</code>) lo evitan porque la BD los trata siempre como datos, nunca como código SQL.</p>
  </div>

  <h2>El Pool de conexiones</h2>
  <pre><span class="kw">const</span> pool = <span class="kw">new</span> <span class="ty">Pool</span>({
  connectionString: process.env.DATABASE_URL,
  max: <span class="num">10</span>,  <span class="cm">// máximo 10 conexiones simultáneas abiertas</span>
  idleTimeoutMillis: <span class="num">30000</span>,  <span class="cm">// cerrar conexiones inactivas tras 30s</span>
})</pre>

  <div class="analogy">
    <p>Abrir una conexión a la BD es como llamar a un taxi. Si cada petición HTTP abriera y cerrara su propia conexión, sería como pedir un taxi nuevo cada vez que necesitas ir a la tienda. El <strong>Pool</strong> es como tener 10 taxis aparcados fuera — se reutilizan entre peticiones.</p>
  </div>

  <h2>El patrón de consultas en las API Routes</h2>
  <pre><span class="cm">// Patrón típico en cualquier route.ts:</span>

<span class="cm">// 1. Comprobar si el usuario existe y obtener sus datos</span>
<span class="kw">const</span> userResult = <span class="kw">await</span> <span class="fn">query</span>(
  <span class="str">'SELECT id, username, role FROM users WHERE id = $1'</span>,
  [userId]
)
<span class="kw">if</span> (userResult.rowCount === <span class="num">0</span>) <span class="kw">return</span> err(<span class="str">'NOT_FOUND'</span>, <span class="str">'Usuario no encontrado'</span>, <span class="num">404</span>)

<span class="cm">// 2. Insertar con RETURNING para obtener el registro creado</span>
<span class="kw">const</span> newPost = <span class="kw">await</span> <span class="fn">query</span>(
  <span class="str">'INSERT INTO posts (title, body, author_id) VALUES ($1, $2, $3) RETURNING *'</span>,
  [title, body, userId]
)
<span class="cm">// RETURNING * devuelve la fila insertada (con el id generado, created_at, etc.)</span>

<span class="cm">// 3. Upsert — insertar o actualizar si ya existe</span>
<span class="kw">await</span> <span class="fn">query</span>(
  <span class="str">\`INSERT INTO votes (user_id, target_id, value)
   VALUES ($1, $2, $3)
   ON CONFLICT (user_id, target_id)
   DO UPDATE SET value = EXCLUDED.value\`</span>,
  [userId, postId, value]
)</pre>

  <h2>Vistas SQL — consultas precalculadas</h2>
  <p>Una vista es como guardar una consulta SQL compleja con un nombre. La vista <code>post_scores</code> calcula el trending de cada post:</p>
  <pre><span class="cm">-- En la base de datos, esta vista existe permanentemente</span>
<span class="cm">CREATE VIEW post_scores AS</span>
<span class="cm">SELECT</span>
<span class="cm">  p.id, p.title, p.category,</span>
<span class="cm">  COUNT(CASE WHEN v.value = 1 THEN 1 END)  AS upvotes,</span>
<span class="cm">  COUNT(CASE WHEN v.value = -1 THEN 1 END) AS downvotes,</span>
<span class="cm">  -- Fórmula de trending: votos netos + bonus por recencia</span>
<span class="cm">  (upvotes - downvotes) + (recency_hours / decay_factor) AS trending_score</span>
<span class="cm">FROM posts p LEFT JOIN votes v ON v.target_id = p.id</span>
<span class="cm">GROUP BY p.id</span>

<span class="cm">-- En el código, se usa como si fuera una tabla normal:</span>
<span class="kw">SELECT</span> * <span class="kw">FROM</span> post_scores <span class="kw">ORDER BY</span> trending_score <span class="kw">DESC LIMIT</span> <span class="num">10</span></pre>

  <h2>JOINs — combinar varias tablas</h2>
  <pre><span class="cm">-- Obtener posts con datos del autor y del juego (3 tablas a la vez)</span>
<span class="kw">SELECT</span>
  p.id, p.title,
  u.username  <span class="cm">AS author_username</span>,
  u.avatar_url <span class="cm">AS author_avatar</span>,
  g.name      <span class="cm">AS game_name</span>
<span class="kw">FROM</span> posts p
<span class="kw">LEFT JOIN</span> users u <span class="kw">ON</span> u.id = p.author_id  <span class="cm">-- LEFT JOIN: incluir posts sin autor</span>
<span class="kw">LEFT JOIN</span> games g <span class="kw">ON</span> g.id = p.game_id    <span class="cm">-- LEFT JOIN: incluir posts sin juego</span>
<span class="kw">WHERE</span> p.is_deleted = <span class="kw">FALSE</span></pre>

  <div class="tip">
    <p><code>LEFT JOIN</code> incluye la fila aunque no haya coincidencia (devuelve null para los campos del lado derecho). <code>INNER JOIN</code> excluye filas sin coincidencia. Casi siempre se usa LEFT JOIN para no perder posts que no tienen autor o juego asociado.</p>
  </div>
</div>

<!-- ══════════════════ 06 · AUTH JWT ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">6</div>
    <div><div class="section-title">Autenticación — JWT, bcrypt y cookies</div><div class="section-subtitle">El sistema completo de principio a fin</div></div>
  </div>

  <h2>El problema a resolver</h2>
  <p>HTTP es <em>stateless</em>: el servidor no recuerda quién eres entre peticiones. Cada vez que el navegador hace una petición, el servidor no tiene idea de quién está del otro lado. La autenticación resuelve esto.</p>

  <h2>bcrypt — guardar contraseñas de forma segura</h2>
  <pre><span class="cm">// NUNCA se guarda la contraseña en texto plano en la BD</span>
<span class="cm">// bcrypt convierte "MiPassword1" en algo como "$2b$12$x3Kp9..."</span>
<span class="cm">// Este proceso es UNIDIRECCIONAL: no se puede revertir</span>

<span class="cm">// Al registrarse — hashear la contraseña antes de guardarla</span>
<span class="kw">const</span> hash = <span class="kw">await</span> bcrypt.<span class="fn">hash</span>(password, <span class="num">12</span>)
<span class="cm">// El 12 es el "cost factor": cuánto trabajo hace el algoritmo</span>
<span class="cm">// Más alto = más seguro, pero más lento (12 ≈ 300ms, perfecto)</span>

<span class="cm">// Al hacer login — comparar sin revelar el original</span>
<span class="kw">const</span> valid = <span class="kw">await</span> bcrypt.<span class="fn">compare</span>(<span class="str">"MiPassword1"</span>, hashGuardadoEnBD)
<span class="cm">// Devuelve true o false. Nunca "revierte" el hash.</span></pre>

  <div class="concept">
    <p>Si la BD fuera hackeada, el atacante solo vería hashes como <code>$2b$12$...</code>, no las contraseñas reales. Tampoco podría "revertirlos" — tendría que probar millones de combinaciones una por una (ataque de fuerza bruta), lo que con cost factor 12 llevaría siglos.</p>
  </div>

  <h2>JWT — el carnet de identidad digital</h2>
  <p>Un JWT (JSON Web Token) tiene tres partes separadas por puntos:</p>
  <pre><span class="cm">eyJhbGciOiJIUzI1NiJ9  ←  Header: "algoritmo HS256"</span>
<span class="cm">.</span>
<span class="cm">eyJzdWIiOiJ1c2VyLTEyMyIsInVzZXJuYW1lIjoiTmlrb2RlMTciLCJyb2xlIjoidXNlciJ9</span>
<span class="cm">                       ←  Payload (decodificado): { sub: "user-123", username: "Nikode17", role: "user", exp: 1713950400 }</span>
<span class="cm">.</span>
<span class="cm">SflKxwRJSMeKKF2QT4fw  ←  Firma: hash del header+payload con la clave secreta</span></pre>

  <div class="analogy">
    <p>Es como un DNI. Cualquiera puede leer los datos (nombre, rol) pero <strong>nadie puede falsificarlo</strong> sin conocer la clave secreta (<code>JWT_SECRET</code>), igual que un DNI no se puede falsificar sin el material especial del gobierno.</p>
  </div>

  <h2>Access Token vs Refresh Token — por qué dos tokens</h2>
  <table>
    <tr><th></th><th>Access Token</th><th>Refresh Token</th></tr>
    <tr><td>Duración</td><td>15 minutos</td><td>7 días</td></tr>
    <tr><td>Dónde vive</td><td>Memoria del navegador (estado React)</td><td>Cookie httpOnly (inaccessible a JS)</td></tr>
    <tr><td>Se envía en</td><td>Header <code>Authorization: Bearer ...</code></td><td>Cookie automática en <code>/api/auth</code></td></tr>
    <tr><td>Si lo roban</td><td>Expira en 15 min máximo</td><td>No pueden leerlo (httpOnly)</td></tr>
    <tr><td>Para qué sirve</td><td>Autenticar cada petición a la API</td><td>Obtener nuevos access tokens</td></tr>
  </table>

  <h2>Flujo completo de login</h2>
  <div class="flow">
    <div class="step"><div class="step-n">1</div><div>El usuario escribe email y contraseña. El frontend hace <code>POST /api/auth/login</code> con <code>{ email, password }</code>.</div></div>
    <div class="step"><div class="step-n">2</div><div>El servidor busca el usuario en la BD, compara la contraseña con bcrypt.</div></div>
    <div class="step"><div class="step-n">3</div><div>Si es correcta, genera un <strong>access token</strong> (15 min) y un <strong>refresh token</strong> (7 días).</div></div>
    <div class="step"><div class="step-n">4</div><div>El <strong>refresh token</strong> se envía en una cookie <code>httpOnly; SameSite=Strict; Path=/api/auth</code> — el navegador la guarda automáticamente, el JavaScript no puede leerla.</div></div>
    <div class="step"><div class="step-n">5</div><div>El <strong>access token</strong> se envía en el body JSON. React lo guarda en memoria (useState).</div></div>
    <div class="step"><div class="step-n">6</div><div>Cada petición autenticada lleva <code>Authorization: Bearer {accessToken}</code> en la cabecera.</div></div>
    <div class="step"><div class="step-n">7</div><div>Cuando el access token expira (15 min), el frontend llama a <code>POST /api/auth/refresh</code>. La cookie se envía automáticamente, el servidor valida y devuelve un nuevo access token.</div></div>
  </div>

  <h2>El código de generación de tokens</h2>
  <pre><span class="cm">// lib/auth.ts — signAccessToken()</span>
<span class="kw">return new</span> <span class="ty">SignJWT</span>({
  username: payload.username,
  role: payload.role,
})
  .<span class="fn">setProtectedHeader</span>({ alg: <span class="str">'HS256'</span> })  <span class="cm">← algoritmo de firma</span>
  .<span class="fn">setSubject</span>(payload.sub)              <span class="cm">← "sub" = user ID (estándar JWT)</span>
  .<span class="fn">setJti</span>(<span class="fn">crypto.randomUUID</span>())          <span class="cm">← ID único del token (para revocar si hace falta)</span>
  .<span class="fn">setIssuedAt</span>()                        <span class="cm">← fecha de creación</span>
  .<span class="fn">setExpirationTime</span>(<span class="str">'15m'</span>)             <span class="cm">← expira en 15 minutos</span>
  .<span class="fn">sign</span>(<span class="fn">getSecret</span>())                    <span class="cm">← firma con JWT_SECRET</span></pre>
</div>

<!-- ══════════════════ 07 · MIDDLEWARE ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">7</div>
    <div><div class="section-title">El Middleware</div><div class="section-subtitle">Cómo cada petición HTTP atraviesa la autenticación</div></div>
  </div>

  <p>El middleware es un código que se ejecuta <strong>antes</strong> de que cualquier petición llegue a su destino. Es como el portero de un club: revisa quién eres antes de dejarte pasar.</p>

  <h2>src/proxy.ts — el middleware de autenticación</h2>
  <pre><span class="kw">export async function</span> <span class="fn">proxy</span>(request: <span class="ty">NextRequest</span>) {
  <span class="kw">const</span> token = <span class="fn">extractBearerToken</span>(request)
  <span class="cm">// extractBearerToken() busca "Authorization: Bearer xxxx" en las cabeceras</span>
  <span class="cm">// Si no hay header o no tiene formato "Bearer ...", devuelve null</span>

  <span class="kw">if</span> (token) {
    <span class="kw">try</span> {
      <span class="kw">const</span> payload = <span class="kw">await</span> <span class="fn">verifyAccessToken</span>(token)
      <span class="cm">// Si el token es válido, inyecta los datos del usuario en los headers</span>
      requestHeaders.<span class="fn">set</span>(<span class="str">'x-user-id'</span>, payload.sub)
      requestHeaders.<span class="fn">set</span>(<span class="str">'x-user-role'</span>, payload.role)
      requestHeaders.<span class="fn">set</span>(<span class="str">'x-user-username'</span>, payload.username)
      <span class="kw">return</span> <span class="ty">NextResponse</span>.<span class="fn">next</span>({ request: { headers: requestHeaders } })
    } <span class="kw">catch</span> {
      <span class="cm">// Token inválido o expirado — continuar sin headers de usuario</span>
      <span class="cm">// La API Route decidirá si requiere auth o no</span>
    }
  }

  <span class="kw">return</span> <span class="ty">NextResponse</span>.<span class="fn">next</span>()  <span class="cm">// continuar sin modificar</span>
}</pre>

  <h2>Cómo las API Routes leen la identidad del usuario</h2>
  <pre><span class="cm">// En cualquier route.ts, leer los headers inyectados por el middleware:</span>
<span class="kw">function</span> <span class="fn">getRequestUser</span>(request: <span class="ty">NextRequest</span>) {
  <span class="kw">const</span> id = request.headers.<span class="fn">get</span>(<span class="str">'x-user-id'</span>)
  <span class="kw">const</span> role = request.headers.<span class="fn">get</span>(<span class="str">'x-user-role'</span>)
  <span class="kw">const</span> username = request.headers.<span class="fn">get</span>(<span class="str">'x-user-username'</span>)
  <span class="kw">if</span> (!id || !role || !username) <span class="kw">return null</span>  <span class="cm">// sin sesión</span>
  <span class="kw">return</span> { id, role, username }
}

<span class="kw">export async function</span> <span class="fn">POST</span>(request) {
  <span class="kw">const</span> user = <span class="fn">getRequestUser</span>(request)
  <span class="kw">if</span> (!user) <span class="kw">return</span> <span class="fn">err</span>(<span class="str">'UNAUTHORIZED'</span>, <span class="str">'No autenticado'</span>, <span class="num">401</span>)
  <span class="cm">// A partir de aquí, user.id, user.role, user.username son confiables</span>
}</pre>

  <div class="analogy">
    <p>El middleware verifica el DNI (JWT) una sola vez en la entrada. Luego le pone una pulsera con tu nombre y rol. Las APIs internas no tienen que volver a verificar el DNI — confían en la pulsera que puso el portero.</p>
  </div>

  <div class="concept">
    <p><strong>Por qué usar headers y no leer el token de nuevo en cada API Route</strong>: el middleware ya hizo el trabajo costoso de verificar la firma JWT. Si cada endpoint lo hiciera de nuevo, estaríamos ejecutando criptografía redundante en cada petición. Es más eficiente y más limpio delegar esa responsabilidad al middleware.</p>
  </div>
</div>

<!-- ══════════════════ 08 · ZOD ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">8</div>
    <div><div class="section-title">Validación con Zod</div><div class="section-subtitle">Nunca confiar en los datos que vienen de fuera</div></div>
  </div>

  <p>Zod es una librería que permite describir la forma que deben tener los datos y verificar que realmente tienen esa forma. Se usa en todos los endpoints de la API.</p>

  <h2>Por qué validar</h2>
  <pre><span class="cm">// Sin validación — peligroso</span>
<span class="kw">const</span> { email, password } = <span class="kw">await</span> request.<span class="fn">json</span>()
<span class="cm">// ¿Y si alguien envía { email: null, password: ["hack", "attempt"] }?</span>
<span class="cm">// La query SQL o el bcrypt podrían comportarse de forma inesperada</span>

<span class="cm">// Con Zod — seguro y con mensajes de error claros</span>
<span class="kw">const</span> parsed = <span class="ty">LoginSchema</span>.<span class="fn">safeParse</span>(body)
<span class="kw">if</span> (!parsed.success) {
  <span class="kw">return</span> <span class="fn">errorResponse</span>(<span class="str">'VALIDATION_ERROR'</span>, <span class="str">'Datos inválidos'</span>, <span class="num">400</span>)
}
<span class="kw">const</span> { email, password } = parsed.data  <span class="cm">// ← aquí SABEMOS que son strings válidos</span></pre>

  <h2>Definir un schema</h2>
  <pre><span class="cm">// lib/validation.ts</span>
<span class="kw">export const</span> RegisterSchema = z.<span class="fn">object</span>({
  username: z.<span class="fn">string</span>()
    .<span class="fn">min</span>(<span class="num">3</span>, <span class="str">'Al menos 3 caracteres'</span>)
    .<span class="fn">max</span>(<span class="num">50</span>, <span class="str">'Máximo 50 caracteres'</span>)
    .<span class="fn">regex</span>(<span class="str">/^[a-zA-Z0-9_-]+$/</span>, <span class="str">'Solo letras, números, - y _'</span>),
  email: z.<span class="fn">string</span>().<span class="fn">email</span>(<span class="str">'Email inválido'</span>),
  password: z.<span class="fn">string</span>()
    .<span class="fn">min</span>(<span class="num">8</span>)
    .<span class="fn">regex</span>(<span class="str">/[A-Z]/</span>, <span class="str">'Debe tener al menos una mayúscula'</span>)
    .<span class="fn">regex</span>(<span class="str">/[0-9]/</span>, <span class="str">'Debe tener al menos un número'</span>),
})

<span class="cm">// Extraer el tipo TypeScript automáticamente del schema</span>
<span class="kw">type</span> <span class="ty">RegisterInput</span> = z.<span class="fn">infer</span>&lt;<span class="kw">typeof</span> RegisterSchema&gt;
<span class="cm">// Equivale a: { username: string; email: string; password: string }</span></pre>

  <h2>safeParse vs parse</h2>
  <pre><span class="cm">// parse() lanza una excepción si falla (útil si el error es inesperado)</span>
<span class="kw">const</span> data = RegisterSchema.<span class="fn">parse</span>(body)  <span class="cm">// ← puede lanzar ZodError</span>

<span class="cm">// safeParse() devuelve { success: true, data } o { success: false, error }</span>
<span class="cm">// Mejor para APIs porque no interrumpe el flujo</span>
<span class="kw">const</span> result = RegisterSchema.<span class="fn">safeParse</span>(body)
<span class="kw">if</span> (!result.success) {
  <span class="cm">// result.error.errors → array de errores con campo y mensaje</span>
  <span class="kw">return</span> <span class="ty">NextResponse</span>.<span class="fn">json</span>({ error: <span class="fn">formatZodError</span>(result.error) }, { status: <span class="num">422</span> })
}</pre>

  <div class="tip">
    <p>Los schemas de Zod son la única fuente de verdad sobre qué datos acepta la API. Si mañana decides que el username debe tener mínimo 5 caracteres, solo cambias el schema y la regla se aplica automáticamente en todos los endpoints que lo usan.</p>
  </div>
</div>

<!-- ══════════════════ 09 · VOTOS Y TRENDING ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">9</div>
    <div><div class="section-title">Votos y algoritmo de Trending</div><div class="section-subtitle">Upsert, vistas SQL y fórmulas de ranking</div></div>
  </div>

  <h2>La tabla de votos — un único registro por usuario/post</h2>
  <pre><span class="cm">-- Estructura de la tabla votes en PostgreSQL:</span>
<span class="cm">CREATE TABLE votes (</span>
<span class="cm">  user_id     UUID NOT NULL,</span>
<span class="cm">  target_type TEXT NOT NULL,  -- 'post' o 'comment'</span>
<span class="cm">  target_id   UUID NOT NULL,</span>
<span class="cm">  value       SMALLINT NOT NULL,  -- 1 (upvote) o -1 (downvote)</span>
<span class="cm">  CONSTRAINT votes_pkey PRIMARY KEY (user_id, target_type, target_id)</span>
<span class="cm">  --  ↑ clave primaria compuesta: un usuario no puede votar dos veces lo mismo</span>
<span class="cm">)</span></pre>

  <h2>El patrón UPSERT — votar o cambiar el voto</h2>
  <pre><span class="cm">-- Si el usuario ya votó, actualiza el valor. Si no, inserta.</span>
<span class="cm">-- Esto maneja en una sola query: primer voto, cambiar de up a down, etc.</span>
<span class="kw">INSERT INTO</span> votes (user_id, target_type, target_id, value)
<span class="kw">VALUES</span> ($1, $2, $3, $4)
<span class="kw">ON CONFLICT</span> (user_id, target_type, target_id)
<span class="kw">DO UPDATE SET</span> value = EXCLUDED.value
<span class="cm">--               ↑ EXCLUDED = los valores que intentabas insertar</span></pre>

  <div class="analogy">
    <p>Es como un sistema de encuestas donde marcas "Sí" o "No" y puedes cambiar tu respuesta. La base de datos garantiza que solo hay UNA respuesta por persona — si ya habías marcado "Sí" y ahora marcas "No", actualiza la fila existente.</p>
  </div>

  <h2>La vista post_scores — calculando el trending</h2>
  <p>El trending no se calcula en el código JavaScript — se calcula directamente en la base de datos mediante una Vista SQL. Cada vez que se consulta <code>post_scores</code>, PostgreSQL ejecuta la fórmula al momento:</p>

  <pre><span class="cm">-- Simplificado — la fórmula real del trending:</span>
trending_score = (upvotes - downvotes)           <span class="cm">-- votos netos</span>
              + LOG(MAX(upvotes + downvotes, 1))  <span class="cm">-- bonus por volumen (logarítmico)</span>
              - (horas_desde_publicacion / 12)    <span class="cm">-- penalización por antigüedad</span></pre>

  <div class="concept">
    <p><strong>Por qué logarítmico</strong>: sin logaritmo, un post con 1000 votos dominaría siempre. Con <code>LOG()</code>, la diferencia entre 10 y 100 votos es grande, pero entre 1000 y 1100 es insignificante. Esto da oportunidades a posts nuevos con menos votos pero muy recientes.</p>
  </div>

  <h2>La API de trending</h2>
  <pre><span class="cm">// app/api/posts/trending/route.ts</span>
<span class="kw">const</span> result = <span class="kw">await</span> <span class="fn">query</span>(<span class="str">\`
  SELECT
    ps.id, ps.title, ps.trending_score,
    u.username  AS author_username,
    g.name      AS game_name,
    COUNT(DISTINCT c.id) AS comment_count
  FROM post_scores ps          -- ← la vista, no la tabla directamente
  LEFT JOIN users    u ON u.id = ps.author_id
  LEFT JOIN games    g ON g.id = ps.game_id
  LEFT JOIN comments c ON c.post_id = ps.id AND c.is_deleted = FALSE
  GROUP BY ps.id, ...          -- necesario cuando hay COUNT()
  ORDER BY ps.trending_score DESC
  LIMIT 10
\`</span>)</pre>

  <h2>VoteButtons — el componente de votación</h2>
  <pre><span class="cm">// Optimistic UI — actualiza visualmente antes de confirmar con el servidor</span>
<span class="kw">const</span> <span class="fn">handleVote</span> = <span class="kw">async</span> (value: <span class="num">1</span> | <span class="num">-1</span>) => {
  <span class="kw">const</span> newVote = userVote === value ? <span class="num">0</span> : value  <span class="cm">// toggle: votar lo mismo = quitar voto</span>

  <span class="cm">// 1. Actualizar la UI INMEDIATAMENTE (sin esperar al servidor)</span>
  <span class="fn">setLocalVotes</span>(prev => prev + (newVote - (userVote ?? <span class="num">0</span>)))
  <span class="fn">setUserVote</span>(newVote === <span class="num">0</span> ? <span class="kw">null</span> : newVote)

  <span class="cm">// 2. Enviar al servidor en segundo plano</span>
  <span class="kw">if</span> (newVote !== <span class="num">0</span>) {
    <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'/api/votes'</span>, { method: <span class="str">'POST'</span>, body: ... })
  } <span class="kw">else</span> {
    <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'/api/votes'</span>, { method: <span class="str">'DELETE'</span>, body: ... })
  }
}
<span class="cm">// Si el servidor falla, habría que revertir. Aquí se asume que no falla.</span></pre>
</div>

<!-- ══════════════════ 10 · CHAT Y POLLING ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">10</div>
    <div><div class="section-title">El Chat — Polling y estado en tiempo real</div><div class="section-subtitle">Sin WebSockets: cómo simular tiempo real con peticiones HTTP periódicas</div></div>
  </div>

  <p>El chat de Respawn no usa WebSockets (conexión permanente bidireccional). Usa <strong>polling</strong>: el navegador pregunta al servidor cada N segundos "¿hay mensajes nuevos?".</p>

  <div class="analogy">
    <p>WebSockets sería como una llamada telefónica — conexión permanente y bidireccional. Polling es como enviar SMS cada 3 segundos preguntando "¿tienes mensajes para mí?". Es menos eficiente pero mucho más simple de implementar y más que suficiente para una comunidad pequeña.</p>
  </div>

  <h2>Los tres intervalos del ChatWidget</h2>
  <pre><span class="cm">// 1. Contar mensajes no leídos — cada 10 segundos (badge del botón flotante)</span>
<span class="fn">useEffect</span>(() => {
  <span class="kw">const</span> check = () =>
    <span class="fn">fetch</span>(<span class="str">'/api/messages/unread'</span>, { headers: { Authorization: ... } })
      .<span class="fn">then</span>(r => r.<span class="fn">json</span>())
      .<span class="fn">then</span>(d => <span class="fn">setUnreadCount</span>(d.count))

  check()
  <span class="kw">const</span> interval = <span class="fn">setInterval</span>(check, <span class="num">10000</span>)
  <span class="kw">return</span> () => <span class="fn">clearInterval</span>(interval)  <span class="cm">// ← limpieza al desmontar</span>
}, [accessToken])

<span class="cm">// 2. Polling de mensajes activos — cada 3 segundos (dentro de un chat abierto)</span>
<span class="fn">useEffect</span>(() => {
  <span class="kw">if</span> (!activeChat || !accessToken) <span class="kw">return</span>

  <span class="kw">const</span> poll = () =>
    <span class="fn">fetch</span>(<span class="str">\`/api/messages/\${activeChat}?after=\${lastCreatedAt.current ?? ''}\`</span>, ...)
      .<span class="fn">then</span>(r => r.<span class="fn">json</span>())
      .<span class="fn">then</span>(d => {
        <span class="kw">if</span> (d.data?.length > <span class="num">0</span>) {
          <span class="fn">setMessages</span>(prev => {
            <span class="cm">// Deduplicar por ID — evitar mensajes duplicados si el timing es raro</span>
            <span class="kw">const</span> existingIds = <span class="kw">new</span> <span class="ty">Set</span>(prev.<span class="fn">map</span>(m => m.id))
            <span class="kw">const</span> newOnes = d.data.<span class="fn">filter</span>(m => !existingIds.<span class="fn">has</span>(m.id))
            <span class="kw">return</span> [...prev, ...newOnes]
          })
          lastCreatedAt.current = d.data.<span class="fn">at</span>(-<span class="num">1</span>).created_at  <span class="cm">// guardar timestamp</span>
        }
      })

  poll()
  <span class="kw">const</span> interval = <span class="fn">setInterval</span>(poll, <span class="num">3000</span>)
  <span class="kw">return</span> () => <span class="fn">clearInterval</span>(interval)
}, [activeChat, accessToken])</pre>

  <h2>Por qué el parámetro <code>after</code></h2>
  <p>Cada vez que el frontend pide mensajes, envía el timestamp del último mensaje que ya tiene. La API solo devuelve mensajes más nuevos que ese timestamp:</p>
  <pre><span class="cm">-- SQL en la API de mensajes</span>
<span class="kw">WHERE</span> created_at > $3  <span class="cm">-- $3 = el after timestamp</span>
<span class="kw">ORDER BY</span> created_at <span class="kw">ASC</span>
<span class="cm">-- Sin "after": se devuelven TODOS los mensajes cada 3 segundos (muy ineficiente)</span>
<span class="cm">-- Con "after": solo los nuevos (casi siempre 0 filas = respuesta instantánea)</span></pre>

  <h2>La máquina de estados del widget</h2>
  <pre><span class="kw">type</span> <span class="ty">View</span> = <span class="str">'closed'</span> | <span class="str">'convs'</span> | <span class="str">'chat'</span>
<span class="kw">const</span> [view, setView] = <span class="fn">useState</span>&lt;<span class="ty">View</span>&gt;(<span class="str">'closed'</span>)

<span class="cm">// 'closed' → botón flotante visible</span>
<span class="cm">// 'convs'  → lista de conversaciones</span>
<span class="cm">// 'chat'   → chat activo con alguien (activeChat = username)</span>

<span class="cm">// Transiciones:</span>
<span class="cm">// click botón flotante  → 'convs'</span>
<span class="cm">// click conversación   → 'chat' + setActiveChat(username)</span>
<span class="cm">// click ← atrás        → 'convs' + setActiveChat(null)</span>
<span class="cm">// click X cerrar       → 'closed'</span></pre>

  <div class="tip">
    <p>Modelar la UI como una <strong>máquina de estados</strong> con un tipo <code>View</code> evita estados imposibles. Si usaras tres booleanos (<code>isOpen</code>, <code>showConvs</code>, <code>showChat</code>), podrías llegar al estado <code>isOpen=false, showChat=true</code> que no tiene sentido visual. Con un tipo unión, solo existen los estados definidos.</p>
  </div>
</div>

<!-- ══════════════════ 11 · IMÁGENES ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">11</div>
    <div><div class="section-title">Gestión de Imágenes</div><div class="section-subtitle">Presigned URLs, Uploadthing y por qué no subir imágenes al servidor</div></div>
  </div>

  <h2>El problema de subir imágenes</h2>
  <p>Guardar imágenes directamente en el servidor donde corre Next.js es una mala idea porque:</p>
  <ul>
    <li>Los servidores de Vercel/Railway son efímeros — se reinician y pierden los archivos</li>
    <li>Las imágenes ocupan mucho espacio y memoria</li>
    <li>Entregar imágenes desde el mismo servidor que procesa la lógica de negocio es lento</li>
  </ul>

  <h2>La solución: almacenamiento externo (S3 / Uploadthing)</h2>
  <div class="analogy">
    <p>En vez de llevar el correo tú mismo, contratas a una empresa de mensajería (Uploadthing/S3). El cliente les habla directamente para dejar el paquete, y tú solo guardas la dirección donde quedó.</p>
  </div>

  <h2>Flujo de subida con Presigned URLs</h2>
  <div class="flow">
    <div class="step"><div class="step-n">1</div><div>El navegador pide al servidor <code>POST /api/media/presign</code>: "quiero subir un archivo PNG de 500KB".</div></div>
    <div class="step"><div class="step-n">2</div><div>El servidor genera una <strong>URL firmada temporalmente</strong> directamente contra S3/Uploadthing (válida 60 segundos).</div></div>
    <div class="step"><div class="step-n">3</div><div>El servidor devuelve esa URL al navegador. <strong>El archivo nunca pasa por el servidor</strong>.</div></div>
    <div class="step"><div class="step-n">4</div><div>El navegador sube el archivo directamente a S3 usando esa URL temporal.</div></div>
    <div class="step"><div class="step-n">5</div><div>S3 responde con la URL pública permanente del archivo (<code>https://cdn.uploadthing.com/...</code>).</div></div>
    <div class="step"><div class="step-n">6</div><div>El navegador envía esa URL a la API (<code>PATCH /api/users/me</code>) para guardarla en la BD.</div></div>
  </div>

  <h2>Uploadthing — la alternativa simplificada</h2>
  <pre><span class="cm">// app/api/uploadthing/core.ts — define qué tipos de archivos se aceptan</span>
<span class="kw">export const</span> ourFileRouter = {
  imageUploader: <span class="fn">f</span>({ image: { maxFileSize: <span class="str">'4MB'</span> } })
    .<span class="fn">middleware</span>(<span class="kw">async</span> ({ req }) => {
      <span class="cm">// Solo usuarios autenticados pueden subir imágenes</span>
      <span class="kw">const</span> user = <span class="fn">getUser</span>(req)
      <span class="kw">if</span> (!user) <span class="kw">throw new</span> <span class="ty">UploadThingError</span>(<span class="str">"No autenticado"</span>)
      <span class="kw">return</span> { userId: user.id }  <span class="cm">// metadata que llega al onUploadComplete</span>
    })
    .<span class="fn">onUploadComplete</span>(<span class="kw">async</span> ({ metadata, file }) => {
      <span class="cm">// Aquí podrías guardar la URL en la BD automáticamente</span>
      console.<span class="fn">log</span>(<span class="str">"Subido por"</span>, metadata.userId, <span class="str">"URL:"</span>, file.url)
    })
}</pre>
</div>

<!-- ══════════════════ 12 · RATE LIMITING ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">12</div>
    <div><div class="section-title">Rate Limiting</div><div class="section-subtitle">Ventanas deslizantes y la diferencia entre memoria e Redis</div></div>
  </div>

  <h2>Qué es el rate limiting</h2>
  <p>Limitar cuántas veces puede hacer algo un usuario en un período de tiempo. Sin esto, alguien podría intentar 10 millones de contraseñas por segundo contra el endpoint de login.</p>

  <table>
    <tr><th>Endpoint</th><th>Límite</th><th>Ventana</th></tr>
    <tr><td>POST /api/auth/login</td><td>10 intentos</td><td>15 minutos por IP</td></tr>
    <tr><td>POST /api/auth/register</td><td>5 cuentas</td><td>1 hora por IP</td></tr>
    <tr><td>POST /api/posts</td><td>10 posts</td><td>1 hora por usuario</td></tr>
    <tr><td>POST /api/votes</td><td>100 votos</td><td>1 hora por usuario</td></tr>
  </table>

  <h2>Sliding window — ventana deslizante</h2>
  <div class="analogy">
    <p>Una "ventana fija" reinicia en puntos exactos (ej: cada hora en punto). Alguien podría enviar 10 peticiones a las 12:59 y otras 10 a la 1:00 — 20 en 2 minutos. La "ventana deslizante" mira los últimos 60 minutos desde AHORA, sin importar reinicios de hora. Es más justa y difícil de explotar.</p>
  </div>

  <h2>La implementación dual: Redis o memoria</h2>
  <pre><span class="cm">// lib/ratelimit.ts — decide qué backend usar</span>
<span class="kw">async function</span> <span class="fn">checkLimit</span>(name, identifier, limit, windowSeconds) {
  <span class="kw">if</span> (<span class="fn">hasUpstash</span>()) {
    <span class="cm">// Producción: Upstash Redis (persistente, funciona con múltiples servidores)</span>
    <span class="kw">return</span> <span class="fn">upstashLimit</span>(name, identifier, limit, windowSeconds)
  }
  <span class="cm">// Desarrollo: Map en memoria (simple, no persiste entre reinicios)</span>
  <span class="kw">return</span> <span class="fn">memLimit</span>(\`\${name}:\${identifier}\`, limit, windowSeconds * <span class="num">1000</span>)
}</pre>

  <h2>El fallback en memoria</h2>
  <pre><span class="cm">// Un Map es como un diccionario: clave → valor</span>
<span class="kw">const</span> memStore = <span class="kw">new</span> <span class="ty">Map</span>&lt;<span class="ty">string</span>, { count: <span class="ty">number</span>; resetAt: <span class="ty">number</span> }&gt;()

<span class="kw">function</span> <span class="fn">memLimit</span>(key, limit, windowMs) {
  <span class="kw">const</span> now = Date.<span class="fn">now</span>()
  <span class="kw">const</span> entry = memStore.<span class="fn">get</span>(key)

  <span class="kw">if</span> (!entry || entry.resetAt < now) {
    <span class="cm">// Primera vez o ventana expirada: reiniciar contador</span>
    memStore.<span class="fn">set</span>(key, { count: <span class="num">1</span>, resetAt: now + windowMs })
    <span class="kw">return</span> { success: <span class="kw">true</span>, remaining: limit - <span class="num">1</span> }
  }

  <span class="kw">if</span> (entry.count >= limit) {
    <span class="kw">return</span> { success: <span class="kw">false</span>, remaining: <span class="num">0</span> }  <span class="cm">// ← bloqueado</span>
  }

  entry.count++  <span class="cm">// incrementar contador existente</span>
  <span class="kw">return</span> { success: <span class="kw">true</span>, remaining: limit - entry.count }
}

<span class="cm">// Limpiar entradas expiradas cada 60 segundos (evitar memoria infinita)</span>
<span class="fn">setInterval</span>(() => {
  <span class="kw">const</span> now = Date.<span class="fn">now</span>()
  <span class="kw">for</span> (<span class="kw">const</span> [k, v] <span class="kw">of</span> memStore)
    <span class="kw">if</span> (v.resetAt < now) memStore.<span class="fn">delete</span>(k)
}, <span class="num">60_000</span>)</pre>
</div>

<!-- ══════════════════ 13 · PATRONES RECURRENTES ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">13</div>
    <div><div class="section-title">Patrones de código que se repiten</div><div class="section-subtitle">Reconocer y entender los bloques de construcción del proyecto</div></div>
  </div>

  <p>Hay varios patrones que aparecen una y otra vez en el código. Una vez que los reconoces, leer código nuevo es mucho más rápido.</p>

  <h2>Patrón 1 — El guard clause ("salida temprana")</h2>
  <pre><span class="cm">// En vez de anidar todo en un if, se sale ANTES si no se cumple la condición</span>

<span class="cm">// ❌ Forma anidada (difícil de leer)</span>
<span class="kw">if</span> (user) {
  <span class="kw">if</span> (!user.is_banned) {
    <span class="kw">if</span> (hasPermission(user)) {
      <span class="cm">// ... lógica real aquí, muy indentada</span>
    }
  }
}

<span class="cm">// ✅ Forma con guard clauses (fácil de leer)</span>
<span class="kw">if</span> (!user) <span class="kw">return</span> err(<span class="str">'UNAUTHORIZED'</span>, <span class="str">'No autenticado'</span>, <span class="num">401</span>)
<span class="kw">if</span> (user.is_banned) <span class="kw">return</span> err(<span class="str">'FORBIDDEN'</span>, <span class="str">'Cuenta suspendida'</span>, <span class="num">403</span>)
<span class="kw">if</span> (!<span class="fn">hasPermission</span>(user)) <span class="kw">return</span> err(<span class="str">'FORBIDDEN'</span>, <span class="str">'Sin permisos'</span>, <span class="num">403</span>)

<span class="cm">// Aquí va la lógica real, sin indentación extra</span></pre>

  <h2>Patrón 2 — Respuesta de error estandarizada</h2>
  <pre><span class="cm">// Todas las APIs devuelven errores con la misma forma</span>
<span class="cm">// Esto facilita manejarlo en el frontend de forma consistente</span>
<span class="kw">function</span> <span class="fn">err</span>(code: <span class="ty">string</span>, message: <span class="ty">string</span>, status: <span class="ty">number</span>) {
  <span class="kw">return</span> <span class="ty">NextResponse</span>.<span class="fn">json</span>({
    error: { code, message }
    <span class="cm">// Siempre: { error: { code: "...", message: "..." } }</span>
  }, { status })
}

<span class="cm">// En el frontend, siempre puedes hacer:</span>
<span class="kw">const</span> data = <span class="kw">await</span> res.<span class="fn">json</span>()
<span class="kw">if</span> (!res.ok) <span class="kw">throw new</span> <span class="ty">Error</span>(data.error.message)</pre>

  <h2>Patrón 3 — Estado de carga (loading state)</h2>
  <pre><span class="kw">const</span> [data, setData] = <span class="fn">useState</span>(<span class="kw">null</span>)
<span class="kw">const</span> [loading, setLoading] = <span class="fn">useState</span>(<span class="kw">true</span>)   <span class="cm">// empieza cargando</span>
<span class="kw">const</span> [error, setError] = <span class="fn">useState</span>(<span class="kw">null</span>)

<span class="fn">useEffect</span>(() => {
  <span class="fn">fetch</span>(<span class="str">'/api/posts'</span>)
    .<span class="fn">then</span>(r => r.<span class="fn">json</span>())
    .<span class="fn">then</span>(d => <span class="fn">setData</span>(d))
    .<span class="kw">catch</span>(e => <span class="fn">setError</span>(e.message))
    .<span class="fn">finally</span>(() => <span class="fn">setLoading</span>(<span class="kw">false</span>))  <span class="cm">// pase lo que pase, deja de cargar</span>
}, [])

<span class="cm">// En el render:</span>
<span class="kw">if</span> (loading) <span class="kw">return</span> &lt;Spinner /&gt;
<span class="kw">if</span> (error) <span class="kw">return</span> &lt;ErrorMessage msg={error} /&gt;
<span class="kw">return</span> &lt;DataDisplay data={data} /&gt;</pre>

  <h2>Patrón 4 — Spread operator para actualizar objetos</h2>
  <pre><span class="cm">// En React, NUNCA mutamos el estado directamente</span>
<span class="cm">// Siempre creamos un objeto NUEVO con los campos actualizados</span>

<span class="cm">// ❌ Mal — mutación directa (React no detecta el cambio)</span>
user.avatar_url = newUrl
setUser(user)

<span class="cm">// ✅ Bien — spread crea un nuevo objeto con todos los campos anteriores</span>
<span class="cm">//          pero sobreescribe avatar_url con el nuevo valor</span>
setUser(prev => ({ ...prev, avatar_url: newUrl }))
<span class="cm">// { ...prev }  = copia todos los campos de prev</span>
<span class="cm">// avatar_url: newUrl  = sobreescribe este campo concreto</span>

<span class="cm">// La función updateUser() en AuthContext usa exactamente esto:</span>
<span class="kw">const</span> updateUser = (partial: <span class="ty">Partial&lt;AuthUser&gt;</span>) => {
  setUser(prev => prev ? { ...prev, ...partial } : prev)
}</pre>

  <h2>Patrón 5 — Variables de entorno</h2>
  <pre><span class="cm">// .env.local (NUNCA subir a Git — contiene secretos)</span>
<span class="cm">DATABASE_URL=postgresql://user:pass@host/db</span>
<span class="cm">JWT_SECRET=una-clave-muy-larga-y-aleatoria</span>
<span class="cm">UPLOADTHING_SECRET=sk_live_...</span>

<span class="cm">// En el código, se leen con process.env</span>
<span class="kw">const</span> secret = process.env.JWT_SECRET
<span class="kw">if</span> (!secret) <span class="kw">throw new</span> <span class="ty">Error</span>(<span class="str">'JWT_SECRET no configurada'</span>)

<span class="cm">// NEXT_PUBLIC_ hace que la variable esté disponible en el navegador</span>
<span class="cm">// Sin ese prefijo, solo es accesible en el servidor</span>
<span class="cm">NEXT_PUBLIC_API_URL=https://respawn.app</span>  <span class="cm">← visible en el bundle JS</span>
<span class="cm">JWT_SECRET=abc123</span>                          <span class="cm">← SOLO en el servidor</span></pre>
</div>

<!-- ══════════════════ 14 · ERRORES REALES ══════════════════ -->
<div class="page">
  <div class="section-header">
    <div class="section-num">14</div>
    <div><div class="section-title">Errores reales que pasaron — y qué enseñan</div><div class="section-subtitle">Los bugs más instructivos del desarrollo de Respawn</div></div>
  </div>

  <p>Los errores son la mejor forma de aprender. Estos son los bugs reales que ocurrieron durante el desarrollo de Respawn y la lección de programación que deja cada uno.</p>

  <h2>Error 1 — El avatar que no aparecía tras recargar</h2>
  <div class="box warn">
    <p><strong>Síntoma</strong>: El avatar del usuario no aparecía en el Navbar después de recargar la página, aunque sí aparecía tras hacer login.</p>
    <p><strong>Causa</strong>: El JWT (token) solo contiene <code>id</code>, <code>username</code> y <code>role</code>. Al recargar, <code>restoreSession()</code> decodificaba el JWT pero no tenía <code>avatar_url</code>. La función seteaba el usuario con <code>avatar_url: null</code> sin ir a buscarlo.</p>
    <p><strong>Fix</strong>: Después de restaurar la sesión con el JWT, hacer una segunda llamada a <code>/api/users/me</code> para obtener <code>avatar_url</code> y <code>email</code>:</p>
  </div>
  <pre><span class="cm">// Antes — solo decodificar el JWT (incompleto)</span>
setUser({ id: payload.sub, username: payload.username, role: payload.role, avatar_url: <span class="kw">null</span> })

<span class="cm">// Después — JWT para lo básico + fetch para lo que el JWT no lleva</span>
setUser({ id: payload.sub, username: payload.username, role: payload.role, avatar_url: <span class="kw">null</span> })
<span class="kw">const</span> profile = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'/api/users/me'</span>, { headers: { Authorization: <span class="str">\`Bearer \${token}\`</span> } })
<span class="fn">setUser</span>(prev => ({ ...prev, avatar_url: profile.avatar_url }))</pre>
  <p><strong>Lección</strong>: Los JWTs son pequeños a propósito. No incluyas en ellos todo lo que sabes del usuario — solo lo imprescindible para identificarle y autorizar. Para datos "frescos" como el avatar (que puede cambiar), siempre consulta la BD.</p>

  <hr class="divider"/>

  <h2>Error 2 — La foto de perfil cortada por el gradiente</h2>
  <div class="box warn">
    <p><strong>Síntoma</strong>: La foto de perfil del usuario quedaba tapada por el gradiente decorativo de la cabecera del perfil.</p>
    <p><strong>Causa</strong>: En CSS, <code>position: relative</code> en un elemento crea un nuevo "contexto de apilamiento". El div del gradiente tenía <code>position: relative</code>, lo que lo ponía por encima del div del avatar que era <code>position: static</code> (el orden por defecto).</p>
    <p><strong>Fix</strong>: Añadir <code>relative z-10</code> al div del avatar para que tenga mayor prioridad visual:</p>
  </div>
  <pre><span class="cm">// Antes — el avatar quedaba detrás del gradiente</span>
&lt;div className=<span class="str">"px-6 -mt-12 mb-4 flex items-end"</span>&gt;
  &lt;Avatar /&gt;
&lt;/div&gt;

<span class="cm">// Después — z-10 fuerza al avatar a estar por encima</span>
&lt;div className=<span class="str">"px-6 -mt-12 mb-4 flex items-end relative z-10"</span>&gt;
  &lt;Avatar /&gt;
&lt;/div&gt;</pre>
  <p><strong>Lección</strong>: El z-index solo funciona en elementos con <code>position</code> diferente de <code>static</code>. Si algo se tapa inesperadamente, lo primero es revisar los contextos de apilamiento.</p>

  <hr class="divider"/>

  <h2>Error 3 — La página de amigos aparecía vacía en navegación cliente</h2>
  <div class="box warn">
    <p><strong>Síntoma</strong>: Al navegar a /amigos haciendo clic en un enlace (sin recargar), la lista aparecía vacía. Recargando la página, aparecían los amigos correctamente.</p>
    <p><strong>Causa</strong>: El <code>useEffect</code> tenía solo <code>[accessToken]</code> como dependencia. Al navegar sin recargar, React restauraba la sesión de forma asíncrona. El efecto se disparaba con <code>accessToken = null</code> (auth aún cargando), la llamada a la API fallaba silenciosamente, y cuando el token llegaba, el efecto no se volvía a ejecutar porque <code>accessToken</code> no había cambiado de null a null.</p>
  </div>
  <pre><span class="cm">// Antes — se ejecutaba antes de que auth terminara de restaurar</span>
<span class="fn">useEffect</span>(() => {
  <span class="kw">if</span> (!accessToken) <span class="kw">return</span>
  <span class="fn">loadFriends</span>()
}, [accessToken])

<span class="cm">// Después — esperar a que isLoading sea false (auth completado)</span>
<span class="fn">useEffect</span>(() => {
  <span class="kw">if</span> (isLoading || !accessToken) <span class="kw">return</span>  <span class="cm">// ← añadir isLoading</span>
  <span class="fn">loadFriends</span>()
}, [accessToken, isLoading])  <span class="cm">// ← añadir isLoading a dependencias</span></pre>
  <p><strong>Lección</strong>: En React, el orden de inicialización importa. Siempre que hagas fetch que requiera autenticación, espera a que el contexto de auth haya terminado de cargar. El booleano <code>isLoading</code> de AuthContext existe exactamente para esto.</p>

  <hr class="divider"/>

  <h2>Error 4 — El desbordamiento horizontal por el efecto blur</h2>
  <div class="box warn">
    <p><strong>Síntoma</strong>: La página de perfil aparecía recortada a la derecha y la página tenía scroll horizontal inesperado.</p>
    <p><strong>Causa</strong>: El efecto <code>blur-3xl</code> de Tailwind aplica <code>filter: blur(64px)</code>. Los filtros CSS extienden su renderizado más allá de los bordes del elemento. <strong><code>overflow: hidden</code> NO recorta los efectos de filtro</strong> — solo el propio contenido del elemento.</p>
    <p><strong>Fix</strong>: Añadir <code>overflow-x-hidden</code> en el <code>body</code> y mover los elementos decorativos para que su blur no sobresalga del viewport.</p>
  </div>
  <p><strong>Lección</strong>: <code>overflow: hidden</code> no es una "burbuja de contención" universal. Los efectos visuales como <code>filter: blur</code>, <code>box-shadow</code> y <code>outline</code> pueden escapar. Para el overflow horizontal del body, añadir <code>overflow-x: hidden</code> en el elemento raíz.</p>

  <hr class="divider"/>

  <h2>Error 5 — La feature de presencia online que rompió todo</h2>
  <div class="box warn">
    <p><strong>Síntoma</strong>: Tras implementar el indicador de "usuario online" (punto verde), el chat desapareció y el perfil daba error 404.</p>
    <p><strong>Causa</strong>: Se añadió una columna <code>last_seen</code> a la tabla <code>users</code> y se actualizaron las queries SQL para seleccionarla. Pero las APIs existentes que construían el objeto User seguían sin incluirla, causando errores de TypeScript y SQL inesperados en cascada.</p>
    <p><strong>Fix</strong>: <code>git revert HEAD</code> — deshacer el último commit entero.</p>
  </div>
  <p><strong>Lección</strong>: Al añadir una columna a una tabla que ya existe en producción, hay que actualizar <em>todas</em> las queries que usan esa tabla — no solo las nuevas. Es mejor hacer un plan completo antes de ejecutar la migración. Y <code>git revert</code> es tu mejor amigo cuando algo complejo falla en producción: deshace los cambios sin borrar el historial.</p>
</div>

</body>
</html>`

async function generate() {
  console.log('[learning-guide] Iniciando generación del PDF...')

  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } catch {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    margin: { top: '12mm', bottom: '12mm', left: '0', right: '0' },
    printBackground: true,
  })

  await browser.close()
  console.log(`[learning-guide] ✅ PDF generado en: ${OUTPUT_PATH}`)
}

generate().catch(err => {
  console.error('[learning-guide] ❌ Error:', err.message)
  process.exit(1)
})
