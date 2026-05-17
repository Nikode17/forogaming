# JOURNAL.md — Historia del proyecto

Registro cronológico de fases, decisiones y eventos importantes. Útil para entender el "por qué" de las cosas que ya están construidas.

---

## 2026-05-17 — Fase 2: modales auth + cleanup docs

**Commits:** `73feef8` (Fase 2), `1440afb` (cleanup seed)

- Sistema de modales auth (login/register) que se abre desde la navbar, GuestCTA, FollowButton, VoteButtons y CommentForm. Las rutas `/login` y `/register` siguen accesibles como páginas standalone (necesarias para shareable links y redirect 401).
- Patrón `embedded?` en `LoginForm`/`RegisterForm`: un solo componente sirve para página standalone (chrome propio) y modal (chrome del modal).
- `AuthModalContext` con `openLogin / openRegister / close / switchMode`.
- Restauración de focus al cerrar modal (a11y). Body scroll lock, ESC, click backdrop.
- Cleanup: borrado del script one-off `seed-prod-real-posts.js` (ya cumplió su función).
- Generación de `CLAUDE.md`, `JOURNAL.md`, actualización de `SDD.md` para que sesiones futuras tengan contexto fresco.

---

## 2026-05-17 — Vinculación posts ↔ juegos en producción

**Operación directa en Neon (sin commit en repo)**

- Los 4 posts del seed inicial estaban con `game_id = NULL` → el filtro por juego de la sidebar no encontraba nada.
- Creados 2 juegos faltantes en `games`: `silent-hill-2-remake` y `persona-5-royal` (Elden Ring y Hollow Knight ya existían).
- UPDATE idempotente de los 4 posts con `WHERE game_id IS NULL`.
- Cover URLs verificadas con HEAD antes de INSERT (Steam CDN `library_600x900.jpg`).
- Script `link-posts-to-games.js` ejecutado y borrado tras éxito (one-off).

---

## 2026-05-17 — Migración masiva a producción

**Operación directa en Neon (sin commit en repo)**

Bug crítico detectado: `user_blocks` no existía en prod, rompía `/api/friends/pending`, `/api/messages/unread`, etc., con 500.

**Causa:** las migraciones 002, 003, 004 nunca se aplicaron a prod. Solo 001 (original) + 005 + 006 (aplicadas a mano en Neon SQL editor para Fase 4b).

**Solución sin destruir nada:**

1. Crear `schema_migrations` en prod (no existía — todas las migraciones previas habían sido manuales).
2. Pre-insertar 001, 005, 006 en `schema_migrations` (marcarlas como aplicadas sin re-ejecutar — 001 sin `IF NOT EXISTS` habría petado al re-aplicar).
3. Correr el runner — aplicó solo las 3 pendientes (002, 003, 004) que son idempotentes.

**Lección apuntada en CLAUDE.md:** historiar drift entre schema_migrations y disco, y verificar siempre antes de correr el runner contra prod.

---

## 2026-05-17 — Fase 1: Sidebar persistente + filtros URL

**Commit:** `60b331b`

- `Sidebar.tsx` reescrita completa: client component con búsqueda con debounce 300ms (manipula `?q`), sort tabs (`?sort=new/top/trending`), filtros categoría (`?category=...`) y juego (`?game=<slug>`), colapsable 280px ↔ 56px con persistencia `localStorage`, overlay mobile via `SidebarContext`.
- `Navbar.tsx`: botón hamburguesa `<lg`.
- `page.tsx`: eliminados HeroCarousel, GamesStrip, trending bar duplicada. Layout `flex` sidebar+feed con max-w-3xl central. Lee searchParams completos y los propaga.
- `PostsQuerySchema` extendido con `q`. Endpoint añade `WHERE title ILIKE %q% OR body ILIKE %q%`.

---

## 2026-05-16 — Seed de 4 posts reales en producción

**Operación directa en Neon (sin commit en repo)**

- Creado usuario GuideMaster + 4 posts variados (Malenia/Elden Ring, Hollow Knight, Silent Hill 2, JRPG/Persona). Contenido real, no placeholder.
- Imágenes desde Steam CDN (header.jpg + library_hero.jpg para algunos), verificadas con HEAD antes de INSERT.
- Posts con `created_at` desfasado para variedad temporal en el feed.
- Script `seed-prod-real-posts.js` ejecutado y borrado tras éxito.

---

## 2026-05-15 — Fases 3, 4a, 4b: multi-imagen + bloqueos + reportes + SSR-auth

**Commit:** `818a022` (bundle)

### Fase 3 — Multi-imagen en posts

