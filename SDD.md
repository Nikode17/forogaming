# Software Design Document (SDD)
## Foro de Videojuegos — Guías, Easter Eggs & Reviews

**Versión:** 0.1.0  
**Estado:** Concepto / Pre-desarrollo  
**Audiencia:** Claude Code / Equipo de desarrollo  
**Última actualización:** 2026-04-08  

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

*Documento generado para uso en desarrollo. Actualizar conforme avance el proyecto.*
