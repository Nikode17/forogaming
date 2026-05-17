# CLAUDE.md — Contexto para sesiones de Claude Code

Este documento se carga automáticamente al arrancar Claude Code en este repo. Mantiene contexto mínimo para que cualquier sesión nueva pueda trabajar sin re-explicar.

**Última actualización:** 2026-05-17 (post-Fase 2)
**Estado del proyecto:** Producción funcional en https://forogaming.vercel.app

---

## Stack

- **Next.js 16** (App Router, Server + Client Components, Turbopack)
- **TypeScript** estricto
- **PostgreSQL** en **Neon** (producción) + local opcional para dev
- **Tailwind CSS** (dark mode hardcoded — toda la UI es dark, sin theme toggle)
- **JWT** con `jose` — access token 15 min + refresh token httpOnly 7 días
- **bcryptjs** para passwords
- **Uploadthing** para imágenes (avatars, post media)
- **Upstash Redis** para rate limiting (con fallback a memoria via circuit breaker)
- **IGDB** API para catálogo de juegos
- Deploy en **Vercel** con auto-deploy desde `master`

---

## Comandos clave

```bash
npm run dev              # dev server (Turbopack)
npm run build            # build de producción
npm run lint             # eslint
npx tsc --noEmit         # type check (SIEMPRE antes de commit)
npm run db:migrate       # ejecuta migraciones pendientes

# Con env file específico:
node --env-file=.env.local scripts/migrate.js
```

---

## Estructura del repo

```
migrations/              # SQL versionado, naming NNN_descripcion.sql
  001_initial_schema.sql
  002_friends_messages.sql
  003_user_blocks.sql
  004_follows.sql
  005_reports_add_message_target.sql
  006_reports_columns_indexes.sql

scripts/
  migrate.js             # runner idempotente con tabla schema_migrations
  generate-*.js          # scripts de generación de PDFs (one-off, no se ejecutan en CI)
  db-list-posts.js       # utility de auditoría

src/app/
  api/                   # endpoints
  (auth)/login           # página standalone (también accesible vía modal)
  (auth)/register        # idem
  admin/                 # panel admin (users, reports, games)
  post/[id]              # detalle de post
  user/[username]        # perfil
  category/[type]        # feed filtrado por categoría
  game/[slug]            # feed filtrado por juego
  search                 # búsqueda global
  submit                 # crear post
  settings/blocked       # lista de usuarios bloqueados
  messages, friends, games, ...

src/components/          # componentes React (mezcla server/client)
src/contexts/
  AuthContext.tsx        # user, accessToken, login/logout/register
  AuthModalContext.tsx   # mode 'login'|'register'|null
  SidebarContext.tsx     # mobileOpen para responsive

src/lib/
  auth.ts                # JWT sign/verify, REFRESH_TOKEN_COOKIE
  blocks.ts              # excludeBlockedSql, getBlockRelation
  db.ts                  # pool Postgres + query() + withTransaction()
  ratelimit.ts           # Upstash + memoria fallback + circuit breaker
  sanitize.ts            # XSS sanitization (HTML allowlist, sin jsdom)
  server-auth.ts         # getServerAuth(), serverApiFetch() para SSR autenticado
  uploadthing.ts         # cliente hook
  validation.ts          # schemas Zod
```

---

## Convenciones críticas

### Auth en Server Components

**NUNCA** uses `fetch()` directo en un Server Component que necesite contexto de usuario. Usa `serverApiFetch()` de `src/lib/server-auth.ts`. Lee el refresh token (cookie httpOnly) y emite un access token efímero para inyectarlo como `Authorization: Bearer` en el fetch interno.

```ts
import { serverApiFetch } from '@/lib/server-auth'
const data = await serverApiFetch<MyType>(`/api/...`)
```

Cuando el viewer es guest, `serverApiFetch` actúa como anónimo (sin Authorization). El endpoint debe manejar ambos casos.

### Migraciones

- Toda migración nueva: idempotente (`IF NOT EXISTS` en tablas, índices, columnas).
- `ALTER TYPE ... ADD VALUE` debe ir en migración **separada** (Postgres no permite usar el valor en la misma tx donde se añadió).
- El runner (`scripts/migrate.js`) usa la tabla `schema_migrations` y aplica solo lo pendiente.
- **Históricamente** se aplicaron migraciones directamente en Neon SQL editor (002_last_seen, 005, 006). Eso dejó drift entre `schema_migrations` y disco. Si te encuentras drift: pre-insertar las "ya aplicadas" en `schema_migrations` antes de correr el runner. Ver el episodio del 17/05/2026 en JOURNAL.md.

### Bloqueos bidireccionales

Tabla `user_blocks (blocker_id, blocked_id)`. Filtrado en endpoints con `excludeBlockedSql('p.author_id', '$N')` de `src/lib/blocks.ts`. Cuando A bloquea a B en `POST /api/users/[username]/block`, en la **misma transacción** se borran las filas de `friend_requests` (decisión: el bloqueo elimina la amistad).

Convenciones según el contexto:
- **Listados** (feed, búsqueda, etc.): filtrar con `excludeBlockedSql` en el SQL.
- **Detalle** (`GET /api/posts/[id]`, mensajes): 404 si hay relación de bloqueo bidireccional.
- **Acciones** (comentar, votar, seguir, mensajear): 403 si hay bloqueo.
- **Perfil de usuario**: 404 si te bloqueó él; perfil reducido con `viewer_blocked_them=true` si tú le bloqueaste (para que el frontend muestre el botón "Desbloquear").

