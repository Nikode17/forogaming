# Software Design Document (SDD)
## Respawn — Plataforma web de comunidad de videojuegos

**Versión:** 2.0.0
**Estado:** Producción funcional — https://forogaming.vercel.app
**Audiencia:** Claude Code / Equipo de desarrollo / Tribunal académico FP DAW
**Última actualización:** 2026-05-17

> **Nota sobre la evolución del documento.** Las secciones 1-8 contienen el diseño técnico
> original (v0.1.0, abril 2026) y sirven como referencia histórica del planteamiento inicial.
> La **sección 9** documenta el estado real construido (mayo 2026), incluyendo todas las
> fases entregadas, nuevas decisiones y diferencias respecto al diseño original.
> En caso de discrepancia, la sección 9 es la fuente de verdad.

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Diseño de base de datos](#3-diseño-de-base-de-datos)
4. [APIs y endpoints](#4-apis-y-endpoints)
5. [Seguridad](#5-seguridad)
6. [Requisitos no funcionales](#6-requisitos-no-funcionales)
7. [Decisiones de diseño (ADRs)](#7-decisiones-de-diseño-adrs)
8. [Diagramas](#8-diagramas)
9. [Estado actual — fases construidas (v2.0.0)](#9-estado-actual--fases-construidas-v200)

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento describe el diseño técnico de la aplicación web de foro de videojuegos. Está orientado al uso directo por parte de herramientas de desarrollo asistido (Claude Code) y desarrolladores, por lo que prioriza la precisión técnica y la completitud sobre la legibilidad para perfiles no técnicos.

### 1.2 Descripción del producto

Plataforma web de tipo foro comunitario especializada en videojuegos, con secciones dedicadas a:

- **Guías** paso a paso de juegos
- **Easter Eggs** y curiosidades
- **Reviews** de títulos
- **Trending** — contenido más popular en tiempo real
- **Novedades** — publicaciones recientes destacadas
- **Zona de comentarios** anidados por post

El estilo de interacción es similar a Reddit: feed principal con posts ordenables, sidebar con navegación por juego/categoría, y vista de artículo con pasos numerados y multimedia.

### 1.3 Alcance

- Aplicación web (responsive, desktop-first según wireframes)
- Sistema de autenticación y roles
- CRUD de posts con soporte multimedia
- Sistema de votos, likes y favoritos
- Moderación de contenido

### 1.4 Fuera de alcance (v1.0)

- Aplicación móvil nativa
- Sistema de mensajería privada
- Integración con APIs externas de videojuegos (IGDB, Steam, etc.) — a valorar en v2

---

## 2. Arquitectura del sistema

### 2.1 Estilo arquitectónico

Arquitectura **cliente-servidor desacoplada**:

- **Frontend:** Single Page Application (SPA)
- **Backend:** API REST stateless
- **Base de datos:** Relacional
- **Almacenamiento de medios:** Servicio externo (S3-compatible)

> **Nota:** El stack tecnológico concreto está por definir. Este documento usa nombres genéricos. Ver [ADR-001](#adr-001-selección-de-stack-tecnológico).

### 2.2 Diagrama de componentes de alto nivel

```
┌─────────────────────────────────────────────────────┐
│                     CLIENTE                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Router  │  │  Páginas  │  │   Componentes    │  │
│  │  (SPA)   │→ │  /home    │  │  Feed, Sidebar,  │  │
│  └──────────┘  │  /post    │  │  PostCard, etc.  │  │
│                │  /game    │  └──────────────────┘  │
│                └───────────┘                        │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / REST (JSON)
┌───────────────────────▼─────────────────────────────┐
│                   API BACKEND                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Auth    │  │  Posts   │  │  Comments / Votes  │ │
│  │  Module  │  │  Module  │  │  Module            │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│  ┌──────────┐  ┌──────────┐                          │
│  │  Users   │  │  Games   │                          │
│  │  Module  │  │  Module  │                          │
│  └──────────┘  └──────────┘                          │
└──────────┬────────────────────────┬──────────────────┘
           │                        │
┌──────────▼──────┐      ┌──────────▼──────────┐
│   BASE DE DATOS  │      │  ALMACENAMIENTO     │
│   (SQL)          │      │  DE MEDIOS (S3)     │
└─────────────────┘      └─────────────────────┘
```

### 2.3 Módulos del backend

| Módulo | Responsabilidad |
|---|---|
| `auth` | Registro, login, tokens JWT, refresh |
| `users` | Perfil, roles, preferencias |
| `games` | Catálogo de juegos, metadatos |
| `posts` | CRUD de posts, categorías, multimedia |
| `comments` | Comentarios anidados por post |
| `votes` | Upvote/downvote, likes, favoritos |
| `moderation` | Reportes, baneos, gestión de contenido |
| `media` | Upload y gestión de imágenes/vídeos |
| `trending` | Cálculo y caché de contenido trending |

### 2.4 Páginas del frontend

| Ruta | Descripción |
|---|---|
| `/` | Home — feed principal con novedades y trending |
| `/game/:slug` | Feed filtrado por juego |
| `/post/:id` | Vista de artículo completo con comentarios |
| `/category/:type` | Feed por categoría (guías, easter-eggs, reviews) |
| `/search` | Resultados de búsqueda |
| `/user/:username` | Perfil público de usuario |
| `/submit` | Formulario de publicación (auth required) |
| `/login` | Autenticación |
| `/register` | Registro |
| `/admin` | Panel de administración (admin only) |

---

## 3. Diseño de base de datos

### 3.1 Entidades principales

#### `users`
```sql
users (
  id            UUID PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'moderator', 'user', 'guest') DEFAULT 'user',
  avatar_url    TEXT,
  bio           TEXT,
  is_banned     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
)
```

#### `games`
```sql
games (
  id          UUID PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  cover_url   TEXT,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

#### `posts`
```sql
posts (
  id           UUID PRIMARY KEY,
  title        VARCHAR(500) NOT NULL,
  body         TEXT NOT NULL,              -- HTML/Markdown renderizado
  category     ENUM('guide', 'easter-egg', 'review', 'general') NOT NULL,
  game_id      UUID REFERENCES games(id),
  author_id    UUID REFERENCES users(id),
  is_published BOOLEAN DEFAULT TRUE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  view_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
)
```

#### `post_media`
```sql
post_media (
  id         UUID PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  type       ENUM('image', 'video_embed') NOT NULL,
  url        TEXT NOT NULL,               -- URL S3 o embed URL (YouTube, etc.)
  position   INTEGER,                     -- orden dentro del post
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### `post_steps`
```sql
post_steps (
  id        UUID PRIMARY KEY,
  post_id   UUID REFERENCES posts(id) ON DELETE CASCADE,
  step_num  INTEGER NOT NULL,
  title     VARCHAR(255),
  body      TEXT NOT NULL,
  image_url TEXT,
  UNIQUE(post_id, step_num)
)
```

#### `comments`
```sql
comments (
  id         UUID PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  parent_id  UUID REFERENCES comments(id),  -- NULL = comentario raíz
  body       TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### `votes`
```sql
votes (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  target_type ENUM('post', 'comment') NOT NULL,
  target_id   UUID NOT NULL,
  value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),  -- upvote/downvote
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
)
```

#### `likes`
```sql
likes (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  target_type ENUM('post', 'comment') NOT NULL,
  target_id   UUID NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
)
```

#### `favorites`
```sql
favorites (
  id         UUID PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  post_id    UUID REFERENCES posts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
)
```

#### `reports`
```sql
reports (
  id          UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  target_type ENUM('post', 'comment', 'user') NOT NULL,
  target_id   UUID NOT NULL,
  reason      TEXT,
  status      ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT NOW()
)
```

### 3.2 Índices recomendados

```sql
CREATE INDEX idx_posts_game_id     ON posts(game_id);
CREATE INDEX idx_posts_category    ON posts(category);
CREATE INDEX idx_posts_author_id   ON posts(author_id);
CREATE INDEX idx_posts_created_at  ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id  ON comments(post_id);
CREATE INDEX idx_comments_parent   ON comments(parent_id);
CREATE INDEX idx_votes_target      ON votes(target_type, target_id);
CREATE INDEX idx_likes_target      ON likes(target_type, target_id);
```

---

## 4. APIs y endpoints

### 4.1 Convenciones

- Base URL: `/api/v1`
- Formato: JSON
- Autenticación: `Authorization: Bearer <JWT>`
- Paginación: `?page=1&limit=20`
- Respuesta de error estándar:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido o expirado"
  }
}
```

### 4.2 Auth

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/register` | Crear cuenta | No |
| POST | `/auth/login` | Login, devuelve JWT + refresh token | No |
| POST | `/auth/refresh` | Renovar access token | No |
| POST | `/auth/logout` | Invalidar refresh token | Sí |

### 4.3 Posts

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/posts` | Listar posts (paginado, filtrable) | No |
| GET | `/posts/:id` | Obtener post completo | No |
| POST | `/posts` | Crear post | Usuario+ |
| PUT | `/posts/:id` | Editar post propio | Usuario+ |
| DELETE | `/posts/:id` | Eliminar post | Autor / Mod+ |
| GET | `/posts/trending` | Top posts trending | No |
| GET | `/posts/search?q=` | Búsqueda full-text | No |

**Query params de `/posts`:**
- `game=<slug>` — filtrar por juego
- `category=guide|easter-egg|review|general`
- `sort=new|top|trending`
- `page`, `limit`

### 4.4 Comments

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/posts/:id/comments` | Obtener comentarios (árbol) | No |
| POST | `/posts/:id/comments` | Añadir comentario / respuesta | Usuario+ |
| PUT | `/comments/:id` | Editar comentario propio | Usuario+ |
| DELETE | `/comments/:id` | Eliminar comentario | Autor / Mod+ |

### 4.5 Interacciones

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/votes` | Votar (up/down) en post o comentario | Usuario+ |
| DELETE | `/votes` | Quitar voto | Usuario+ |
| POST | `/likes` | Dar like a post o comentario | Usuario+ |
| DELETE | `/likes` | Quitar like | Usuario+ |
| POST | `/favorites/:postId` | Guardar en favoritos | Usuario+ |
| DELETE | `/favorites/:postId` | Eliminar de favoritos | Usuario+ |
| GET | `/users/me/favorites` | Listar favoritos del usuario | Usuario+ |

### 4.6 Games

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/games` | Listar juegos | No |
| GET | `/games/:slug` | Detalle de un juego | No |
| POST | `/games` | Crear juego | Admin |
| PUT | `/games/:id` | Editar juego | Admin |

### 4.7 Users

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/users/:username` | Perfil público | No |
| GET | `/users/me` | Mi perfil | Sí |
| PUT | `/users/me` | Actualizar perfil | Sí |

### 4.8 Moderación (Admin / Mod)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/reports` | Reportar contenido o usuario | Usuario+ |
| GET | `/admin/reports` | Ver reportes pendientes | Mod+ |
| PUT | `/admin/reports/:id` | Resolver/desestimar reporte | Mod+ |
| PUT | `/admin/users/:id/ban` | Banear usuario | Mod+ |
| DELETE | `/admin/posts/:id` | Eliminar cualquier post | Mod+ |

---

## 5. Seguridad

### 5.1 Autenticación

- **JWT** (access token): duración corta (15 min)
- **Refresh token**: duración larga (7 días), almacenado en cookie `httpOnly` y `Secure`
- Rotación de refresh token en cada uso
- Revocación en logout (lista negra en caché/Redis o tabla `revoked_tokens`)

### 5.2 Autorización — Matriz de roles

| Acción | Invitado | Usuario | Moderador | Admin |
|---|:---:|:---:|:---:|:---:|
| Leer posts / comentarios | ✅ | ✅ | ✅ | ✅ |
| Votar / likear / guardar | ❌ | ✅ | ✅ | ✅ |
| Crear post | ❌ | ✅ | ✅ | ✅ |
| Editar post propio | ❌ | ✅ | ✅ | ✅ |
| Eliminar post propio | ❌ | ✅ | ✅ | ✅ |
| Eliminar cualquier post | ❌ | ❌ | ✅ | ✅ |
| Gestionar reportes | ❌ | ❌ | ✅ | ✅ |
| Banear usuarios | ❌ | ❌ | ✅ | ✅ |
| Crear / editar juegos | ❌ | ❌ | ❌ | ✅ |
| Gestionar roles | ❌ | ❌ | ❌ | ✅ |

### 5.3 Protección de endpoints

- Validación de input en backend (esquemas estrictos, sin confiar en el frontend)
- Rate limiting por IP y por usuario autenticado:
  - Login: máximo 10 intentos / 15 min
  - Creación de posts: máximo 10 / hora por usuario
  - Votos: máximo 100 / hora por usuario
- Sanitización de HTML en el body de posts y comentarios (prevención XSS)
- Validación de tipo MIME y tamaño en uploads de imágenes (máx. 10 MB)
- Vídeos: solo embeds permitidos (whitelist de dominios: youtube.com, youtu.be, vimeo.com)

### 5.4 Almacenamiento de contraseñas

- Hash con **bcrypt** (cost factor ≥ 12) o **argon2id**

### 5.5 CORS

- Whitelist de orígenes permitidos (solo el dominio del frontend)
- Sin `Access-Control-Allow-Origin: *`

### 5.6 Cabeceras de seguridad HTTP

```
Content-Security-Policy: default-src 'self'; img-src 'self' <CDN>; frame-src youtube.com vimeo.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 6. Requisitos no funcionales

### 6.1 Rendimiento

- Tiempo de respuesta de la API < 300 ms (p95) para endpoints de lectura
- Feed principal cargado en < 2 s (LCP) en conexión 4G
- Paginación basada en cursor para feeds (mejor rendimiento que offset en tablas grandes)
- Caché de resultados trending (TTL: 5 min) mediante Redis o equivalente

### 6.2 Escalabilidad

- Backend stateless (horizontal scaling)
- Separación de lectura/escritura en base de datos si el tráfico crece (réplicas de lectura)
- CDN para assets estáticos e imágenes

### 6.3 Disponibilidad

- Objetivo: 99.5% uptime
- Health check endpoint: `GET /api/health`

### 6.4 Mantenibilidad

- Código documentado con JSDoc / docstrings
- Tests unitarios y de integración (cobertura mínima 70%)
- Variables de entorno para toda configuración sensible (sin secrets en código)
- Migraciones de base de datos versionadas

### 6.5 Accesibilidad

- Nivel WCAG 2.1 AA como objetivo
- Navegación por teclado funcional
- Atributos ARIA en componentes interactivos

### 6.6 Internacionalización

- Interfaz inicial en español
- Arquitectura preparada para i18n (textos externalizados) para futuras lenguas

---

## 7. Decisiones de diseño (ADRs)

### ADR-001: Selección de stack tecnológico

**Estado:** Pendiente de decisión  
**Contexto:** El stack no está definido. Se necesita elegir antes de iniciar el desarrollo.  
**Opciones consideradas:**

| Opción | Frontend | Backend | DB |
|---|---|---|---|
| A | Next.js (React) | Next.js API Routes / Node.js | PostgreSQL |
| B | Vue 3 + Vite | Node.js (Express / Fastify) | PostgreSQL |
| C | React + Vite | Python (FastAPI) | PostgreSQL |

**Recomendación provisional:** Opción A (Next.js full-stack) por su capacidad de SSR (mejor SEO para posts públicos), ecosistema maduro y menor overhead de infraestructura en etapas iniciales.  
**Decisión:** TBD

---

### ADR-002: Sistema de comentarios anidados

**Estado:** Decidido  
**Contexto:** Los comentarios deben soportar respuestas (threading).  
**Decisión:** Modelo **adjacency list** (`parent_id`). Simple de implementar y suficiente para 2-3 niveles de anidamiento. Si se necesitan árboles profundos en el futuro, migrar a **nested sets** o **closure table**.

---

### ADR-003: Cálculo de trending

**Estado:** Pendiente de implementación  
**Contexto:** El feed de trending debe reflejar popularidad reciente, no solo total de votos.  
**Decisión provisional:** Algoritmo tipo Reddit score:

```
score = (upvotes - downvotes) / (age_in_hours + 2)^1.8
```

Recalculado periódicamente (cron job cada 5 min) y almacenado en caché.

---

### ADR-004: Upload de imágenes

**Estado:** Decidido en concepto  
**Decisión:** El frontend solicita una **presigned URL** al backend, y sube el archivo directamente al bucket S3 (o compatible: Cloudflare R2, Supabase Storage). El backend nunca actúa como proxy de archivos binarios.

---

### ADR-005: Votos vs Likes — dos sistemas

**Estado:** Decidido  
**Contexto:** Se requieren tanto upvote/downvote (karma) como likes.  
**Decisión:** Mantener tablas separadas (`votes` y `likes`) con semánticas distintas. Los votos afectan al ranking del contenido; los likes son una interacción emocional sin impacto en el algoritmo de trending.

---

## 8. Diagramas

### 8.1 Flujo de autenticación

```
Cliente                    Backend                   DB
  │                           │                       │
  ├─── POST /auth/login ──────►                       │
  │    {email, password}       ├── Buscar usuario ────►
  │                           │◄── user + hash ────────
  │                           ├── Verificar bcrypt    │
  │◄── {accessToken, Set-Cookie: refreshToken} ───────┤
  │                           │                       │
  ├─── GET /api/posts ────────►                       │
  │    Authorization: Bearer  ├── Validar JWT         │
  │◄── {posts} ───────────────┤                       │
  │                           │                       │
  ├─── POST /auth/refresh ────►                       │
  │    Cookie: refreshToken   ├── Validar + Rotar ────►
  │◄── {nuevo accessToken} ───┤                       │
```

### 8.2 Flujo de creación de post con imagen

```
Cliente                  Backend                 S3 / CDN
  │                         │                       │
  ├─ POST /media/presign ───►│                       │
  │  {filename, type}        ├── Generar presign ───►│
  │◄─ {presignedUrl, key} ──┤◄── URL firmada ────────│
  │                         │                       │
  ├─ PUT {presignedUrl} ─────────────────────────────►
  │  [binary image data]     │               imagen guardada
  │◄─ 200 OK ─────────────────────────────────────────
  │                         │                       │
  ├─ POST /posts ───────────►│                       │
  │  {title, body,           ├── Guardar post ───────►
  │   media: [{key}]}        │   + post_media        │
  │◄─ {post} ───────────────┤                       │
```

### 8.3 Estructura de navegación (sitemap)

```
/
├── /game/:slug
│   ├── ?category=guide
│   ├── ?category=easter-egg
│   └── ?category=review
├── /post/:id
├── /search?q=
├── /category/:type
├── /user/:username
├── /submit           (auth)
├── /login
├── /register
└── /admin            (admin only)
    ├── /admin/reports
    └── /admin/users
```

---

## 9. Estado actual — fases construidas (v2.0.0)

Esta sección documenta lo que existe **hoy** en producción. Para historia cronológica
detallada con fechas y commits, ver `JOURNAL.md`. Para cheatsheet operativa, ver `CLAUDE.md`.

### 9.1 Stack tecnológico definitivo

| Capa | Tecnología | Nota |
|---|---|---|
| Framework web | Next.js 16 (App Router) | Turbopack en dev |
| Lenguaje | TypeScript | Modo estricto |
| Estilos | Tailwind CSS | Dark mode hardcoded |
| Base de datos | PostgreSQL en Neon (eu-west-2) | Plan free para v1 |
| Auth | JWT con `jose` (HS256) | Access 15min + refresh httpOnly 7d |
| Hash passwords | bcryptjs (cost 10) | — |
| Storage de medios | Uploadthing | Avatars 2MB×1, post images 4MB×10 |
| Rate limiting | Upstash Redis | Fallback a memoria con circuit breaker |
| Catálogo de juegos | IGDB API | Consumo desde `/api/games/search` |
| Hosting | Vercel | Auto-deploy desde `master` |

### 9.2 Cambios respecto al diseño original

| Diseño original (v0.1.0) | Estado actual (v2.0.0) | Razón |
|---|---|---|
| "Mensajería privada — fuera de alcance v1" | Implementada (`direct_messages`) | Requerida tras Fase 4a |
| "IGDB — a valorar en v2" | Implementada en v1 | Acelera el catálogo de juegos |
| "Cover image única" | Multi-imagen (hasta 10) | Fase 3, alineado con UX moderna |
| SPA pura | App Router con SSR + Client Components mezclados | Beneficios SEO y first paint |
| "S3-compatible" para medios | Uploadthing | Más rápido de integrar, plan free generoso |
| Sin sistema de bloqueos | Bloqueos bidireccionales totales | Fase 4a |
| Reportes con `target_type` post/comment/user | Añadido `message` | Fase 4b |

### 9.3 Modelo de datos extendido (tablas añadidas o modificadas)

**Tablas nuevas no documentadas en sección 3:**

- **`friend_requests`** (sender_id, receiver_id, status enum 'pending'|'accepted'|'rejected', created_at). UNIQUE(sender, receiver). Migración 002.
- **`direct_messages`** (id, sender_id, receiver_id, body con CHECK ≤2000 chars, created_at, read_at). Índices por receiver_id y sender_id con created_at DESC. Migración 002.
- **`user_blocks`** (id, blocker_id, blocked_id, created_at). CHECK no-self, UNIQUE(blocker, blocked). FK con ON DELETE CASCADE. Migración 003.
- **`follows`** (follower_id, following_id, created_at). PK compuesta. Migración 004.
- **`schema_migrations`** (filename PK, applied_at). Tracking del runner. Creada por el propio runner si no existe.

**Tablas modificadas respecto al diseño original:**

- **`users`**: añadida columna `last_seen TIMESTAMPTZ` (migración manual 002_last_seen aplicada antes del runner unificado — huérfana en disco pero registrada en `schema_migrations`).
- **`reports`**: ampliada en migraciones 005 y 006:
  - ENUM `report_target` añade valor `'message'`
  - Columnas nuevas: `description TEXT`, `resolved_at TIMESTAMPTZ`, `resolved_by UUID`, `updated_at TIMESTAMPTZ`
  - Índices nuevos: `idx_reports_status (status, created_at DESC)`, `idx_reports_target (target_type, status)`

**Convención de migraciones:**

- Naming `NNN_descripcion.sql` ordenable alfabéticamente.
- Idempotentes: `IF NOT EXISTS` en tablas, índices, columnas; `ON CONFLICT DO NOTHING` en seeds.
- `ALTER TYPE ... ADD VALUE` siempre en migración separada (Postgres no permite usar el valor recién añadido en la misma tx).
- Runner aplica en transacción por archivo y registra en `schema_migrations`.

### 9.4 Endpoints API actuales

Inventario real (cada uno expone los métodos indicados):

**Auth (4):**
- `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `POST /api/auth/register`

**Posts y contenido (8):**
- `GET/POST /api/posts` — listado con filtros `?q&category&game&sort&page&limit` + creación
- `GET/PUT/DELETE /api/posts/[id]` — detalle (404 si autor bloqueado), edit, soft-delete
- `GET/POST /api/posts/[id]/comments` — listado filtrado por bloqueos + creación con 403 anti-bloqueo
- `GET /api/posts/trending` — feed con score temporal
- `GET /api/posts/search` — búsqueda dedicada
- `GET /api/comments/[id]` (lecturas individuales)

**Usuarios (8):**
- `GET /api/users/[username]` — perfil con `viewer_blocked_them`, `is_following`
- `GET /api/users/[username]/follow`, `POST/DELETE` mismo path
- `POST/DELETE /api/users/[username]/block` — bloquear/desbloquear (tx borra friend_requests)
- `GET /api/users/me`, `GET /api/users/me/favorites`, `GET /api/users/me/blocks`
- `GET /api/users/search` — búsqueda con exclusión de bloqueados

**Friends (4):**
- `GET /api/friends`, `GET /api/friends/pending`, `POST /api/friends/request`, `POST /api/friends/respond`

**Messages (3):**
- `GET /api/messages`, `GET/POST /api/messages/[username]`, `GET /api/messages/unread`

**Reports + Admin (4):**
- `POST /api/reports` — con anti-spam 24h, rate limit 20/h, anti-self-report
- `GET /api/admin/reports` — filtros status × target_type + `target_details` enriquecidos
- `POST /api/admin/reports/[id]/resolve` — action dismiss|remove_content|ban_user (tx)
- `GET/PUT /api/admin/users/[id]/ban`, `DELETE /api/admin/posts/[id]`

**Misc (8):**
- `GET /api/games`, `GET /api/games/[slug]`, `GET /api/games/search`
- `POST /api/votes`, `POST /api/likes`, `POST/DELETE /api/favorites/[postId]`
- `GET /api/stats`, `GET /api/health`
- `GET /api/uploadthing` (router) + `POST /api/media/presign`

### 9.5 Decisiones arquitectónicas posteriores al SDD original

#### ADR-010 — SSR autenticado vía cookie httpOnly + access token efímero

**Decisión:** los Server Components que necesitan contexto de usuario usan `serverApiFetch()` (helper en `src/lib/server-auth.ts`), que lee la cookie `fg_refresh_token`, valida y emite un access token efímero solo para el render actual. Memoizado con `React.cache()` para deduplicar dentro de un mismo render.

**Razón:** los Server Components no tienen acceso al `accessToken` en memoria del cliente (vive en `AuthContext`). Sin este helper, los filtros personalizados (bloqueos, `is_following`, `viewer_blocked_them`) no funcionan en el primer render SSR.

**Prerequisito crítico:** la cookie del refresh token debe tener `Path=/` (no `/api/auth`) para que el navegador la envíe a todas las páginas. Esto se cambió en commit `73feef8` precedente.

#### ADR-011 — Bloqueo bidireccional total como filtro SQL declarativo

**Decisión:** la tabla `user_blocks` tiene una fila por dirección. El filtrado en queries se hace con un fragmento SQL reutilizable (`excludeBlockedSql(otherIdExpr, myIdParam)` de `src/lib/blocks.ts`) que genera un `NOT IN (UNION de bloqueos en ambas direcciones)`.

**Alternativas descartadas:**
- Helper JS que carga el Set de bloqueados y filtra en memoria → ineficiente para feeds grandes.
- CTE compartida via WITH → requiere reescribir queries existentes invasivamente.

**Decisiones derivadas:**
- Listados: filtrar con SQL.
- Detalles: 404 si hay relación de bloqueo (sin leak de existencia).
- Acciones: 403.
- Perfil: 404 si te bloqueó él; perfil reducido con flag `viewer_blocked_them` si tú le bloqueaste (para mostrar botón "Desbloquear").
- Comentarios: filtrar SQL — los replies huérfanos cuyo ancestro era de un bloqueado quedan descartados naturalmente por `buildTree`.

#### ADR-012 — Multi-imagen reutilizando `post_media` (no tabla nueva)

**Decisión:** mantener la tabla `post_media` (que ya soportaba `type='image' | 'video_embed'`) en lugar de crear `post_images` paralela.

**Razón:** evita fragmentación de modelo. El frontend filtra por `type='image'` donde necesita imagen pura. Endpoints añaden:
- `GET /api/posts/[id]`: campo derivado `images` con filtro aplicado.
- `GET /api/posts` (feed): `thumbnail_url` calculado con `LEFT JOIN LATERAL` que respeta el GROUP BY.

Límite cliente: 10 imágenes por post. Validación dual: Zod en servidor + UI bloquea el botón añadir.

#### ADR-013 — Sistema de reportes con 4 target types y acciones admin transaccionales

**Decisión:** `report_target` ENUM extendido para soportar `message` además de post/comment/user. Endpoint `POST /api/admin/reports/[id]/resolve` con 3 acciones (dismiss / remove_content / ban_user) ejecutadas en transacción:
- `dismiss` → `status='dismissed'`, no toca target.
- `remove_content` → soft-delete target (hard delete en messages) + `status='resolved'`.
- `ban_user` → resuelve owner del target + `UPDATE users SET is_banned=TRUE` + `status='resolved'`.

**Anti-abuso:** ventana de 24h por (reporter_id, target_id, target_type) + rate limit 20 reportes/h por usuario + anti-self-report + only-receiver para mensajes.

#### ADR-014 — Auth como modal + páginas standalone preservadas

**Decisión:** los formularios de login/register están extraídos en `LoginForm` y `RegisterForm` con prop `embedded?: boolean`. Se renderizan tanto en modal (`AuthModal` controlado por `AuthModalContext`) como en página standalone (`/login`, `/register`).

**Razón:** modal mejora la UX de interacciones inline (votar, comentar, seguir) sin perder el contexto. Páginas standalone se mantienen para shareable links, redirects 401 y SEO. Una sola implementación del formulario, dos chromes.

**Regla:** los botones de auth **interactivos** llaman a `openLogin()`/`openRegister()`. Las redirecciones automáticas (`useEffect → router.push('/login')` en `/submit`, `/friends`, `/settings`, etc.) siguen mandando a la página standalone (intencional, no se cambia).

#### ADR-015 — Layout con sidebar persistente + filtros URL shareables

**Decisión:** sidebar izquierda persistente (Client Component) reemplaza el header con tarjetas de juegos. Búsqueda, sort, filtro categoría y filtro juego viven en query string (`?q=`, `?sort=`, `?category=`, `?game=`). Combinables.

**Razón:** URLs shareables (`/?category=guide&game=elden-ring`), navegación instant via Next.js, persistencia de estado en F5. Búsqueda con debounce 300ms manipula `?q` directamente.

**Responsive:** sidebar visible en `≥lg` (1024px). En mobile se oculta y se accede via hamburguesa en navbar, abre overlay controlado por `SidebarContext`. Persistencia `localStorage['sidebar-collapsed']` para el toggle desktop.

### 9.6 Convenciones de seguridad operativas

- **CSP `img-src`** restrictivo. Allowlist: Steam CDN (3 hostnames), Imgur, `*.ufs.sh`, `utfs.io`, `images.igdb.com`, `data:`, `blob:`. Cualquier imagen externa que necesite otro dominio requiere modificar `next.config.ts`.
- **CSP `script-src`** permite `'unsafe-eval'` y `'unsafe-inline'` (Next.js requirement). Aceptado.
- **Permissions-Policy** desactiva camera, microphone, geolocation, payment.
- **HSTS** habilitado.
- **X-Frame-Options: DENY** — sin embedding del sitio.
- **JWT**: secret de ≥32 chars (validado en `getSecret()`). Access token NO httpOnly (vive en memoria del cliente, manejado por `AuthContext`). Refresh token httpOnly + Secure en prod.
- **Logout** revoca el refresh token vía tabla `revoked_tokens` (con limpieza por `expires_at`). Refresh comprueba esta tabla antes de emitir nuevo access.
- **Rate limiting** en endpoints críticos: login (10/15min por IP), register (5/h por IP), post create (10/h por user), votes (100/h por user), reports (20/h por user).
- **Sanitización HTML** custom (`src/lib/sanitize.ts`) sin `jsdom` para evitar incompatibilidad ESM con Vercel/Turbopack. Allowlist de tags por contexto (post vs comment).

### 9.7 Operaciones y despliegue

- **Auto-deploy:** push a `master` → Vercel detecta → build + deploy en 2-3 min.
- **Migraciones a prod:** el runner debe ejecutarse manualmente desde local con `--env-file=.env.prod-temp`, **no** está integrado en el build de Vercel. Ver `JOURNAL.md` para el episodio de drift histórico.
- **Variables de entorno en Vercel:** configuradas manualmente desde el dashboard. Las críticas son `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `UPLOADTHING_TOKEN`/`SECRET`, `UPSTASH_REDIS_REST_URL`/`TOKEN`.
- **Procedimiento para tocar prod desde local:**
  1. Crear `.env.prod-temp` (gitignored por patrón `.env*`).
  2. Verificar host con `node --env-file=.env.prod-temp -e "..."` antes de cualquier escritura.
  3. Ejecutar script.
  4. **Borrar el archivo** (`Remove-Item .env.prod-temp`).
  5. Considerar rotar la password de Neon si la URL pasó por chat/script.

### 9.8 Documentación complementaria

- **`CLAUDE.md`** — cheatsheet operativa para Claude Code y desarrolladores. Auto-cargado en sesiones nuevas.
- **`JOURNAL.md`** — historia cronológica con fechas y commits. Útil para entender por qué hay drift histórico.
- **`README.md`** — (a futuro) onboarding para humanos nuevos al proyecto. Por ahora `CLAUDE.md` cumple esa función.

---

*Documento mantenido manualmente. Actualizar al cerrar cada fase.*