- Reutilizar `post_media` existente (no crear `post_images` paralela).
- `<PostGallery />` con flechas, contador `X/N`, teclado, swipe táctil, no-cycling, dots, lightbox click-to-open.
- `<PostLightbox />` full-screen con scroll lock, ESC, navegación entre imágenes.
- `<ImageGalleryEditor />` con drag-drop via `@dnd-kit/sortable`, max 10 imágenes, validación cliente, thumbnails con badge "Portada".
- Endpoints: `GET /api/posts/[id]` añade campo `images` filtrado; `GET /api/posts` añade `thumbnail_url` via LATERAL JOIN.
- Uploadthing `postImageUploader`: 8MB→4MB, 4→10 archivos.

### Fase 4a — Bloqueos bidireccionales

- Tabla `user_blocks (blocker_id, blocked_id)` con CHECK no-self, UNIQUE.
- `src/lib/blocks.ts` exporta `excludeBlockedSql()` y `getBlockRelation()`.
- Endpoints `POST/DELETE /api/users/[username]/block`, `GET /api/users/me/blocks`.
- Bloqueo cascadea: borra `friend_requests` en la misma transacción.
- Filtros aplicados en: posts (feed, search, trending, detalle), users (perfil, search), comments, messages, friends, follow.
- `<BlockButton />` y `<UserActionsMenu />` integrados en PostCard, post detail, CommentTree.
- Página `/settings/blocked` con lista paginada + botón desbloquear.

### Fase 4b — Sistema de reportes

- Migraciones 005 (ALTER TYPE add `'message'`) y 006 (columnas `description`, `resolved_at`, `resolved_by`, `updated_at` + índices).
- 4 target types: post, comment, user, message.
- `<ReportModal />` con motivo (enum cerrado) + descripción opcional.
- Anti-spam: ventana de 24h por (reporter, target).
- Rate limit: 20 reportes/h por usuario.
- Validación: no auto-reportes, only-receiver para mensajes.
- Panel `/admin/reports` refrescado: filtros por status × target_type, `<TargetDetailsView />` por tipo, 3 acciones (dismiss / remove_content / ban_user) con `<ConfirmDialog />`.
- Endpoint nuevo `POST /api/admin/reports/[id]/resolve` reemplaza el PUT viejo (que tenía bug latente referenciando `updated_at` inexistente).

### Fix SSR-auth

- **Bug crítico descubierto:** Server Components hacían `fetch()` sin pasar el JWT del usuario → endpoints siempre los trataban como guest → filtros de bloqueo no funcionaban en la home.
- **Causa raíz:** la cookie `fg_refresh_token` tenía `Path=/api/auth`, por lo que el navegador no la enviaba a páginas como `/user/bob`.
- **Solución:** cambiar `Path=/api/auth` → `Path=/` en login, register, refresh, logout.
- **Helper:** `src/lib/server-auth.ts` con `getServerAuth()` (memoizado con `React.cache()`) y `serverApiFetch()` que inyecta Authorization en fetches SSR + fuerza `cache: 'no-store'` cuando hay sesión.
- Aplicado a `page.tsx`, `user/[username]/page.tsx`, `post/[id]/page.tsx`, `search/page.tsx`. Otros (`game/[slug]`, `category/[type]`, `games`) quedan como deuda.

---

## 2026-05-04 — Fixes pre-Fase 3

**Commits:** `1637602`, `67d421c`, `3c16d48`, `7afb105`

- Fix submit post: API devolvía `{ data }` pero frontend leía `{ post }`.
- Fix post detail: wrapper mismatch + field `media_type` vs `type`.
- CSP `img-src` añadió `blob:` para previews de URL.createObjectURL.
- Rate limiter con circuit breaker (si Upstash falla, fallback a memoria 60s).
- Rebrand Forogaming → Respawn, footer, páginas legales (privacidad, términos).

---

## Anterior a 2026-05-04

Construcción inicial. Hitos extraídos de git log:

- **2026-04-29:** Homepage redesign (stats, games strip, guest CTA, real carousel)
- **2026-04-27:** Online presence (revertido).
- **2026-04-26:** ChatWidget popup (estilo Facebook).
- **2026-04-23:** Perfil de usuario rediseñado (cover gradient, stat cards, tabs).
- **2026-04-22:** IGDB integration, Uploadthing, follow, messages, friends.
- **2026-04-21:** Friend request system con search modal y badge en navbar.
- **2026-04-08:** Versión inicial del SDD.md, schema base, scaffolding Next.js + Postgres + Tailwind.

---

## Convenciones para añadir entradas

- Encabezado: **fecha — descripción corta**.
- Mencionar commit(s) si aplica, o "Operación directa" si fue manual sin commit.
- Cuerpo: qué se hizo, por qué (causa), y cualquier gotcha apuntado.
- Mantener orden cronológico inverso (más reciente arriba).