### Comentarios bloqueados

El SQL filtra `c.author_id NOT IN (blocked)`. Los replies cuyo ancestro era de un bloqueado quedan huérfanos en `flat[]` y `buildTree` los descarta silenciosamente. Esto implementa la decisión "ocultar subárbol completo" sin código adicional en JS.

### Modales auth (login/register)

`AuthModalContext` controla `mode: 'login'|'register'|null`. Los **botones inline** de auth (Navbar guest, GuestCTA, FollowButton sin sesión, VoteButtons sin sesión, CommentForm sin sesión) llaman a `openLogin()`/`openRegister()`. Las **redirecciones automáticas** (`useEffect → router.push('/login')`) siguen mandando a la página standalone — esto es intencional, no lo cambies.

`LoginForm` y `RegisterForm` aceptan `embedded?: boolean`. Páginas standalone los usan sin `embedded` (con chrome propio); el modal los usa con `embedded` (chrome del modal).

### CSP `img-src`

Restrictivo. Solo permite estos hosts externos:
- `i.imgur.com`
- `cdn.akamai.steamstatic.com`, `cdn.cloudflare.steamstatic.com`, `shared.akamai.steamstatic.com`
- `*.ufs.sh`, `utfs.io` (Uploadthing)
- `images.igdb.com`
- `data:`, `blob:` (locales)

Si necesitas otro dominio: ampliar `next.config.ts` línea ~46. La tabla `post_media.url` acepta cualquier URL HTTPS (validación API solo verifica protocolo), pero el navegador rechaza si no está en CSP.

### Refresh token cookie

`fg_refresh_token` con `Path=/`. **No** restringir a `/api/auth/` — eso rompió el SSR-auth en su día. Si tocas `setRefreshCookie` / `clearRefreshCookie` en login, register, refresh, logout: mantén `Path=/`.

---

## Comandos de auditoría útiles

```bash
# Comprobar estado de migraciones aplicadas vs disco
node --env-file=.env.local -e "
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
  await c.connect();
  const r = await c.query('SELECT filename FROM schema_migrations ORDER BY filename');
  console.table(r.rows);
  await c.end();
})();
"

# Listar tablas
node --env-file=.env.local -e "
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
  await c.connect();
  const r = await c.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name\");
  console.table(r.rows);
  await c.end();
})();
"
```

---

## Producción (Neon + Vercel)

- **DB host:** `ep-steep-voice-abhfz87a.eu-west-2.aws.neon.tech` (Neon, eu-west-2)
- **URL pública:** https://forogaming.vercel.app
- **Auto-deploy:** push a `master` → Vercel builda y despliega (2-3 min)
- **Env vars en Vercel:** DATABASE_URL, JWT_SECRET, UPLOADTHING_*, NEXT_PUBLIC_APP_URL, etc. Si añades una nueva, configurarla en Vercel manualmente (no se sincroniza desde `.env.local`).

**Para conectar a prod desde local:** crear `.env.prod-temp` con DATABASE_URL de Neon, ejecutar con `--env-file=.env.prod-temp`, **borrarlo al terminar** (`Remove-Item .env.prod-temp`). El `.gitignore` ya cubre el patrón `.env*`. NO trabajes contra prod sin hacer host check primero:

```bash
node --env-file=.env.prod-temp -e "
const url = process.env.DATABASE_URL
const host = new URL(url).host.split(':')[0]
console.log('Host:', host)
"
```

---

## Modelo de datos (resumen)

Ver `SDD.md` para diagrama ER completo. Tablas principales:

- `users` (auth + perfil)
- `posts` + `post_media` + `post_steps` (multi-imagen + guías)
- `comments` (anidados via `parent_id`)
- `votes` (post|comment, value 1|-1, PK compuesta)
- `likes`, `favorites`
- `games` (catálogo IGDB)
- `friend_requests` (estados pending/accepted/rejected)
- `direct_messages` (chat 1-a-1)
- `user_blocks` (bidireccional)
- `follows` (PK compuesta follower_id+following_id)
- `reports` (target_type post|comment|user|message, status pending|resolved|dismissed)
- `revoked_tokens`, `schema_migrations`

---

## Gotchas conocidos

1. **SSR sin auth → ya resuelto** con `serverApiFetch`. Si ves un endpoint nuevo que necesita JWT y se llama desde Server Component, asegúrate de usar el helper.
2. **CSP bloquea imágenes externas no listadas.** Ver sección "CSP img-src".
3. **`/login` y `/register`** son páginas standalone Y se abren como modal. NO eliminar las páginas.
4. **Las redirecciones `router.push('/login')` desde `useEffect`** son intencionales (no las cambies a `openLogin()`).
5. **Migración 002 fantasma:** prod tuvo durante semanas `friend_requests` y `direct_messages` creadas a mano sin migración versionada. La 002 actual reconstruye el shape exacto idempotente, pero si encuentras drift histórico revisa JOURNAL.md.
6. **`MOVED .env.prod-temp accidentally to src/components/`** — pasó una vez. Si el `--env-file` da "not found", verifica que el archivo está en la raíz.

---

## Comandos prohibidos sin permiso explícito

- `git push --force` (cualquier rama)
- `git reset --hard` con upstream
- `rm -rf` sobre directorios trackeados
- Ejecutar SQL destructivo (`DROP`, `DELETE FROM users`) contra **prod** sin host check + confirmación.
- Tocar migraciones ya aplicadas (siempre crear una nueva, nunca editar las antiguas).
