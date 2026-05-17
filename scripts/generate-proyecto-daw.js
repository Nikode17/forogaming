#!/usr/bin/env node
// scripts/generate-proyecto-daw.js
// Genera proyecto-respawn-daw.pdf en el Escritorio

const puppeteer = require('puppeteer')
const path = require('path')
const os = require('os')

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUTPUT_PATH = path.join(os.homedir(), 'Desktop', 'proyecto-respawn-daw.pdf')

const STUDENT = '[Tu Nombre y Apellidos]'
const TEACHER = '[Nombre y Apellidos del Docente]'
const TITLE_SHORT = 'Respawn — Plataforma web de comunidad de videojuegos'

// ─── CSS base ────────────────────────────────────────────────────────────────
const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: Calibri, 'Segoe UI', sans-serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #000;
  background: #fff;
}

/* ── Portada ── */
.cover {
  width: 100%; min-height: 100vh;
  display: flex; flex-direction: column;
  page-break-after: always;
  position: relative;
}
.cover-top {
  flex: 1;
  padding: 28px 40px 20px 40px;
}
.ceac-logo {
  background: #003087; color: white;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 4px; margin-bottom: 60px;
}
.ceac-logo .ceac { font-size: 14pt; font-weight: 900; letter-spacing: 2px; }
.ceac-logo .contigo { font-size: 12pt; font-style: italic; color: #5ecce0; }
.cover-star { color: #20b2aa; font-size: 20pt; margin-right: 8px; }
.cover-title {
  font-size: 26pt; font-weight: 700; color: #1a1a2e;
  line-height: 1.2; margin-bottom: 8px; display: flex; align-items: flex-start;
}
.cover-subtitle { font-size: 12pt; color: #e91e8c; font-weight: 600; margin-bottom: 60px; letter-spacing: 0.5px; }
.cover-people { font-size: 11pt; color: #003087; line-height: 2.2; margin-bottom: 0; }
.cover-band {
  background: #003087; color: white;
  padding: 24px 40px; font-size: 11pt; line-height: 2;
}

/* ── Páginas ── */
.page {
  padding: 0 0 0 0;
  page-break-after: always;
}
.page:last-child { page-break-after: avoid; }
.page-inner { padding: 0 20px; }

/* ── Encabezado de página ── */
.page-header {
  border-bottom: 1px solid #ccc;
  padding: 6px 20px 4px 20px;
  font-size: 9pt; color: #444;
  display: flex; justify-content: space-between;
  margin-bottom: 20px;
}

/* ── Pie de página ── */
.page-footer {
  border-top: 1px solid #ccc;
  padding: 4px 20px 6px 20px;
  font-size: 9pt; color: #444;
  display: flex; justify-content: space-between;
  margin-top: 20px;
}

/* ── Tipografía ── */
h1 { font-size: 20pt; font-weight: 700; color: #003087; margin: 0 0 18px 0; }
h2 { font-size: 15pt; font-weight: 700; color: #003087; margin: 22px 0 10px 0; }
h3 { font-size: 12.5pt; font-weight: 700; color: #005599; margin: 16px 0 8px 0; }
h4 { font-size: 12pt; font-weight: 700; color: #333; margin: 12px 0 6px 0; }

p { text-align: justify; margin-bottom: 6pt; color: #000; }
ul, ol { padding-left: 22px; margin-bottom: 6pt; }
li { margin-bottom: 4px; text-align: justify; }

/* ── Índice ── */
.toc { margin: 0; }
.toc-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11.5pt; }
.toc-item .toc-dots { flex: 1; border-bottom: 1px dotted #999; margin: 0 6px 4px 6px; }
.toc-sub { padding-left: 20px; font-size: 11pt; }

/* ── Tablas ── */
.table-title { font-size: 12pt; font-weight: 700; margin-bottom: 2px; text-align: justify; }
.table-name  { font-size: 12pt; font-style: italic; margin-bottom: 6px; text-align: justify; }
.table-source { font-size: 9.5pt; text-align: center; margin-top: 4px; color: #444; }

table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 11pt; }
th { background: #003087; color: white; padding: 7px 10px; text-align: left; font-weight: 600; font-size: 11pt; }
td { padding: 6px 10px; border-bottom: 1px solid #ddd; vertical-align: top; }
tr:nth-child(even) td { background: #f4f6fb; }

/* ── Keywords ── */
.keywords { font-style: italic; margin-top: 10px; }
.keywords strong { font-style: normal; }

/* ── Nota figura ── */
.fig-label { font-size: 12pt; font-weight: 700; margin-top: 14px; margin-bottom: 2px; }
.fig-name   { font-size: 12pt; font-style: italic; margin-bottom: 8px; }
.fig-source { font-size: 9.5pt; text-align: center; margin-top: 4px; color: #444; }

/* ── Gantt ── */
.gantt-wrap { overflow-x: auto; margin: 8px 0; }
.gantt { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
.gantt th { background: #003087; color: white; text-align: center; padding: 5px 3px; font-weight: 600; border: 1px solid #fff; }
.gantt td { border: 1px solid #ccc; padding: 4px 5px; }
.gantt .task-name { font-weight: 500; background: #f4f6fb; white-space: nowrap; }
.gantt .g-on { background: #003087; }
.gantt .g-half { background: #5a85c4; }

/* ── SVG containers ── */
.svg-wrap { margin: 10px 0 4px 0; display: flex; justify-content: center; }
svg { max-width: 100%; }

/* ── Riesgos ── */
.r-alta   { background: #ffe5e5; color: #c00; font-weight: 700; }
.r-media  { background: #fff3cd; color: #856404; font-weight: 700; }
.r-baja   { background: #d4edda; color: #155724; font-weight: 700; }
`

// ─── Helper: page wrapper ────────────────────────────────────────────────────
const pg = (num, content) => `
<div class="page">
  <div class="page-header">
    <span>${STUDENT}</span>
    <span>${TITLE_SHORT}</span>
  </div>
  <div class="page-inner">${content}</div>
  <div class="page-footer">
    <span>ceacfp.com</span>
    <span>${num}</span>
  </div>
</div>`

// ─── PORTADA ─────────────────────────────────────────────────────────────────
const cover = `
<div class="cover">
  <div class="cover-top">
    <div class="ceac-logo">
      <span class="ceac">CEAC</span>
      <span class="contigo">contigo. CON TODO</span>
    </div>
    <div class="cover-title">
      <span class="cover-star">✦</span>
      Desarrollo de una plataforma web de comunidad de videojuegos mediante Next.js 15 y PostgreSQL
    </div>
    <div class="cover-subtitle">TRABAJO FINAL DEL MÓDULO DE PROYECTO.</div>
    <div class="cover-people">
      ${STUDENT}<br/>
      ${TEACHER}
    </div>
  </div>
  <div class="cover-band">
    CFGS de Desarrollo de aplicaciones web<br/>
    Curso 2025-2026
  </div>
</div>`

// ─── ABSTRACT ────────────────────────────────────────────────────────────────
const abstract = pg(1, `
<h1>Abstract</h1>
<p>
El presente trabajo documenta el análisis, diseño y desarrollo de Respawn, una plataforma web de comunidad
de videojuegos construida con tecnologías modernas del ecosistema JavaScript. El objetivo principal del
proyecto consiste en ofrecer a los aficionados a los videojuegos un espacio centralizado donde publicar
guías paso a paso, easter eggs, reviews y participar en discusiones temáticas mediante un sistema de posts
categorizado con votación y un algoritmo de trending basado en popularidad y recencia.
</p>
<p>
La metodología empleada ha sido de naturaleza iterativa e incremental, partiendo de un núcleo de
autenticación segura con JSON Web Tokens y bcrypt, y ampliando progresivamente las funcionalidades hasta
incorporar un sistema de mensajería directa entre usuarios, gestión de amistades, integración con la API
externa IGDB para datos reales de videojuegos, carga de imágenes mediante Uploadthing y un panel de
administración completo con moderación de contenido y gestión de usuarios.
</p>
<p>
Los resultados obtenidos comprenden una aplicación web full-stack desplegable en entornos cloud serverless,
con seguridad reforzada mediante cabeceras HTTP (CSP, HSTS, X-Frame-Options), rate limiting adaptativo y
validación estricta de datos de entrada con Zod. Se concluye que el stack Next.js 15 con App Router,
TypeScript y PostgreSQL serverless constituye una combinación técnicamente sólida y eficiente para el
desarrollo de plataformas de comunidad de mediana escala, permitiendo abordar frontend, backend y API en
un único framework cohesionado.
</p>
<p class="keywords"><strong>Keywords:</strong> web community platform, full-stack development, Next.js, gaming, PostgreSQL</p>
`)

// ─── ÍNDICE ──────────────────────────────────────────────────────────────────
const indice = pg(2, `
<h1>ÍNDICE</h1>
<div class="toc">
  <div class="toc-item"><span>1. INTRODUCCIÓN</span><div class="toc-dots"></div><span>3</span></div>
  <div class="toc-item toc-sub"><span>1.1 Motivaciones y contexto del proyecto</span><div class="toc-dots"></div><span>3</span></div>
  <div class="toc-item toc-sub"><span>1.2 Descripción del proyecto</span><div class="toc-dots"></div><span>4</span></div>
  <div class="toc-item toc-sub"><span>1.3 Objetivos</span><div class="toc-dots"></div><span>5</span></div>
  <div class="toc-item toc-sub"><span>1.4 Enfoque y metodología</span><div class="toc-dots"></div><span>6</span></div>
  <div class="toc-item toc-sub"><span>1.5 Análisis de riesgos</span><div class="toc-dots"></div><span>7</span></div>
  <div class="toc-item toc-sub"><span>1.6 Planificación temporal</span><div class="toc-dots"></div><span>8</span></div>
  <div class="toc-item" style="margin-top:8px"><span>2. ANÁLISIS DEL PROYECTO</span><div class="toc-dots"></div><span>9</span></div>
  <div class="toc-item toc-sub"><span>2.1 Requisitos funcionales</span><div class="toc-dots"></div><span>9</span></div>
  <div class="toc-item toc-sub"><span>2.2 Requisitos no funcionales</span><div class="toc-dots"></div><span>11</span></div>
  <div class="toc-item toc-sub"><span>2.3 Requisitos técnicos</span><div class="toc-dots"></div><span>12</span></div>
  <div class="toc-item toc-sub"><span>2.4 Casos de uso</span><div class="toc-dots"></div><span>13</span></div>
  <div class="toc-item" style="margin-top:8px"><span>3. DISEÑO</span><div class="toc-dots"></div><span>15</span></div>
  <div class="toc-item toc-sub"><span>3.1 Diagrama de clases</span><div class="toc-dots"></div><span>15</span></div>
  <div class="toc-item toc-sub"><span>3.2 Diagrama de secuencia</span><div class="toc-dots"></div><span>17</span></div>
  <div class="toc-item toc-sub"><span>3.3 Diagrama entidad–relación</span><div class="toc-dots"></div><span>19</span></div>
  <div class="toc-item toc-sub"><span>3.4 Diagrama relacional</span><div class="toc-dots"></div><span>21</span></div>
</div>
`)

// ─── INTRO 1.1 + 1.2 ─────────────────────────────────────────────────────────
const intro1 = pg(3, `
<h1>1. INTRODUCCIÓN</h1>
<p>
En este apartado se presentan las motivaciones que han llevado al desarrollo del proyecto, se describe
la plataforma resultante, se establecen los objetivos que se persiguen, se detalla el enfoque metodológico
adoptado, se identifican los principales riesgos y se expone la planificación temporal del trabajo.
</p>

<h2>1.1 Motivaciones y contexto del proyecto</h2>
<p>
El sector de los videojuegos representa en la actualidad una de las industrias culturales de mayor
crecimiento a nivel global. Según datos de la consultora Newzoo (2023), el mercado mundial de videojuegos
superó los 184.000 millones de dólares en ingresos, con una base de más de 3.200 millones de jugadores
activos. Esta realidad ha generado una demanda creciente de espacios digitales donde los aficionados
puedan compartir conocimiento especializado, estrategias, trucos y opiniones sobre los títulos que
consumen. Plataformas como Reddit, IGN o Fextralife aglutinan millones de usuarios en torno a este tipo
de contenido, lo que evidencia la viabilidad y relevancia social de los foros especializados en videojuegos.
</p>
<p>
Sin embargo, las plataformas generalistas presentan limitaciones relevantes para la comunidad hispanohablante:
interfaces saturadas de publicidad, algoritmos de descubrimiento de contenido opacos, barreras de entrada
elevadas para contribuir con contenido estructurado y, en muchos casos, una orientación exclusiva al público
angloparlante. Se detecta, en consecuencia, una oportunidad para el desarrollo de una plataforma propia,
orientada específicamente a la comunidad hispanohablante, que priorice la publicación de contenido de
calidad —guías paso a paso, easter eggs y reviews— frente al consumo pasivo de información.
</p>
<p>
El contexto tecnológico en el que se enmarca el proyecto resulta especialmente favorable. El ecosistema
JavaScript moderno, con Next.js a la cabeza, permite construir aplicaciones web completas —frontend y
backend— en un único framework, reduciendo la complejidad de despliegue y mantenimiento. La disponibilidad
de bases de datos PostgreSQL serverless como Neon, junto con servicios de almacenamiento de archivos como
Uploadthing, posibilita el desarrollo de plataformas de mediana escala sin infraestructura propia,
reduciendo significativamente los costes operativos iniciales. La combinación de estos factores constituye
la motivación fundamental para abordar el presente proyecto como trabajo final del Ciclo Formativo de
Grado Superior en Desarrollo de Aplicaciones Web.
</p>

<h2>1.2 Descripción del proyecto</h2>
<p>
Respawn es una plataforma web de comunidad de videojuegos que permite a los usuarios registrados publicar
y consumir contenido especializado organizado en cuatro categorías: guías paso a paso (<em>guides</em>),
easter eggs, reviews y contenido general. La plataforma integra un sistema de votación positiva y negativa
que alimenta un algoritmo de <em>trending</em>, lo que permite que el contenido más relevante y reciente
adquiera mayor visibilidad de forma automática sin intervención manual del equipo moderador.
</p>
<p>
Entre sus funcionalidades principales destacan la autenticación segura mediante tokens JWT de corta
duración (15 minutos) complementados con <em>refresh tokens</em> httpOnly de siete días, la gestión
completa de perfil de usuario con avatar y portada personalizables, un sistema de mensajería directa
entre usuarios con actualización periódica mediante <em>polling</em> HTTP, un módulo de amistades con
solicitudes y aceptaciones, y un panel de administración con capacidad de moderar posts, gestionar
usuarios y resolver reportes de contenido inapropiado. De forma adicional, la plataforma se integra con
la API externa IGDB (Internet Game Database) para asociar los posts publicados con datos reales de
videojuegos, incluyendo portadas, géneros y metadatos estructurados.
</p>
<p>
Desde el punto de vista técnico, Respawn se construye sobre Next.js 15 con App Router y TypeScript tanto
en el frontend como en el backend, PostgreSQL con Neon serverless como sistema de gestión de base de datos
relacional, y Tailwind CSS para el sistema de estilos visual. La seguridad se refuerza mediante cabeceras
HTTP configuradas en el nivel de infraestructura de Next.js, <em>rate limiting</em> adaptativo con
Upstash Redis y validación estricta de todos los datos de entrada con la librería Zod, siguiendo las
recomendaciones de seguridad del estándar OWASP para aplicaciones web.
</p>
`)

// ─── INTRO 1.3 + 1.4 ─────────────────────────────────────────────────────────
const intro2 = pg(4, `
<h2>1.3 Objetivos</h2>
<p>
A continuación se presentan los objetivos que se persiguen con el desarrollo del presente proyecto,
distinguiendo entre el objetivo general que define la finalidad global del trabajo y los objetivos
específicos que concretan las metas técnicas y funcionales a alcanzar.
</p>

<h3>1.3.1 Objetivo general</h3>
<p>
Desarrollar una plataforma web de comunidad de videojuegos funcional, segura y desplegable en entornos
<em>cloud</em>, que permita a los usuarios publicar, descubrir y valorar contenido especializado en
videojuegos, comunicarse entre sí y gestionar su perfil personal, empleando tecnologías modernas del
ecosistema JavaScript <em>full-stack</em>.
</p>

<h3>1.3.2 Objetivos específicos</h3>
<ol>
  <li>Implementar un sistema de autenticación seguro basado en JWT con <em>access tokens</em> de corta duración y <em>refresh tokens</em> almacenados en cookies httpOnly.</li>
  <li>Diseñar y desarrollar un esquema de base de datos relacional en PostgreSQL que soporte todas las entidades del dominio de la aplicación con integridad referencial.</li>
  <li>Crear un sistema de posts con comentarios anidados, soporte de categorías, votaciones y algoritmo de <em>trending</em> basado en votos netos y recencia.</li>
  <li>Integrar la API externa IGDB para la búsqueda y asociación de videojuegos reales con el contenido publicado por los usuarios.</li>
  <li>Implementar un sistema de mensajería directa entre usuarios con actualización periódica sin necesidad de WebSockets.</li>
  <li>Desarrollar un módulo de amistades con gestión de solicitudes, aceptación y listado de conexiones.</li>
  <li>Construir un panel de administración con funciones de moderación de contenido, gestión de usuarios y resolución de reportes.</li>
  <li>Aplicar medidas de seguridad web: cabeceras HTTP, <em>rate limiting</em>, validación de entrada y sanitización de contenido HTML enriquecido.</li>
  <li>Desplegar la aplicación en un entorno de producción <em>cloud</em> con HTTPS y configuración de seguridad adecuada.</li>
</ol>

<h2>1.4 Enfoque y metodología</h2>
<p>
El desarrollo de Respawn se ha abordado mediante una metodología iterativa e incremental, estructurada
en torno a ciclos semanales de desarrollo en los que se planifica, implementa y valida un conjunto
concreto de funcionalidades. Este enfoque permite gestionar la complejidad del proyecto de forma
progresiva, garantizando en todo momento un estado funcional de la aplicación e incorporando los ajustes
derivados de las pruebas realizadas en cada iteración antes de avanzar a la siguiente fase.
</p>
<p>
En lugar de adoptar un marco de trabajo ágil formal como Scrum o Kanban, se ha optado por una adaptación
pragmática orientada al trabajo individual. Cada iteración parte de la definición de un conjunto de
requisitos prioritarios, procede con su implementación completa —modelo de datos, API REST y componentes
de interfaz— y concluye con la validación funcional manual en entorno de desarrollo. Los errores
detectados en cada fase se documentan y resuelven dentro de la misma iteración antes de continuar.
</p>
<p>
En cuanto a las herramientas de desarrollo, se emplea Visual Studio Code como entorno de desarrollo
integrado, Git con repositorio remoto en GitHub para el control de versiones y el registro histórico del
proyecto, y scripts personalizados en Node.js para la generación automatizada de documentación y la
gestión de migraciones SQL versionadas. La base de datos se gestiona mediante un sistema de migraciones
secuenciales aplicadas a través de un <em>script</em> dedicado que registra las migraciones ejecutadas
en una tabla de control para garantizar la idempotencia del proceso de despliegue.
</p>
`)

// ─── INTRO 1.5 RIESGOS ───────────────────────────────────────────────────────
const intro3 = pg(5, `
<h2>1.5 Análisis de riesgos</h2>
<p>
En todo proyecto de desarrollo software resulta imprescindible identificar y valorar los riesgos que
pueden comprometer su ejecución o la calidad del resultado final. En la tabla siguiente se recogen los
principales riesgos identificados para el proyecto Respawn, evaluando su probabilidad de ocurrencia,
su impacto potencial y la estrategia de mitigación adoptada en cada caso.
</p>
<div class="table-title">Tabla 1</div>
<div class="table-name"><em>Análisis de riesgos del proyecto Respawn</em></div>
<table>
  <tr>
    <th>#</th><th>Riesgo</th><th>Probabilidad</th><th>Impacto</th><th>Estrategia de mitigación</th>
  </tr>
  <tr>
    <td>R01</td>
    <td>Cambios en la API de IGDB que rompan la integración</td>
    <td class="r-media">Media</td><td class="r-alta">Alto</td>
    <td>Encapsular toda la lógica de IGDB en <code>lib/igdb.ts</code>. Implementar fallback con datos locales si la API no responde.</td>
  </tr>
  <tr>
    <td>R02</td>
    <td>Desbordamiento del plan gratuito de Neon (BD) por exceso de conexiones</td>
    <td class="r-media">Media</td><td class="r-alta">Alto</td>
    <td>Uso de <em>connection pooling</em> con máximo de 10 conexiones simultáneas y cierre de conexiones inactivas.</td>
  </tr>
  <tr>
    <td>R03</td>
    <td>Vulnerabilidades de seguridad por validación insuficiente de datos de entrada</td>
    <td class="r-baja">Baja</td><td class="r-alta">Alto</td>
    <td>Validación con Zod en todos los endpoints. Uso de consultas parametrizadas. Sanitización HTML con DOMPurify.</td>
  </tr>
  <tr>
    <td>R04</td>
    <td>Pérdida de sesiones de usuario por expiración prematura del token</td>
    <td class="r-media">Media</td><td class="r-media">Medio</td>
    <td>Implementación de <em>refresh token</em> de 7 días con renovación automática transparente al usuario.</td>
  </tr>
  <tr>
    <td>R05</td>
    <td>Contenido inapropiado publicado por usuarios malintencionados</td>
    <td class="r-media">Media</td><td class="r-media">Medio</td>
    <td>Panel de administración con funciones de eliminación de posts y suspensión de cuentas. Sistema de reportes por usuarios.</td>
  </tr>
  <tr>
    <td>R06</td>
    <td>Desplazamiento del <em>scope</em> que comprometa los plazos de entrega</td>
    <td class="r-alta">Alta</td><td class="r-media">Medio</td>
    <td>Definición clara del MVP en las primeras iteraciones. Las funcionalidades secundarias se incorporan solo tras completar el núcleo.</td>
  </tr>
  <tr>
    <td>R07</td>
    <td>Incompatibilidades entre versiones de dependencias de Next.js 15</td>
    <td class="r-baja">Baja</td><td class="r-media">Medio</td>
    <td>Fijación de versiones exactas en <code>package.json</code>. Revisión del <em>changelog</em> antes de actualizar dependencias.</td>
  </tr>
  <tr>
    <td>R08</td>
    <td>Latencia elevada por consultas SQL no optimizadas</td>
    <td class="r-media">Media</td><td class="r-baja">Bajo</td>
    <td>Uso de índices en columnas de búsqueda frecuente. Vistas SQL precalculadas para el <em>trending</em>. Logging de tiempos de consulta en desarrollo.</td>
  </tr>
</table>
<div class="table-source">Fuente: elaboración propia.</div>
`)

// ─── INTRO 1.6 GANTT ─────────────────────────────────────────────────────────
const intro4 = pg(6, `
<h2>1.6 Planificación temporal</h2>
<p>
La planificación del proyecto se ha distribuido en ocho semanas de desarrollo activo, organizadas en
iteraciones temáticas. El diagrama de Gantt siguiente refleja la distribución temporal de las principales
tareas, desde el análisis inicial hasta el despliegue en producción y la elaboración de la documentación
final.
</p>
<div class="table-title">Figura 1</div>
<div class="table-name"><em>Diagrama de Gantt del proyecto Respawn</em></div>
<div class="gantt-wrap">
<table class="gantt">
  <tr>
    <th style="width:28%">Tarea</th>
    <th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th><th>S6</th><th>S7</th><th>S8</th>
  </tr>
  <tr>
    <td class="task-name">Análisis y diseño del sistema</td>
    <td class="g-on"></td><td class="g-on"></td><td></td><td></td><td></td><td></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Configuración del proyecto y BD</td>
    <td class="g-on"></td><td class="g-on"></td><td></td><td></td><td></td><td></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Sistema de autenticación (JWT)</td>
    <td></td><td class="g-on"></td><td class="g-on"></td><td></td><td></td><td></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Posts, comentarios y votos</td>
    <td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td><td></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Perfiles de usuario e imágenes</td>
    <td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td><td></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Integración IGDB y catálogo de juegos</td>
    <td></td><td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Mensajería directa (chat widget)</td>
    <td></td><td></td><td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Sistema de amistades</td>
    <td></td><td></td><td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Panel de administración</td>
    <td></td><td></td><td></td><td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Seguridad y cabeceras HTTP</td>
    <td></td><td></td><td></td><td></td><td></td><td class="g-on"></td><td class="g-on"></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Rediseño homepage y footer legal</td>
    <td></td><td></td><td></td><td></td><td></td><td></td><td class="g-on"></td><td></td>
  </tr>
  <tr>
    <td class="task-name">Despliegue en producción</td>
    <td></td><td></td><td></td><td></td><td></td><td></td><td class="g-on"></td><td class="g-on"></td>
  </tr>
  <tr>
    <td class="task-name">Elaboración de documentación</td>
    <td class="g-half"></td><td class="g-half"></td><td class="g-half"></td><td class="g-half"></td><td class="g-half"></td><td class="g-half"></td><td class="g-half"></td><td class="g-on"></td>
  </tr>
</table>
</div>
<div class="fig-source">Fuente: elaboración propia. Azul oscuro = tarea activa; azul claro = documentación paralela. S = semana.</div>
`)

// ─── ANÁLISIS 2.1 RF ─────────────────────────────────────────────────────────
const analisis1 = pg(7, `
<h1>2. ANÁLISIS DEL PROYECTO</h1>
<p>
En este apartado se recoge el análisis previo al desarrollo, incluyendo la especificación completa de
los requisitos del sistema —funcionales, no funcionales y técnicos— así como los casos de uso que
definen las interacciones posibles entre los actores del sistema y la plataforma Respawn.
</p>

<h2>2.1 Requisitos funcionales</h2>
<p>
Los requisitos funcionales describen las capacidades que el sistema debe proporcionar a sus usuarios.
Se han identificado dieciséis requisitos funcionales agrupados según las principales áreas de
funcionalidad de la plataforma.
</p>
<div class="table-title">Tabla 2</div>
<div class="table-name"><em>Requisitos funcionales del sistema Respawn</em></div>
<table>
  <tr><th>ID</th><th>Requisito funcional</th><th>Prioridad</th></tr>
  <tr><td>RF01</td><td>El sistema permitirá el registro de nuevos usuarios mediante nombre de usuario único, correo electrónico y contraseña con requisitos de complejidad.</td><td>Alta</td></tr>
  <tr><td>RF02</td><td>El sistema permitirá el inicio de sesión mediante correo electrónico y contraseña, generando tokens de acceso y refresco.</td><td>Alta</td></tr>
  <tr><td>RF03</td><td>El sistema gestionará sesiones mediante <em>access tokens</em> JWT de 15 minutos y <em>refresh tokens</em> de 7 días almacenados en cookies httpOnly.</td><td>Alta</td></tr>
  <tr><td>RF04</td><td>Los usuarios autenticados podrán crear posts en cuatro categorías: guías, easter eggs, reviews y contenido general.</td><td>Alta</td></tr>
  <tr><td>RF05</td><td>Los posts de tipo guía admitirán pasos numerados con título y contenido independiente para cada paso.</td><td>Alta</td></tr>
  <tr><td>RF06</td><td>El sistema permitirá la asociación de posts con videojuegos del catálogo integrado desde la API de IGDB.</td><td>Media</td></tr>
  <tr><td>RF07</td><td>Los usuarios podrán comentar los posts y responder a comentarios existentes, generando hilos anidados de hasta N niveles.</td><td>Alta</td></tr>
  <tr><td>RF08</td><td>El sistema permitirá votar positiva o negativamente tanto posts como comentarios, con un único voto por usuario y elemento.</td><td>Alta</td></tr>
  <tr><td>RF09</td><td>La plataforma calculará y mostrará un ranking de posts por popularidad (<em>trending</em>) basado en votos netos, volumen y recencia.</td><td>Alta</td></tr>
  <tr><td>RF10</td><td>Los usuarios registrados podrán enviar y recibir mensajes directos a otros usuarios mediante un widget de chat flotante.</td><td>Media</td></tr>
  <tr><td>RF11</td><td>El sistema permitirá enviar, aceptar y rechazar solicitudes de amistad entre usuarios registrados.</td><td>Media</td></tr>
  <tr><td>RF12</td><td>Los usuarios podrán personalizar su perfil con foto de avatar, imagen de portada y nombre de usuario visible.</td><td>Media</td></tr>
  <tr><td>RF13</td><td>Los administradores y moderadores podrán eliminar posts y comentarios, suspender cuentas de usuario y resolver reportes.</td><td>Alta</td></tr>
  <tr><td>RF14</td><td>Los usuarios podrán reportar posts y comentarios que infrinjan las normas de la comunidad.</td><td>Media</td></tr>
  <tr><td>RF15</td><td>La plataforma ofrecerá búsqueda de posts por texto y filtrado por categoría y videojuego.</td><td>Media</td></tr>
  <tr><td>RF16</td><td>Los usuarios podrán marcar posts como favoritos y acceder a su colección personal desde su perfil.</td><td>Baja</td></tr>
</table>
<div class="table-source">Fuente: elaboración propia.</div>
`)

// ─── ANÁLISIS 2.2 RNF + 2.3 RT ───────────────────────────────────────────────
const analisis2 = pg(8, `
<h2>2.2 Requisitos no funcionales</h2>
<p>
Los requisitos no funcionales establecen las restricciones y atributos de calidad que debe cumplir el
sistema con independencia de las funcionalidades que ofrece. Se agrupan en las categorías de seguridad,
rendimiento, usabilidad, mantenibilidad, disponibilidad y escalabilidad.
</p>
<div class="table-title">Tabla 3</div>
<div class="table-name"><em>Requisitos no funcionales del sistema Respawn</em></div>
<table>
  <tr><th>ID</th><th>Requisito no funcional</th><th>Categoría</th></tr>
  <tr><td>RNF01</td><td>Las contraseñas se almacenarán hasheadas con bcrypt empleando un <em>cost factor</em> mínimo de 12. Los tokens JWT se firmarán con HMAC-SHA256 y una clave secreta de longitud mínima de 32 caracteres.</td><td>Seguridad</td></tr>
  <tr><td>RNF02</td><td>La aplicación implementará las cabeceras de seguridad HTTP recomendadas por OWASP: Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy.</td><td>Seguridad</td></tr>
  <tr><td>RNF03</td><td>Se aplicará <em>rate limiting</em> en los endpoints críticos: 10 intentos de login por IP cada 15 minutos, 5 registros por IP por hora, 10 posts por usuario por hora y 100 votos por usuario por hora.</td><td>Seguridad</td></tr>
  <tr><td>RNF04</td><td>El tiempo de respuesta de la API para operaciones de lectura no superará los 500 ms en condiciones normales de carga con el plan de base de datos en uso.</td><td>Rendimiento</td></tr>
  <tr><td>RNF05</td><td>La interfaz será completamente responsiva y funcional en dispositivos móviles (pantallas ≥ 320 px de ancho) y de escritorio.</td><td>Usabilidad</td></tr>
  <tr><td>RNF06</td><td>El código estará tipado estrictamente con TypeScript sin uso de <code>any</code> implícito, organizado en módulos con responsabilidades claramente delimitadas.</td><td>Mantenibilidad</td></tr>
  <tr><td>RNF07</td><td>La aplicación se desplegará en una plataforma <em>cloud</em> serverless con disponibilidad mínima del 99 % y soporte nativo para Next.js.</td><td>Disponibilidad</td></tr>
  <tr><td>RNF08</td><td>El uso de <em>connection pooling</em> y arquitectura serverless permitirá escalar la aplicación ante aumentos de tráfico sin modificaciones en el código fuente.</td><td>Escalabilidad</td></tr>
</table>
<div class="table-source">Fuente: elaboración propia.</div>

<h2>2.3 Requisitos técnicos</h2>
<p>
Los requisitos técnicos especifican las tecnologías, librerías y servicios externos que deben emplearse
en el desarrollo e implantación del sistema, constituyendo las restricciones de implementación del proyecto.
</p>
<div class="table-title">Tabla 4</div>
<div class="table-name"><em>Requisitos técnicos del sistema Respawn</em></div>
<table>
  <tr><th>ID</th><th>Descripción</th><th>Tecnología / servicio</th></tr>
  <tr><td>RT01</td><td>Framework principal full-stack con App Router</td><td>Next.js 15 + TypeScript</td></tr>
  <tr><td>RT02</td><td>Sistema de gestión de base de datos relacional serverless</td><td>PostgreSQL — Neon (driver <code>pg</code>)</td></tr>
  <tr><td>RT03</td><td>Firma y verificación de tokens JWT</td><td>Librería <code>jose</code></td></tr>
  <tr><td>RT04</td><td>Hash y verificación de contraseñas</td><td>Librería <code>bcryptjs</code></td></tr>
  <tr><td>RT05</td><td>Validación de esquemas de datos de entrada</td><td>Librería <code>zod</code></td></tr>
  <tr><td>RT06</td><td>Sistema de estilos CSS utilitario</td><td>Tailwind CSS v4</td></tr>
  <tr><td>RT07</td><td>Almacenamiento y entrega de archivos de imagen</td><td>Uploadthing (S3-compatible)</td></tr>
  <tr><td>RT08</td><td><em>Rate limiting</em> distribuido con ventana deslizante</td><td>Upstash Redis + <code>@upstash/ratelimit</code></td></tr>
  <tr><td>RT09</td><td>Datos de videojuegos: portadas, géneros, metadatos</td><td>IGDB API (autenticación Twitch OAuth2)</td></tr>
  <tr><td>RT10</td><td>Plataforma de despliegue con soporte nativo Next.js</td><td>Vercel o Railway</td></tr>
  <tr><td>RT11</td><td>Control de versiones y repositorio remoto</td><td>Git + GitHub</td></tr>
</table>
<div class="table-source">Fuente: elaboración propia.</div>
`)

// ─── ANÁLISIS 2.4 CASOS DE USO ────────────────────────────────────────────────
const analisis3 = pg(9, `
<h2>2.4 Casos de uso</h2>
<p>
Se identifican tres actores principales en el sistema: el <strong>Usuario No Registrado</strong>
(invitado que puede navegar y consultar contenido público), el <strong>Usuario Registrado</strong>
(miembro activo con capacidad de publicar, votar e interactuar) y el <strong>Administrador</strong>
(con privilegios de moderación y gestión del sistema).
</p>

<div class="fig-label">Figura 2</div>
<div class="fig-name"><em>Diagrama de casos de uso del sistema Respawn</em></div>
<div class="svg-wrap">
<svg width="680" height="440" viewBox="0 0 680 440" xmlns="http://www.w3.org/2000/svg" font-family="Calibri,sans-serif" font-size="10">
  <!-- sistema boundary -->
  <rect x="140" y="10" width="400" height="420" rx="8" fill="none" stroke="#003087" stroke-width="2"/>
  <text x="340" y="28" text-anchor="middle" font-weight="700" fill="#003087" font-size="11">Sistema Respawn</text>

  <!-- actores -->
  <!-- Invitado -->
  <circle cx="60" cy="120" r="16" fill="none" stroke="#555" stroke-width="1.5"/>
  <line x1="60" y1="136" x2="60" y2="170" stroke="#555" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="80" y2="150" stroke="#555" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="40" y2="190" stroke="#555" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="80" y2="190" stroke="#555" stroke-width="1.5"/>
  <text x="60" y="205" text-anchor="middle" fill="#333">Usuario</text>
  <text x="60" y="217" text-anchor="middle" fill="#333">Invitado</text>

  <!-- Registrado -->
  <circle cx="60" cy="290" r="16" fill="none" stroke="#003087" stroke-width="1.5"/>
  <line x1="60" y1="306" x2="60" y2="340" stroke="#003087" stroke-width="1.5"/>
  <line x1="40" y1="320" x2="80" y2="320" stroke="#003087" stroke-width="1.5"/>
  <line x1="60" y1="340" x2="40" y2="360" stroke="#003087" stroke-width="1.5"/>
  <line x1="60" y1="340" x2="80" y2="360" stroke="#003087" stroke-width="1.5"/>
  <text x="60" y="375" text-anchor="middle" fill="#003087" font-weight="700">Usuario</text>
  <text x="60" y="387" text-anchor="middle" fill="#003087" font-weight="700">Registrado</text>

  <!-- Administrador -->
  <circle cx="620" cy="200" r="16" fill="none" stroke="#c00" stroke-width="1.5"/>
  <line x1="620" y1="216" x2="620" y2="250" stroke="#c00" stroke-width="1.5"/>
  <line x1="600" y1="230" x2="640" y2="230" stroke="#c00" stroke-width="1.5"/>
  <line x1="620" y1="250" x2="600" y2="270" stroke="#c00" stroke-width="1.5"/>
  <line x1="620" y1="250" x2="640" y2="270" stroke="#c00" stroke-width="1.5"/>
  <text x="620" y="285" text-anchor="middle" fill="#c00" font-weight="700">Administrador</text>

  <!-- Use cases col 1 -->
  <ellipse cx="260" cy="70" rx="85" ry="18" fill="#eef2ff" stroke="#003087" stroke-width="1"/>
  <text x="260" y="74" text-anchor="middle" fill="#003087">Consultar posts y juegos</text>

  <ellipse cx="260" cy="115" rx="85" ry="18" fill="#eef2ff" stroke="#003087" stroke-width="1"/>
  <text x="260" y="119" text-anchor="middle" fill="#003087">Buscar contenido</text>

  <ellipse cx="260" cy="160" rx="85" ry="18" fill="#eef2ff" stroke="#003087" stroke-width="1"/>
  <text x="260" y="164" text-anchor="middle" fill="#003087">Registrarse / iniciar sesión</text>

  <!-- Use cases col 2 -->
  <ellipse cx="460" cy="70" rx="85" ry="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1"/>
  <text x="460" y="74" text-anchor="middle" fill="#1d4ed8">Publicar post / guía</text>

  <ellipse cx="460" cy="115" rx="85" ry="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1"/>
  <text x="460" y="119" text-anchor="middle" fill="#1d4ed8">Comentar y votar</text>

  <ellipse cx="460" cy="160" rx="85" ry="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1"/>
  <text x="460" y="164" text-anchor="middle" fill="#1d4ed8">Enviar mensajes directos</text>

  <ellipse cx="460" cy="205" rx="85" ry="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1"/>
  <text x="460" y="209" text-anchor="middle" fill="#1d4ed8">Gestionar amistades</text>

  <ellipse cx="460" cy="250" rx="85" ry="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1"/>
  <text x="460" y="254" text-anchor="middle" fill="#1d4ed8">Editar perfil y avatar</text>

  <ellipse cx="460" cy="295" rx="85" ry="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1"/>
  <text x="460" y="299" text-anchor="middle" fill="#1d4ed8">Reportar contenido</text>

  <!-- Admin use cases -->
  <ellipse cx="460" cy="340" rx="85" ry="18" fill="#fee2e2" stroke="#c00" stroke-width="1"/>
  <text x="460" y="344" text-anchor="middle" fill="#c00">Moderar posts/usuarios</text>

  <ellipse cx="460" cy="385" rx="85" ry="18" fill="#fee2e2" stroke="#c00" stroke-width="1"/>
  <text x="460" y="389" text-anchor="middle" fill="#c00">Gestionar reportes</text>

  <!-- Lines from Invitado -->
  <line x1="76" y1="110" x2="175" y2="73" stroke="#555" stroke-width="1"/>
  <line x1="76" y1="116" x2="175" y2="116" stroke="#555" stroke-width="1"/>
  <line x1="76" y1="122" x2="175" y2="157" stroke="#555" stroke-width="1"/>

  <!-- Lines from Registrado -->
  <line x1="76" y1="285" x2="175" y2="73" stroke="#003087" stroke-width="1" stroke-dasharray="4,2"/>
  <line x1="76" y1="287" x2="375" y2="73" stroke="#003087" stroke-width="1"/>
  <line x1="76" y1="291" x2="375" y2="116" stroke="#003087" stroke-width="1"/>
  <line x1="76" y1="295" x2="375" y2="160" stroke="#003087" stroke-width="1"/>
  <line x1="76" y1="299" x2="375" y2="205" stroke="#003087" stroke-width="1"/>
  <line x1="76" y1="303" x2="375" y2="250" stroke="#003087" stroke-width="1"/>
  <line x1="76" y1="307" x2="375" y2="295" stroke="#003087" stroke-width="1"/>

  <!-- Lines from Admin -->
  <line x1="604" y1="195" x2="545" y2="342" stroke="#c00" stroke-width="1"/>
  <line x1="607" y1="200" x2="545" y2="386" stroke="#c00" stroke-width="1"/>
  <line x1="604" y1="208" x2="545" y2="250" stroke="#c00" stroke-width="1" stroke-dasharray="4,2"/>
</svg>
</div>
<div class="fig-source">Fuente: elaboración propia. Las líneas discontinuas representan herencia de casos de uso del actor invitado.</div>
`)

// ─── ANÁLISIS: descripción CU ─────────────────────────────────────────────────
const analisis4 = pg(10, `
<p>A continuación se describen los casos de uso más relevantes del sistema:</p>
<div class="table-title">Tabla 5</div>
<div class="table-name"><em>Descripción de los casos de uso principales</em></div>
<table>
  <tr><th>CU</th><th>Nombre</th><th>Actor</th><th>Descripción</th><th>Precondición</th></tr>
  <tr><td>CU01</td><td>Registrarse</td><td>Invitado</td><td>El usuario introduce nombre de usuario, correo y contraseña. El sistema valida los datos, verifica que el correo no esté registrado y crea la cuenta.</td><td>El usuario no tiene cuenta activa.</td></tr>
  <tr><td>CU02</td><td>Iniciar sesión</td><td>Invitado</td><td>El usuario introduce correo y contraseña. El sistema verifica las credenciales con bcrypt y emite access token y refresh token.</td><td>El usuario tiene una cuenta activa y no está suspendido.</td></tr>
  <tr><td>CU03</td><td>Publicar post</td><td>Registrado</td><td>El usuario completa el formulario de publicación seleccionando categoría, título, contenido y opcionalmente un videojuego. El sistema valida y almacena el post.</td><td>El usuario está autenticado. No ha superado el límite de 10 posts/hora.</td></tr>
  <tr><td>CU04</td><td>Votar post/comentario</td><td>Registrado</td><td>El usuario pulsa el botón de voto positivo o negativo. El sistema registra el voto o lo actualiza si ya existía, actualizando la puntuación del elemento.</td><td>El usuario está autenticado. No ha superado el límite de 100 votos/hora.</td></tr>
  <tr><td>CU05</td><td>Enviar mensaje directo</td><td>Registrado</td><td>El usuario abre el chat flotante, selecciona un destinatario y escribe el mensaje. El sistema almacena el mensaje y lo hace visible al destinatario en su próxima consulta periódica.</td><td>Ambos usuarios están registrados.</td></tr>
  <tr><td>CU06</td><td>Gestionar amistad</td><td>Registrado</td><td>El usuario envía una solicitud de amistad a otro usuario. El destinatario puede aceptarla o rechazarla desde su panel de amistades pendientes.</td><td>Los usuarios no son ya amigos. No existe solicitud previa pendiente.</td></tr>
  <tr><td>CU07</td><td>Moderar contenido</td><td>Administrador</td><td>El administrador accede al panel de administración, visualiza los posts o comentarios reportados y puede eliminarlos o desestimar el reporte. Puede también suspender la cuenta del autor.</td><td>El usuario tiene rol <em>admin</em> o <em>moderator</em>.</td></tr>
  <tr><td>CU08</td><td>Reportar contenido</td><td>Registrado</td><td>El usuario selecciona un motivo de reporte en un post o comentario. El sistema almacena el reporte y lo hace visible en el panel de administración.</td><td>El usuario está autenticado. El contenido existe y no ha sido eliminado.</td></tr>
</table>
<div class="table-source">Fuente: elaboración propia.</div>
`)

// ─── DISEÑO 3.1 CLASES ───────────────────────────────────────────────────────
const diseno1 = pg(11, `
<h1>3. DISEÑO</h1>
<p>
En este apartado se presentan los principales artefactos de diseño elaborados para el sistema Respawn,
incluyendo el diagrama de clases que refleja las principales entidades del dominio representadas mediante
las interfaces TypeScript, el diagrama de secuencia del flujo de autenticación, el diagrama
entidad–relación del modelo de datos y el diagrama relacional que especifica la estructura física de la
base de datos.
</p>

<h2>3.1 Diagrama de clases</h2>
<p>
Dado que la arquitectura de Respawn no emplea clases orientadas a objetos en el sentido estricto, sino
interfaces y tipos de TypeScript combinados con funciones modulares, el diagrama de clases representa
las principales entidades del dominio modeladas como tipos estructurados, mostrando sus atributos y las
relaciones de asociación existentes entre ellas.
</p>
<div class="fig-label">Figura 3</div>
<div class="fig-name"><em>Diagrama de clases del dominio de Respawn (interfaces TypeScript)</em></div>
<div class="svg-wrap">
<svg width="660" height="500" viewBox="0 0 660 500" xmlns="http://www.w3.org/2000/svg" font-family="Calibri,sans-serif" font-size="9.5">

  <!-- USER -->
  <rect x="10" y="10" width="140" height="140" rx="3" fill="#eef2ff" stroke="#003087" stroke-width="1.5"/>
  <rect x="10" y="10" width="140" height="22" rx="3" fill="#003087"/>
  <text x="80" y="25" text-anchor="middle" fill="white" font-weight="700" font-size="10">User</text>
  <line x1="10" y1="32" x2="150" y2="32" stroke="#003087" stroke-width="1"/>
  <text x="16" y="47" fill="#222">+ id: string (UUID)</text>
  <text x="16" y="61" fill="#222">+ username: string</text>
  <text x="16" y="75" fill="#222">+ email: string</text>
  <text x="16" y="89" fill="#222">+ password_hash: string</text>
  <text x="16" y="103" fill="#222">+ role: UserRole</text>
  <text x="16" y="117" fill="#222">+ avatar_url: string | null</text>
  <text x="16" y="131" fill="#222">+ is_banned: boolean</text>
  <text x="16" y="145" fill="#222">+ created_at: Date</text>

  <!-- POST -->
  <rect x="220" y="10" width="155" height="170" rx="3" fill="#eef2ff" stroke="#003087" stroke-width="1.5"/>
  <rect x="220" y="10" width="155" height="22" rx="3" fill="#003087"/>
  <text x="297" y="25" text-anchor="middle" fill="white" font-weight="700" font-size="10">Post</text>
  <line x1="220" y1="32" x2="375" y2="32" stroke="#003087" stroke-width="1"/>
  <text x="226" y="47" fill="#222">+ id: string (UUID)</text>
  <text x="226" y="61" fill="#222">+ title: string</text>
  <text x="226" y="75" fill="#222">+ body: string</text>
  <text x="226" y="89" fill="#222">+ category: PostCategory</text>
  <text x="226" y="103" fill="#222">+ author_id: string</text>
  <text x="226" y="117" fill="#222">+ game_id: string | null</text>
  <text x="226" y="131" fill="#222">+ is_published: boolean</text>
  <text x="226" y="145" fill="#222">+ is_deleted: boolean</text>
  <text x="226" y="159" fill="#222">+ created_at: Date</text>
  <text x="226" y="173" fill="#888" font-style="italic">«steps, media, votes»</text>

  <!-- COMMENT -->
  <rect x="450" y="10" width="155" height="140" rx="3" fill="#eef2ff" stroke="#003087" stroke-width="1.5"/>
  <rect x="450" y="10" width="155" height="22" rx="3" fill="#003087"/>
  <text x="527" y="25" text-anchor="middle" fill="white" font-weight="700" font-size="10">Comment</text>
  <line x1="450" y1="32" x2="605" y2="32" stroke="#003087" stroke-width="1"/>
  <text x="456" y="47" fill="#222">+ id: string (UUID)</text>
  <text x="456" y="61" fill="#222">+ post_id: string</text>
  <text x="456" y="75" fill="#222">+ author_id: string</text>
  <text x="456" y="89" fill="#222">+ body: string</text>
  <text x="456" y="103" fill="#222">+ parent_id: string | null</text>
  <text x="456" y="117" fill="#222">+ is_deleted: boolean</text>
  <text x="456" y="131" fill="#222">+ created_at: Date</text>

  <!-- GAME -->
  <rect x="10" y="195" width="140" height="110" rx="3" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <rect x="10" y="195" width="140" height="22" rx="3" fill="#16a34a"/>
  <text x="80" y="210" text-anchor="middle" fill="white" font-weight="700" font-size="10">Game</text>
  <line x1="10" y1="217" x2="150" y2="217" stroke="#16a34a" stroke-width="1"/>
  <text x="16" y="232" fill="#222">+ id: string (UUID)</text>
  <text x="16" y="246" fill="#222">+ name: string</text>
  <text x="16" y="260" fill="#222">+ slug: string</text>
  <text x="16" y="274" fill="#222">+ cover_url: string | null</text>
  <text x="16" y="288" fill="#222">+ igdb_id: number | null</text>
  <text x="16" y="302" fill="#222">+ post_count: number</text>

  <!-- VOTE -->
  <rect x="220" y="220" width="155" height="100" rx="3" fill="#fff7ed" stroke="#ea580c" stroke-width="1.5"/>
  <rect x="220" y="220" width="155" height="22" rx="3" fill="#ea580c"/>
  <text x="297" y="235" text-anchor="middle" fill="white" font-weight="700" font-size="10">Vote</text>
  <line x1="220" y1="242" x2="375" y2="242" stroke="#ea580c" stroke-width="1"/>
  <text x="226" y="257" fill="#222">+ user_id: string</text>
  <text x="226" y="271" fill="#222">+ target_type: 'post'|'comment'</text>
  <text x="226" y="285" fill="#222">+ target_id: string</text>
  <text x="226" y="299" fill="#222">+ value: 1 | -1</text>
  <text x="226" y="313" fill="#888" font-style="italic">«PK compuesta»</text>

  <!-- MESSAGE -->
  <rect x="450" y="195" width="155" height="110" rx="3" fill="#fdf4ff" stroke="#9333ea" stroke-width="1.5"/>
  <rect x="450" y="195" width="155" height="22" rx="3" fill="#9333ea"/>
  <text x="527" y="210" text-anchor="middle" fill="white" font-weight="700" font-size="10">Message</text>
  <line x1="450" y1="217" x2="605" y2="217" stroke="#9333ea" stroke-width="1"/>
  <text x="456" y="232" fill="#222">+ id: string (UUID)</text>
  <text x="456" y="246" fill="#222">+ sender_id: string</text>
  <text x="456" y="260" fill="#222">+ recipient_id: string</text>
  <text x="456" y="274" fill="#222">+ body: string</text>
  <text x="456" y="288" fill="#222">+ created_at: Date</text>
  <text x="456" y="302" fill="#222">+ read_at: Date | null</text>

  <!-- FRIENDSHIP -->
  <rect x="220" y="360" width="155" height="110" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <rect x="220" y="360" width="155" height="22" rx="3" fill="#d97706"/>
  <text x="297" y="375" text-anchor="middle" fill="white" font-weight="700" font-size="10">Friendship</text>
  <line x1="220" y1="382" x2="375" y2="382" stroke="#d97706" stroke-width="1"/>
  <text x="226" y="397" fill="#222">+ id: string (UUID)</text>
  <text x="226" y="411" fill="#222">+ user_id_1: string</text>
  <text x="226" y="425" fill="#222">+ user_id_2: string</text>
  <text x="226" y="439" fill="#222">+ status: 'pending'|'accepted'</text>
  <text x="226" y="453" fill="#222">+ created_at: Date</text>
  <text x="226" y="467" fill="#888" font-style="italic">«unique(user_id_1,user_id_2)»</text>

  <!-- RELATIONS -->
  <!-- User→Post (1..N) -->
  <line x1="150" y1="60" x2="220" y2="80" stroke="#003087" stroke-width="1.2" marker-end="url(#arr)"/>
  <text x="180" y="58" fill="#003087" font-size="9">1</text>
  <text x="212" y="90" fill="#003087" font-size="9">N</text>

  <!-- User→Comment (1..N) -->
  <line x1="150" y1="80" x2="450" y2="80" stroke="#003087" stroke-width="1" stroke-dasharray="5,3"/>
  <text x="440" y="75" fill="#003087" font-size="9">N</text>

  <!-- Post→Comment (1..N) -->
  <line x1="375" y1="90" x2="450" y2="70" stroke="#003087" stroke-width="1.2"/>
  <text x="380" y="82" fill="#003087" font-size="9">1</text>
  <text x="442" y="64" fill="#003087" font-size="9">N</text>

  <!-- Game→Post (1..N) -->
  <line x1="150" y1="240" x2="220" y2="130" stroke="#16a34a" stroke-width="1.2"/>
  <text x="155" y="228" fill="#16a34a" font-size="9">1</text>
  <text x="216" y="124" fill="#16a34a" font-size="9">N</text>

  <!-- Post→Vote -->
  <line x1="297" y1="180" x2="297" y2="220" stroke="#ea580c" stroke-width="1.2"/>
  <text x="300" y="215" fill="#ea580c" font-size="9">N</text>

  <!-- User→Friendship -->
  <line x1="80" y1="150" x2="220" y2="400" stroke="#d97706" stroke-width="1" stroke-dasharray="5,3"/>

  <!-- User→Message -->
  <line x1="150" y1="100" x2="450" y2="240" stroke="#9333ea" stroke-width="1" stroke-dasharray="5,3"/>

  <defs>
    <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <path d="M0,0 L0,6 L6,3 z" fill="#003087"/>
    </marker>
  </defs>
</svg>
</div>
<div class="fig-source">Fuente: elaboración propia. Líneas continuas = composición/asociación fuerte; discontinuas = referencia por clave foránea.</div>
`)

// ─── DISEÑO 3.2 SECUENCIA ─────────────────────────────────────────────────────
const diseno2 = pg(12, `
<h2>3.2 Diagrama de secuencia</h2>
<p>
Se presentan dos diagramas de secuencia que ilustran los flujos más críticos del sistema: el proceso
de autenticación mediante inicio de sesión y la creación de un nuevo post por parte de un usuario registrado.
</p>
<div class="fig-label">Figura 4</div>
<div class="fig-name"><em>Diagrama de secuencia — Flujo de inicio de sesión</em></div>
<div class="svg-wrap">
<svg width="640" height="360" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" font-family="Calibri,sans-serif" font-size="9.5">
  <!-- swimlanes headers -->
  <rect x="20" y="10" width="110" height="28" rx="3" fill="#003087"/><text x="75" y="28" text-anchor="middle" fill="white" font-weight="700">Navegador (React)</text>
  <rect x="190" y="10" width="110" height="28" rx="3" fill="#005599"/><text x="245" y="28" text-anchor="middle" fill="white" font-weight="700">Middleware</text>
  <rect x="360" y="10" width="110" height="28" rx="3" fill="#1d4ed8"/><text x="415" y="28" text-anchor="middle" fill="white" font-weight="700">API Route /login</text>
  <rect x="530" y="10" width="90" height="28" rx="3" fill="#374151"/><text x="575" y="28" text-anchor="middle" fill="white" font-weight="700">PostgreSQL</text>

  <!-- lifelines -->
  <line x1="75" y1="38" x2="75" y2="350" stroke="#003087" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="245" y1="38" x2="245" y2="350" stroke="#005599" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="415" y1="38" x2="415" y2="350" stroke="#1d4ed8" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="575" y1="38" x2="575" y2="350" stroke="#374151" stroke-width="1" stroke-dasharray="4,3"/>

  <!-- arrows -->
  <line x1="75" y1="70" x2="240" y2="70" stroke="#000" stroke-width="1.3" marker-end="url(#a2)"/>
  <text x="155" y="65" text-anchor="middle" font-size="9">POST /api/auth/login</text>
  <text x="155" y="78" text-anchor="middle" font-size="8" fill="#888">{email, password}</text>

  <line x1="245" y1="100" x2="410" y2="100" stroke="#000" stroke-width="1.3" marker-end="url(#a2)"/>
  <text x="328" y="95" text-anchor="middle" font-size="9">NextRequest + headers</text>

  <line x1="415" y1="130" x2="410" y2="130" stroke="#1d4ed8" stroke-width="1"/>
  <rect x="400" y="118" width="30" height="14" fill="#dbeafe"/>
  <text x="415" y="128" text-anchor="middle" font-size="8" fill="#1d4ed8">Zod.parse()</text>

  <line x1="415" y1="155" x2="570" y2="155" stroke="#000" stroke-width="1.3" marker-end="url(#a2)"/>
  <text x="493" y="150" text-anchor="middle" font-size="9">SELECT user WHERE email=$1</text>

  <line x1="570" y1="180" x2="420" y2="180" stroke="#555" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#a3)"/>
  <text x="493" y="175" text-anchor="middle" font-size="9">rows[0] → user</text>

  <rect x="400" y="188" width="30" height="14" fill="#dbeafe"/>
  <text x="415" y="198" text-anchor="middle" font-size="8" fill="#1d4ed8">bcrypt.compare()</text>

  <rect x="400" y="208" width="30" height="14" fill="#dbeafe"/>
  <text x="415" y="218" text-anchor="middle" font-size="8" fill="#1d4ed8">signAccessToken()</text>
  <text x="415" y="231" text-anchor="middle" font-size="8" fill="#1d4ed8">signRefreshToken()</text>

  <line x1="410" y1="250" x2="80" y2="250" stroke="#555" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#a3)"/>
  <text x="245" y="245" text-anchor="middle" font-size="9">200 OK: {accessToken, user}</text>
  <text x="245" y="258" text-anchor="middle" font-size="8" fill="#888">Set-Cookie: fg_refresh_token (httpOnly)</text>

  <rect x="58" y="270" width="34" height="14" fill="#eef2ff"/>
  <text x="75" y="280" text-anchor="middle" font-size="8" fill="#003087">setState(user, token)</text>

  <line x1="75" y1="300" x2="240" y2="300" stroke="#000" stroke-width="1.3" marker-end="url(#a2)"/>
  <text x="155" y="295" text-anchor="middle" font-size="9">GET /api/users/me</text>
  <text x="155" y="308" text-anchor="middle" font-size="8" fill="#888">Authorization: Bearer {token}</text>

  <line x1="415" y1="330" x2="80" y2="330" stroke="#555" stroke-width="1.3" stroke-dasharray="5,3" marker-end="url(#a3)"/>
  <text x="245" y="325" text-anchor="middle" font-size="9">200 OK: {avatar_url, email}</text>

  <defs>
    <marker id="a2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#000"/></marker>
    <marker id="a3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#555"/></marker>
  </defs>
</svg>
</div>
<div class="fig-source">Fuente: elaboración propia. Las líneas discontinuas representan mensajes de respuesta.</div>
`)

// ─── DISEÑO 3.3 ER ────────────────────────────────────────────────────────────
const diseno3 = pg(13, `
<h2>3.3 Diagrama entidad–relación</h2>
<p>
El modelo entidad–relación de Respawn comprende diez entidades principales interrelacionadas. El diagrama
siguiente representa las entidades, sus atributos clave y las relaciones con sus cardinalidades, reflejando
el modelo conceptual de datos de la plataforma.
</p>
<div class="fig-label">Figura 5</div>
<div class="fig-name"><em>Diagrama entidad–relación del sistema Respawn</em></div>
<div class="svg-wrap">
<svg width="660" height="490" viewBox="0 0 660 490" xmlns="http://www.w3.org/2000/svg" font-family="Calibri,sans-serif" font-size="9">

  <!-- USERS -->
  <rect x="10" y="160" width="130" height="120" rx="3" fill="#eef2ff" stroke="#003087" stroke-width="1.5"/>
  <rect x="10" y="160" width="130" height="20" rx="3" fill="#003087"/>
  <text x="75" y="174" text-anchor="middle" fill="white" font-weight="700" font-size="10">USERS</text>
  <text x="16" y="192" fill="#222">🔑 id (PK)</text>
  <text x="16" y="205" fill="#222">username (UNIQUE)</text>
  <text x="16" y="218" fill="#222">email (UNIQUE)</text>
  <text x="16" y="231" fill="#222">password_hash</text>
  <text x="16" y="244" fill="#222">role</text>
  <text x="16" y="257" fill="#222">avatar_url</text>
  <text x="16" y="270" fill="#222">is_banned</text>

  <!-- GAMES -->
  <rect x="10" y="330" width="130" height="100" rx="3" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <rect x="10" y="330" width="130" height="20" rx="3" fill="#16a34a"/>
  <text x="75" y="344" text-anchor="middle" fill="white" font-weight="700" font-size="10">GAMES</text>
  <text x="16" y="362" fill="#222">🔑 id (PK)</text>
  <text x="16" y="375" fill="#222">name</text>
  <text x="16" y="388" fill="#222">slug (UNIQUE)</text>
  <text x="16" y="401" fill="#222">cover_url</text>
  <text x="16" y="414" fill="#222">igdb_id</text>
  <text x="16" y="427" fill="#222">genre</text>

  <!-- POSTS -->
  <rect x="215" y="130" width="145" height="170" rx="3" fill="#eef2ff" stroke="#003087" stroke-width="1.5"/>
  <rect x="215" y="130" width="145" height="20" rx="3" fill="#003087"/>
  <text x="288" y="144" text-anchor="middle" fill="white" font-weight="700" font-size="10">POSTS</text>
  <text x="221" y="162" fill="#222">🔑 id (PK)</text>
  <text x="221" y="175" fill="#222">title</text>
  <text x="221" y="188" fill="#222">body</text>
  <text x="221" y="201" fill="#222">category</text>
  <text x="221" y="214" fill="#222">🔗 author_id (FK→users)</text>
  <text x="221" y="227" fill="#222">🔗 game_id (FK→games)</text>
  <text x="221" y="240" fill="#222">is_published</text>
  <text x="221" y="253" fill="#222">is_deleted</text>
  <text x="221" y="266" fill="#222">created_at</text>
  <text x="221" y="279" fill="#222">trending_score</text>
  <text x="221" y="292" fill="#888" font-style="italic">updated_at</text>

  <!-- COMMENTS -->
  <rect x="430" y="80" width="140" height="130" rx="3" fill="#eef2ff" stroke="#003087" stroke-width="1.5"/>
  <rect x="430" y="80" width="140" height="20" rx="3" fill="#003087"/>
  <text x="500" y="94" text-anchor="middle" fill="white" font-weight="700" font-size="10">COMMENTS</text>
  <text x="436" y="112" fill="#222">🔑 id (PK)</text>
  <text x="436" y="125" fill="#222">🔗 post_id (FK→posts)</text>
  <text x="436" y="138" fill="#222">🔗 author_id (FK→users)</text>
  <text x="436" y="151" fill="#222">body</text>
  <text x="436" y="164" fill="#222">🔗 parent_id (FK→self)</text>
  <text x="436" y="177" fill="#222">is_deleted</text>
  <text x="436" y="190" fill="#222">created_at</text>

  <!-- VOTES -->
  <rect x="430" y="240" width="140" height="100" rx="3" fill="#fff7ed" stroke="#ea580c" stroke-width="1.5"/>
  <rect x="430" y="240" width="140" height="20" rx="3" fill="#ea580c"/>
  <text x="500" y="254" text-anchor="middle" fill="white" font-weight="700" font-size="10">VOTES</text>
  <text x="436" y="272" fill="#222">🔑 user_id (PK,FK→users)</text>
  <text x="436" y="285" fill="#222">🔑 target_type (PK)</text>
  <text x="436" y="298" fill="#222">🔑 target_id (PK)</text>
  <text x="436" y="311" fill="#222">value (1 ó -1)</text>
  <text x="436" y="324" fill="#888" font-style="italic">created_at</text>

  <!-- MESSAGES -->
  <rect x="10" y="10" width="140" height="110" rx="3" fill="#fdf4ff" stroke="#9333ea" stroke-width="1.5"/>
  <rect x="10" y="10" width="140" height="20" rx="3" fill="#9333ea"/>
  <text x="80" y="24" text-anchor="middle" fill="white" font-weight="700" font-size="10">MESSAGES</text>
  <text x="16" y="42" fill="#222">🔑 id (PK)</text>
  <text x="16" y="55" fill="#222">🔗 sender_id (FK→users)</text>
  <text x="16" y="68" fill="#222">🔗 recipient_id (FK→users)</text>
  <text x="16" y="81" fill="#222">body</text>
  <text x="16" y="94" fill="#222">created_at</text>
  <text x="16" y="107" fill="#222">read_at</text>

  <!-- FRIENDSHIPS -->
  <rect x="215" y="350" width="145" height="100" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <rect x="215" y="350" width="145" height="20" rx="3" fill="#d97706"/>
  <text x="288" y="364" text-anchor="middle" fill="white" font-weight="700" font-size="10">FRIENDSHIPS</text>
  <text x="221" y="382" fill="#222">🔑 id (PK)</text>
  <text x="221" y="395" fill="#222">🔗 user_id_1 (FK→users)</text>
  <text x="221" y="408" fill="#222">🔗 user_id_2 (FK→users)</text>
  <text x="221" y="421" fill="#222">status</text>
  <text x="221" y="434" fill="#222">created_at</text>
  <text x="221" y="447" fill="#888" font-style="italic">UNIQUE(uid1,uid2)</text>

  <!-- POST_STEPS -->
  <rect x="430" y="370" width="140" height="90" rx="3" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
  <rect x="430" y="370" width="140" height="20" rx="3" fill="#64748b"/>
  <text x="500" y="384" text-anchor="middle" fill="white" font-weight="700" font-size="10">POST_STEPS</text>
  <text x="436" y="402" fill="#222">🔑 id (PK)</text>
  <text x="436" y="415" fill="#222">🔗 post_id (FK→posts)</text>
  <text x="436" y="428" fill="#222">step_num</text>
  <text x="436" y="441" fill="#222">title / body</text>
  <text x="436" y="454" fill="#888" font-style="italic">UNIQUE(post_id,step_num)</text>

  <!-- REPORTS (small) -->
  <rect x="215" y="10" width="200" height="80" rx="3" fill="#fee2e2" stroke="#c00" stroke-width="1.5"/>
  <rect x="215" y="10" width="200" height="20" rx="3" fill="#c00"/>
  <text x="315" y="24" text-anchor="middle" fill="white" font-weight="700" font-size="10">REPORTS</text>
  <text x="221" y="42" fill="#222">🔑 id (PK)   🔗 reporter_id (FK→users)</text>
  <text x="221" y="55" fill="#222">target_type   target_id   reason</text>
  <text x="221" y="68" fill="#222">status   created_at</text>

  <!-- RELATION LINES -->
  <!-- users → posts (author) -->
  <line x1="140" y1="210" x2="215" y2="210" stroke="#003087" stroke-width="1.2"/>
  <text x="145" y="206" fill="#003087" font-size="9">1</text><text x="206" y="206" fill="#003087" font-size="9">N</text>

  <!-- games → posts -->
  <line x1="140" y1="370" x2="215" y2="260" stroke="#16a34a" stroke-width="1.2"/>
  <text x="143" y="365" fill="#16a34a" font-size="9">1</text><text x="209" y="255" fill="#16a34a" font-size="9">N</text>

  <!-- posts → comments -->
  <line x1="360" y1="170" x2="430" y2="140" stroke="#003087" stroke-width="1.2"/>
  <text x="363" y="165" fill="#003087" font-size="9">1</text><text x="423" y="135" fill="#003087" font-size="9">N</text>

  <!-- posts → votes -->
  <line x1="360" y1="240" x2="430" y2="280" stroke="#ea580c" stroke-width="1.2"/>
  <text x="415" y="272" fill="#ea580c" font-size="9">N</text>

  <!-- posts → post_steps -->
  <line x1="360" y1="290" x2="430" y2="400" stroke="#64748b" stroke-width="1.2"/>
  <text x="363" y="294" fill="#64748b" font-size="9">1</text><text x="423" y="396" fill="#64748b" font-size="9">N</text>

  <!-- users → messages -->
  <line x1="80" y1="160" x2="80" y2="120" stroke="#9333ea" stroke-width="1.2"/>
  <text x="84" y="158" fill="#9333ea" font-size="9">1</text><text x="84" y="126" fill="#9333ea" font-size="9">N</text>

  <!-- users → friendships -->
  <line x1="140" y1="270" x2="215" y2="390" stroke="#d97706" stroke-width="1.2"/>
  <text x="143" y="280" fill="#d97706" font-size="9">1</text><text x="209" y="388" fill="#d97706" font-size="9">N</text>

  <!-- users → reports -->
  <line x1="140" y1="175" x2="215" y2="55" stroke="#c00" stroke-width="1" stroke-dasharray="4,2"/>
  <text x="209" y="58" fill="#c00" font-size="9">N</text>
</svg>
</div>
<div class="fig-source">Fuente: elaboración propia. 🔑 = clave primaria; 🔗 = clave foránea.</div>
`)

// ─── DISEÑO 3.4 RELACIONAL ────────────────────────────────────────────────────
const diseno4 = pg(14, `
<h2>3.4 Diagrama relacional</h2>
<p>
El modelo relacional especifica la estructura física de la base de datos de Respawn en PostgreSQL,
detallando por cada relación (tabla) sus atributos, tipos de datos, restricciones de integridad y
claves foráneas. La convención empleada es: <strong>PK</strong> = clave primaria, <strong>FK</strong> = clave foránea, <strong>U</strong> = valor único, <strong>NN</strong> = NOT NULL.
</p>
<div class="table-title">Tabla 6</div>
<div class="table-name"><em>Esquema relacional del sistema Respawn — tablas principales</em></div>
<table style="font-size:9pt">
  <tr><th>Tabla</th><th>Columna</th><th>Tipo</th><th>Restricciones</th></tr>
  <tr><td rowspan="8"><strong>users</strong></td><td>id</td><td>UUID</td><td>PK, DEFAULT gen_random_uuid()</td></tr>
  <tr><td>username</td><td>VARCHAR(50)</td><td>NN, U</td></tr>
  <tr><td>email</td><td>VARCHAR(255)</td><td>NN, U</td></tr>
  <tr><td>password_hash</td><td>TEXT</td><td>NN</td></tr>
  <tr><td>role</td><td>user_role (ENUM)</td><td>NN, DEFAULT 'user'</td></tr>
  <tr><td>avatar_url</td><td>TEXT</td><td>nullable</td></tr>
  <tr><td>is_banned</td><td>BOOLEAN</td><td>NN, DEFAULT FALSE</td></tr>
  <tr><td>created_at</td><td>TIMESTAMPTZ</td><td>NN, DEFAULT NOW()</td></tr>

  <tr><td rowspan="7"><strong>posts</strong></td><td>id</td><td>UUID</td><td>PK</td></tr>
  <tr><td>title</td><td>VARCHAR(500)</td><td>NN</td></tr>
  <tr><td>body</td><td>TEXT</td><td>NN</td></tr>
  <tr><td>category</td><td>post_category (ENUM)</td><td>NN</td></tr>
  <tr><td>author_id</td><td>UUID</td><td>FK → users(id) ON DELETE SET NULL</td></tr>
  <tr><td>game_id</td><td>UUID</td><td>FK → games(id) ON DELETE SET NULL, nullable</td></tr>
  <tr><td>is_published, is_deleted</td><td>BOOLEAN</td><td>NN, DEFAULT TRUE / FALSE</td></tr>

  <tr><td rowspan="5"><strong>comments</strong></td><td>id</td><td>UUID</td><td>PK</td></tr>
  <tr><td>post_id</td><td>UUID</td><td>FK → posts(id) ON DELETE CASCADE, NN</td></tr>
  <tr><td>author_id</td><td>UUID</td><td>FK → users(id) ON DELETE SET NULL</td></tr>
  <tr><td>body</td><td>TEXT</td><td>NN</td></tr>
  <tr><td>parent_id</td><td>UUID</td><td>FK → comments(id), nullable (raíz)</td></tr>

  <tr><td rowspan="4"><strong>votes</strong></td><td>user_id</td><td>UUID</td><td>PK (compuesta), FK → users</td></tr>
  <tr><td>target_type</td><td>VARCHAR(10)</td><td>PK (compuesta), CHECK IN ('post','comment')</td></tr>
  <tr><td>target_id</td><td>UUID</td><td>PK (compuesta)</td></tr>
  <tr><td>value</td><td>SMALLINT</td><td>NN, CHECK IN (1, -1)</td></tr>

  <tr><td rowspan="4"><strong>messages</strong></td><td>id</td><td>UUID</td><td>PK</td></tr>
  <tr><td>sender_id</td><td>UUID</td><td>FK → users(id), NN</td></tr>
  <tr><td>recipient_id</td><td>UUID</td><td>FK → users(id), NN</td></tr>
  <tr><td>read_at</td><td>TIMESTAMPTZ</td><td>nullable (NULL = no leído)</td></tr>

  <tr><td rowspan="4"><strong>friendships</strong></td><td>id</td><td>UUID</td><td>PK</td></tr>
  <tr><td>user_id_1</td><td>UUID</td><td>FK → users(id), NN</td></tr>
  <tr><td>user_id_2</td><td>UUID</td><td>FK → users(id), NN</td></tr>
  <tr><td>status</td><td>friendship_status (ENUM)</td><td>NN, DEFAULT 'pending'</td></tr>

  <tr><td rowspan="3"><strong>games</strong></td><td>id</td><td>UUID</td><td>PK</td></tr>
  <tr><td>slug</td><td>VARCHAR(255)</td><td>NN, U</td></tr>
  <tr><td>igdb_id</td><td>INTEGER</td><td>nullable, U</td></tr>
</table>
<div class="table-source">Fuente: elaboración propia. Se omiten columnas triviales (created_at, updated_at) comunes a todas las tablas.</div>

<p style="margin-top:12px">
Adicionalmente, el sistema emplea una <strong>vista SQL</strong> denominada <code>post_scores</code>
que precalcula las métricas de votación (upvotes, downvotes, net_votes) y el <em>trending_score</em>
de cada post. Esta vista permite que la API de trending obtenga los datos agregados en una única
consulta sin necesidad de ejecutar subconsultas complejas en tiempo de petición, mejorando el rendimiento
general del sistema en operaciones de lectura de alta frecuencia.
</p>
`)

// ─── ENSAMBLADO ──────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Proyecto DAW — Respawn</title>
<style>${css}</style>
</head>
<body>
${cover}
${abstract}
${indice}
${intro1}
${intro2}
${intro3}
${intro4}
${analisis1}
${analisis2}
${analisis3}
${analisis4}
${diseno1}
${diseno2}
${diseno3}
${diseno4}
</body>
</html>`

// ─── PUPPETEER ───────────────────────────────────────────────────────────────
async function generate() {
  console.log('[proyecto-daw] Generando PDF...')

  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox'],
    })
  } catch {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  }

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    margin: { top: '25mm', bottom: '20mm', left: '30mm', right: '20mm' },
    printBackground: true,
  })

  await browser.close()
  console.log(`[proyecto-daw] ✅ PDF generado: ${OUTPUT_PATH}`)
}

generate().catch(e => { console.error('[proyecto-daw] ❌', e.message); process.exit(1) })
