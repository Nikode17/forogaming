#!/usr/bin/env python3
"""Genera .tmp-nuevas-secciones.json con el contenido textual de las secciones
que faltan en la entrega parcial.

Estructura de cada sección: lista de bloques tipados.
  - {"kind": "h1"|"h2"|"h3"|"h4", "text": ...}
  - {"kind": "p", "text": ...}
  - {"kind": "p_italic", "text": ...}
  - {"kind": "p_small_center", "text": ...}  -> Calibri 9.5 centrado (notas figura)
  - {"kind": "li", "text": ...}              -> bullet list
  - {"kind": "li_num", "text": ...}          -> numbered list
  - {"kind": "code", "text": ...}            -> monospace block
  - {"kind": "review", "text": ...}          -> placeholder [REVISAR: ...]
"""

import json
from pathlib import Path

OUT = Path(__file__).parent.parent / ".tmp-nuevas-secciones.json"


# ─────────────────────────────────────────────────────────────────────────────
# DISEÑO — completar (Diagrama secuencia post + Prototipo)
# ─────────────────────────────────────────────────────────────────────────────
diseno_completar = [
    {"kind": "h4", "text": "Figura 6"},
    {"kind": "p_italic", "text": "Diagrama de secuencia — Creación de un nuevo post"},
    {"kind": "p_small_center", "text": "Las líneas discontinuas representan mensajes de respuesta."},
    {"kind": "review", "text": "REVISAR: insertar Figura 6 (diagrama UML de secuencia generado con herramienta gráfica)."},
    {"kind": "p", "text": "El flujo se inicia cuando el cliente envía una petición POST al endpoint /api/posts incluyendo en la cabecera Authorization el access token obtenido durante el inicio de sesión. El middleware o proxy de Next.js intercepta la petición, valida el token mediante la función verifyAccessToken de src/lib/auth.ts y, en caso de éxito, inyecta las cabeceras x-user-id, x-user-role y x-user-username que serán consumidas por el handler del endpoint."},
    {"kind": "p", "text": "A continuación, el handler aplica el rate limiter rateLimitPostCreate, que limita la creación a diez posts por usuario y hora, recurriendo a Upstash Redis cuando está disponible y degradando de forma transparente a un mapa en memoria si el servicio externo no responde. Superado este filtro, el cuerpo de la petición se valida con el esquema CreatePostSchema definido en src/lib/validation.ts, que verifica la longitud del título, el cuerpo, la categoría y la lista de imágenes asociadas, con un límite de diez imágenes por post."},
    {"kind": "p", "text": "Una vez validados los datos, el contenido HTML se sanitiza con la función sanitizePostBody, que aplica una lista de etiquetas permitidas y elimina cualquier atributo de evento JavaScript. La inserción en la base de datos se realiza dentro de una transacción que ejecuta de forma atómica el INSERT en la tabla posts y, en caso de existir imágenes, los INSERT correspondientes en post_media con la posición ordinal de cada imagen, así como los INSERT en post_steps cuando el post pertenece a la categoría guide. Finalmente, el endpoint responde con un código 201 y el objeto del post recién creado, momento en el que el cliente redirige al usuario a la URL del nuevo recurso."},

    {"kind": "h2", "text": "Prototipo"},
    {"kind": "p", "text": "El prototipo visual de Respawn se ha concebido desde el inicio como una interfaz en modo oscuro hardcoded, sin posibilidad de alternancia entre temas claros y oscuros en esta primera versión. Esta decisión de diseño responde a las preferencias mayoritarias de la comunidad gamer, donde sesiones prolongadas frente a la pantalla hacen del modo oscuro la opción más cómoda visualmente, y simplifica la base de código al evitar la duplicación de variables de color y la gestión del estado del tema."},
    {"kind": "p", "text": "La estructura general de la interfaz se articula en torno a tres regiones principales. En la parte superior se sitúa una barra de navegación compacta que contiene el logotipo, un campo de búsqueda global y los controles de sesión. A la izquierda, una sidebar persistente colapsable —que alterna entre 280 y 56 píxeles de ancho mediante persistencia en localStorage— ofrece búsqueda con debounce de 300 milisegundos, pestañas de ordenación (nuevo, top, trending) y filtros por categoría y videojuego, todos ellos manipulando query params de la URL para garantizar que los enlaces sean compartibles. La zona central, con un ancho máximo de 720 píxeles, aloja el feed de posts. En pantallas inferiores a 1024 píxeles la sidebar se oculta y se sustituye por un botón hamburguesa que abre un overlay modal."},
    {"kind": "p", "text": "El sistema de autenticación se ha materializado mediante modales superpuestos a la página actual, evitando que el usuario pierda el contexto de navegación al iniciar sesión o registrarse. Las rutas /login y /register se mantienen accesibles directamente para soportar enlaces compartibles y redirecciones desde respuestas 401, reutilizando los mismos componentes LoginForm y RegisterForm tanto en página standalone como dentro del modal mediante la prop embedded. El componente clave del feed es PostCard, que muestra la primera imagen del post como miniatura, el título, los metadatos del autor con un menú de tres puntos (UserActionsMenu) para bloquear, reportar o copiar el enlace al perfil, y los contadores de votos, comentarios y vistas."},
]


# ─────────────────────────────────────────────────────────────────────────────
# IMPLEMENTACIÓN
# ─────────────────────────────────────────────────────────────────────────────
implementacion = [
    {"kind": "h1", "text": "IMPLEMENTACIÓN"},
    {"kind": "p", "text": "En este apartado se documenta la implementación efectiva del sistema Respawn, organizada en torno a los grandes bloques funcionales que estructuran la aplicación. El objetivo no consiste en reproducir exhaustivamente cada línea de código, sino en explicar las decisiones técnicas adoptadas y los patrones aplicados, con referencias concretas a los archivos del repositorio para facilitar la trazabilidad."},

    {"kind": "h2", "text": "Estructura general del proyecto"},
    {"kind": "p", "text": "El repositorio se organiza siguiendo las convenciones del App Router de Next.js 16.2.3. El directorio src/app/ contiene tanto las rutas accesibles públicamente como los endpoints de la API REST, organizados respectivamente bajo src/app/[ruta]/page.tsx y src/app/api/[ruta]/route.ts. Esta colocación conjunta de páginas y endpoints en un mismo árbol simplifica la trazabilidad entre interfaz y backend, y elimina la necesidad de mantener dos proyectos separados."},
    {"kind": "p", "text": "Bajo src/components/ residen los veintisiete componentes React reutilizables, entre los que destacan Sidebar, PostCard, PostGallery, CommentTree, ChatWidget, AuthModal, ReportModal y UserActionsMenu. La lógica transversal —autenticación, acceso a base de datos, validación, sanitización, rate limiting— se concentra en src/lib/, mientras que los tres contextos de cliente (AuthContext, AuthModalContext y SidebarContext) viven en src/contexts/. Las interfaces TypeScript se centralizan en src/types/index.ts."},
    {"kind": "p", "text": "El directorio migrations/ alberga seis archivos SQL versionados (001 a 006) que recogen la evolución incremental del esquema de base de datos. El runner scripts/migrate.js aplica únicamente las migraciones pendientes mediante una tabla schema_migrations que actúa como registro de las ya ejecutadas, garantizando que cada migración se aplique una sola vez y en orden. Junto al runner conviven utilidades de auditoría como db-list-posts.js."},

    {"kind": "h2", "text": "Sistema de autenticación"},
    {"kind": "p", "text": "El sistema de autenticación se construye sobre la librería jose para la firma y verificación de tokens JWT, y bcryptjs para el hash de contraseñas. Los access tokens se firman con el algoritmo HMAC-SHA256, una clave secreta de al menos treinta y dos caracteres y una validez de quince minutos. Los refresh tokens, también JWT, tienen una validez de siete días y se almacenan exclusivamente como cookies httpOnly con el atributo Path=/, lo que impide su lectura desde JavaScript del cliente y garantiza su envío automático a todas las rutas del sitio."},
    {"kind": "p", "text": "El flujo de inicio de sesión, registro y refresco se gestiona desde los endpoints /api/auth/login, /api/auth/register, /api/auth/refresh y /api/auth/logout. El logout no solo elimina la cookie del cliente, sino que registra el identificador jti del refresh token en la tabla revoked_tokens para invalidarlo de forma permanente, evitando su reutilización mediante secuestro de cookie."},
    {"kind": "p", "text": "Una decisión arquitectónica relevante ha sido el desarrollo del helper serverApiFetch, ubicado en src/lib/server-auth.ts. Los Server Components de Next.js no disponen del access token almacenado en memoria del cliente, lo que implica que cualquier petición SSR a la API REST se realizaría sin credenciales y sería tratada como anónima. Para resolver esta limitación, el helper getServerAuth lee la cookie de refresh token desde el lado del servidor, la valida, comprueba que no esté revocada y emite un access token efímero de uso exclusivo para el render actual. El resultado se memoriza con React.cache para deduplicar consultas dentro del mismo renderizado."},
    {"kind": "p", "text": "La interfaz de autenticación se ha resuelto mediante el patrón de componentes embebibles: LoginForm y RegisterForm aceptan una prop embedded?: boolean que determina si renderizan su propio chrome (modo página standalone) o se integran dentro del chrome del modal. AuthModalContext expone los métodos openLogin, openRegister, close y switchMode, permitiendo que las interacciones inline que requieren sesión (votar, comentar, seguir) abran el modal sin perder el contexto de navegación. Las redirecciones automáticas desde rutas protegidas (router.push a /login en /submit, /friends, /settings y /messages) se mantienen apuntando a la página standalone, comportamiento intencional para preservar la posibilidad de compartir enlaces."},

    {"kind": "h2", "text": "Capa de datos"},
    {"kind": "p", "text": "La capa de datos se apoya en PostgreSQL 16 desplegado en Neon, un servicio serverless con replicación gestionada y plan gratuito generoso para proyectos académicos. La conexión se realiza con el driver pg de Node.js, configurado con un pool de hasta diez conexiones simultáneas para respetar los límites del plan gratuito sin comprometer el rendimiento en operaciones de lectura concurrentes. El módulo src/lib/db.ts expone las funciones query y withTransaction, esta última empleada en cualquier operación que afecte a más de una tabla."},
    {"kind": "p", "text": "El modelo de datos comprende dieciséis tablas que cubren todas las áreas funcionales del sistema: users, games, posts, post_media, post_steps, comments, votes, likes, favorites, friend_requests, direct_messages, follows, user_blocks, reports, revoked_tokens y schema_migrations. Las relaciones se establecen mediante claves foráneas con políticas explícitas de ON DELETE: CASCADE en las dependencias estructurales (eliminar un post borra sus comentarios, medios y pasos) y SET NULL en las dependencias autorales (eliminar un usuario preserva sus posts huérfanos en lugar de borrarlos)."},
    {"kind": "p", "text": "El sistema de migraciones es uno de los componentes que ha requerido mayor atención durante el desarrollo. El runner scripts/migrate.js escanea el directorio migrations/, consulta la tabla schema_migrations para determinar qué archivos están pendientes y los aplica en orden alfabético, cada uno dentro de su propia transacción. Todas las migraciones se han diseñado idempotentes mediante cláusulas IF NOT EXISTS en tablas, índices y columnas, lo que permite re-ejecutarlas sin riesgo. Durante el desarrollo se detectó un drift entre disco y producción, debido a que algunas migraciones (002 last_seen, 005 y 006 de reportes) se habían aplicado manualmente desde el editor SQL de Neon antes de existir el runner; la reconciliación se resolvió pre-insertando esos nombres de archivo en schema_migrations antes de ejecutar el runner sobre prod."},

    {"kind": "h2", "text": "Sistema de posts y comentarios"},
    {"kind": "p", "text": "El sistema de posts soporta hasta diez imágenes por publicación, almacenadas en Uploadthing y referenciadas desde la tabla post_media con una columna position que determina su orden. La carga se gestiona desde el componente ImageGalleryEditor, que integra @dnd-kit/sortable para permitir reordenar las imágenes mediante drag and drop antes de publicar, con validación en cliente que bloquea el botón de añadir cuando se alcanza el límite. La visualización en el detalle del post se delega en dos componentes especializados: PostGallery muestra la imagen actual con flechas de navegación, indicadores tipo dots y soporte de gestos de swipe en dispositivos táctiles; PostLightbox abre la galería en pantalla completa al hacer clic, bloqueando el scroll del documento y respondiendo a la tecla Escape para cerrarse."},
    {"kind": "p", "text": "Los comentarios se modelan como una lista de adyacencia, donde cada fila de la tabla comments referencia opcionalmente a su comentario padre mediante la columna parent_id. La construcción del árbol jerárquico se realiza en JavaScript en el endpoint /api/posts/[id]/comments mediante la función buildTree, que recorre la lista plana ordenada cronológicamente y conecta cada nodo con su padre. Cuando un autor está bloqueado, el filtro SQL excluye su comentario de la respuesta y los descendientes de ese comentario quedan automáticamente huérfanos en la lista plana, siendo descartados por buildTree —lo que implementa de forma natural y sin código adicional la política de ocultar el subárbol completo de cualquier comentario bloqueado."},
    {"kind": "p", "text": "El sistema de votación emplea una tabla votes con clave primaria compuesta sobre user_id, target_type y target_id, lo que garantiza un único voto por usuario y elemento, ya sea un post o un comentario. El campo target_type actúa como discriminador polimórfico (post o comment) mientras que target_id apunta indistintamente al identificador del post o del comentario votado. Esta misma estructura polimórfica se reutiliza en la tabla likes y, con cuatro target_types posibles, en reports."},
    {"kind": "p", "text": "Para evitar consultas costosas en el cálculo del ranking de trending, se ha creado la vista SQL post_scores que precalcula upvotes, downvotes, net_votes y trending_score por post. El endpoint /api/posts/trending consulta esta vista en una única operación, sin necesidad de subconsultas agregadas en tiempo real, lo que mantiene los tiempos de respuesta dentro del objetivo de quinientos milisegundos."},

    {"kind": "h2", "text": "Sistema de interacciones sociales"},
    {"kind": "p", "text": "El módulo de amistades se apoya en la tabla friend_requests, que registra el remitente, el destinatario, un estado enumerado (pending, accepted, rejected) y la fecha de creación. La aceptación es bidireccional: al cambiar el estado a accepted ambos usuarios son amigos sin necesidad de duplicar filas. El listado de amigos se obtiene mediante una consulta que resuelve el usuario contrario en función de la dirección de la solicitud aceptada."},
    {"kind": "p", "text": "La mensajería directa se ha implementado con la tabla direct_messages, que almacena el emisor, el receptor, el cuerpo (con restricción CHECK de hasta dos mil caracteres) y un campo read_at nullable que se actualiza cuando el destinatario abre la conversación. La actualización en cliente se realiza por polling HTTP cada quince segundos desde el componente ChatWidget, una solución más sencilla que la implementación de un canal WebSocket pero suficiente para el volumen previsto en esta primera versión."},
    {"kind": "p", "text": "El sistema de bloqueos, añadido en una fase posterior al planteamiento inicial, se ha modelado mediante la tabla user_blocks con clave única sobre (blocker_id, blocked_id) y restricción CHECK que impide el auto-bloqueo. El módulo src/lib/blocks.ts expone la función excludeBlockedSql, que devuelve un fragmento SQL parametrizable NOT IN (SELECT … UNION SELECT …) reutilizable en cualquier consulta. Este patrón se aplica de forma uniforme en los endpoints de feed, búsqueda, trending, listado de mensajes, solicitudes de amistad y resultados de búsqueda de usuarios. En los endpoints de detalle (post individual, hilo de mensajes, perfil de usuario) se utiliza el helper getBlockRelation para devolver 404 cuando existe relación de bloqueo bidireccional, evitando filtraciones sobre la existencia del recurso. El bloqueo elimina, dentro de la misma transacción, cualquier solicitud o amistad existente entre ambos usuarios."},

    {"kind": "h2", "text": "Sistema de moderación"},
    {"kind": "p", "text": "La moderación se articula en torno a la tabla reports, que admite cuatro tipos de target (post, comment, user, message) mediante un ENUM extendido en la migración 005. Las columnas description, resolved_at, resolved_by y updated_at, añadidas en la migración 006, permiten registrar contexto adicional del reporte y trazabilidad de su resolución. Los reportes se sujetan a una doble protección anti-abuso: rate limit de veinte reportes por usuario y hora, y ventana de veinticuatro horas que impide a un mismo usuario reportar dos veces el mismo elemento."},
    {"kind": "p", "text": "El panel de administración (/admin/reports) ofrece filtros combinables por estado y por tipo de target, junto con una visualización enriquecida del contenido reportado a través del componente TargetDetailsView, que adapta su presentación según el tipo. La resolución se realiza desde el endpoint POST /api/admin/reports/[id]/resolve dentro de una transacción que aplica una de tres acciones: dismiss marca el reporte como desestimado sin modificar el contenido; remove_content efectúa soft-delete del post o comentario reportado (o hard-delete del mensaje, al no disponer este de flag is_deleted); ban_user resuelve el dueño del contenido reportado y aplica is_banned = TRUE en la tabla users."},

    {"kind": "h2", "text": "Seguridad"},
    {"kind": "p", "text": "Las medidas de seguridad se han aplicado por capas. En el nivel de cabeceras HTTP, configuradas desde next.config.ts, se incluyen Content-Security-Policy con una lista blanca explícita de orígenes para imágenes (CDN de Steam, CDN de IGDB, dominios de Uploadthing) e iframes (YouTube, Vimeo), HSTS con max-age de un año, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin y Permissions-Policy desactivando cámara, micrófono, geolocalización y métodos de pago. En el nivel de aplicación, todos los endpoints validan su entrada con esquemas Zod y emplean consultas parametrizadas en lugar de concatenación de cadenas SQL."},
    {"kind": "p", "text": "El rate limiter, definido en src/lib/ratelimit.ts, encapsula un patrón de circuit breaker: si el cliente de Upstash Redis falla por cualquier motivo —error de red, token expirado, base de datos eliminada por inactividad en el plan gratuito— el sistema abre el circuito durante sesenta segundos y degrada de forma transparente a un mapa en memoria, evitando que un endpoint quede inaccesible por una caída del servicio externo. La sanitización de HTML enriquecido se realiza con una implementación propia en src/lib/sanitize.ts, basada en una lista blanca de etiquetas y atributos, que evita la dependencia de jsdom para no incurrir en incompatibilidades ESM con Turbopack."},

    {"kind": "h2", "text": "Despliegue"},
    {"kind": "p", "text": "El despliegue se realiza en Vercel, plataforma que ofrece soporte nativo de primer nivel para Next.js. La integración con GitHub está configurada para activar un deploy automático en cada push a la rama master, con un tiempo de build y publicación habitual de dos a tres minutos. Las variables de entorno sensibles (DATABASE_URL, JWT_SECRET, UPLOADTHING_TOKEN, UPSTASH_REDIS_REST_URL y otras) se gestionan desde el dashboard de Vercel y no se sincronizan automáticamente desde el archivo .env.local."},
    {"kind": "p", "text": "Las migraciones de base de datos no se ejecutan como parte del pipeline de build, sino manualmente desde la máquina del desarrollador mediante el comando node --env-file=.env.prod-temp scripts/migrate.js, donde .env.prod-temp es un archivo temporal con la cadena de conexión a Neon que se elimina inmediatamente tras la operación. Este flujo introduce fricción intencional para evitar migraciones accidentales durante un deploy y exige que toda intervención sobre el esquema de producción sea explícita."},

    {"kind": "h2", "text": "Capturas de pantalla"},
    {"kind": "p", "text": "A continuación se incluyen capturas representativas de las principales pantallas de la aplicación tal y como se presentan en producción."},
    {"kind": "h4", "text": "Figura 7"},
    {"kind": "p_italic", "text": "Pantalla de inicio con sidebar persistente y feed central"},
    {"kind": "review", "text": "REVISAR: insertar Figura 7 (captura de la home con sidebar abierta)."},
    {"kind": "h4", "text": "Figura 8"},
    {"kind": "p_italic", "text": "Modal de inicio de sesión superpuesto al contenido"},
    {"kind": "review", "text": "REVISAR: insertar Figura 8 (captura del AuthModal con LoginForm)."},
    {"kind": "h4", "text": "Figura 9"},
    {"kind": "p_italic", "text": "Vista de detalle de post con galería multi-imagen"},
    {"kind": "review", "text": "REVISAR: insertar Figura 9 (captura de post con PostGallery)."},
    {"kind": "h4", "text": "Figura 10"},
    {"kind": "p_italic", "text": "Panel de administración de reportes con filtros"},
    {"kind": "review", "text": "REVISAR: insertar Figura 10 (captura de /admin/reports)."},
    {"kind": "h4", "text": "Figura 11"},
    {"kind": "p_italic", "text": "Widget de chat flotante con conversación activa"},
    {"kind": "review", "text": "REVISAR: insertar Figura 11 (captura de ChatWidget abierto)."},
    {"kind": "h4", "text": "Figura 12"},
    {"kind": "p_italic", "text": "Editor de creación de post con galería multi-imagen reordenable"},
    {"kind": "review", "text": "REVISAR: insertar Figura 12 (captura de /submit con ImageGalleryEditor)."},
]


# ─────────────────────────────────────────────────────────────────────────────
# CONCLUSIONES
# ─────────────────────────────────────────────────────────────────────────────
conclusiones = [
    {"kind": "h1", "text": "CONCLUSIONES"},
    {"kind": "p", "text": "El desarrollo de Respawn ha permitido alcanzar la totalidad de los nueve objetivos específicos planteados en la introducción del proyecto. El sistema de autenticación con JWT y refresh tokens httpOnly funciona en producción de forma estable; el esquema de base de datos cubre las dieciséis entidades del dominio con integridad referencial completa; el sistema de posts soporta comentarios anidados, multi-imagen, votación y el algoritmo de trending; la integración con IGDB asocia los posts a videojuegos reales con sus portadas y metadatos; la mensajería directa, las amistades, el panel de administración con moderación, las cabeceras de seguridad HTTP y el despliegue cloud se encuentran operativos. La incorporación posterior del sistema de bloqueos bidireccionales y del módulo de reportes con cuatro tipos de target, no contemplados en la planificación inicial, enriquece el modelo de moderación más allá de lo previsto."},
    {"kind": "p", "text": "Entre los aprendizajes técnicos consolidados destaca la comprensión del paradigma de Server Components y Client Components introducido por App Router de Next.js 16, así como las implicaciones de ejecutar lógica de servidor sin acceso al estado de memoria del cliente. La resolución del problema del SSR no autenticado mediante el helper serverApiFetch ha supuesto una de las decisiones de diseño más relevantes del proyecto, en la medida en que define un patrón aplicable a cualquier escenario donde un Server Component necesite el contexto de sesión del visitante. De forma análoga, la gestión disciplinada de las migraciones SQL versionadas, con su tabla schema_migrations y el runner idempotente, ha demostrado ser indispensable cuando se descubrió la existencia de drift entre el esquema en producción y los archivos del repositorio."},
    {"kind": "p", "text": "En el plano del proceso de desarrollo, se ha consolidado la práctica de identificar y documentar deuda técnica de forma explícita antes que postergarla de manera informal. Cuando un fix puntual resolvía un problema visible pero ocultaba una causa más profunda —como ocurrió con el bug del SSR no autenticado, cuya causa raíz residía en el atributo Path de la cookie de refresh— se ha optado por el refactor sobre el parche superficial. Esta disciplina ha exigido en ocasiones revertir trabajo ya realizado, lo que confirma el valor de mantener cada cambio en commits atómicos y revisables. La división del trabajo en fases entregables ha permitido validar de forma iterativa el alcance real frente al planificado."},
    {"kind": "p", "text": "El proyecto presenta limitaciones reconocidas que conviene documentar con honestidad. El sistema de modales no implementa un focus trap completo —únicamente restaura el foco al elemento previamente activo al cerrarse—, lo que constituye una desviación menor respecto al cumplimiento estricto de WCAG AAA. La sidebar persistente no se ha aplicado uniformemente a todas las páginas del sitio, quedando ausente en las vistas de detalle de juego y categoría, que mantienen el layout previo. La búsqueda presenta dos puntos de entrada no unificados —el formulario de la navbar que redirige a /search y el campo en sidebar que filtra el feed actual— una redundancia consciente que merece consolidación en una versión futura. Tampoco se han incorporado tests end-to-end automatizados, confiando para esta primera versión en la validación funcional manual sobre el entorno de producción."},
]


# ─────────────────────────────────────────────────────────────────────────────
# INNOVACIÓN Y PROSPECTIVA
# ─────────────────────────────────────────────────────────────────────────────
innovacion = [
    {"kind": "h1", "text": "INNOVACIÓN Y PROSPECTIVA"},
    {"kind": "p", "text": "Este apartado recoge los elementos del proyecto que se consideran innovadores respecto al estado del arte de aplicaciones de comunidad en línea de tamaño comparable, así como las líneas de evolución que se contemplan para futuras versiones del producto."},

    {"kind": "h2", "text": "Innovación"},
    {"kind": "p", "text": "La adopción de Next.js 16 con su App Router constituye en sí misma una apuesta por un paradigma relativamente reciente —Server Components combinados con Client Components de forma granular— que difiere significativamente del modelo Single Page Application tradicional. La capacidad de mezclar renderizado en servidor y reactividad en cliente componente a componente permite optimizar simultáneamente el tiempo de primer renderizado, el SEO y la interactividad del cliente."},
    {"kind": "p", "text": "El helper serverApiFetch ubicado en src/lib/server-auth.ts representa una contribución propia del proyecto: resuelve el problema arquitectónico de la autenticación en Server Components leyendo la cookie httpOnly del lado del servidor, emitiendo un access token efímero exclusivo para el render actual y memorizando el resultado con React.cache para deduplicar llamadas dentro del mismo árbol de renderizado. Este patrón es directamente reutilizable en cualquier proyecto Next.js que combine cookies de sesión con APIs autenticadas."},
    {"kind": "p", "text": "El rate limiter desarrollado en src/lib/ratelimit.ts implementa un circuit breaker que degrada de manera transparente al fallback en memoria cuando Upstash Redis no responde, evitando que la indisponibilidad del servicio externo provoque caídas en cascada de los endpoints protegidos. Este patrón resulta especialmente valioso en entornos serverless donde la latencia de cold start y la sensibilidad a límites de plan gratuito pueden producir fallos esporádicos."},
    {"kind": "p", "text": "El sistema de bloqueos bidireccionales se ha resuelto mediante un único fragmento SQL declarativo reutilizable, excludeBlockedSql, que se compone con cualquier consulta del sistema sin necesidad de duplicar lógica de filtrado. Esta aproximación contrasta con la solución imperativa habitual —cargar el conjunto de bloqueos en memoria y filtrar tras la consulta— y aprovecha que el motor de PostgreSQL puede optimizar el plan de ejecución del NOT IN compuesto. La misma filosofía se aplica al sistema de reportes, donde la columna target_type polimórfica con cuatro valores posibles unifica el modelado de reportes sobre entidades heterogéneas."},

    {"kind": "h2", "text": "Prospectiva"},
    {"kind": "p", "text": "Las líneas de evolución prioritarias identificadas para futuras versiones son las siguientes."},
    {"kind": "li", "text": "Sustitución del polling HTTP del módulo de mensajería por una conexión WebSocket bidireccional, lo que reduciría la latencia percibida y eliminaría el tráfico innecesario de peticiones que devuelven respuestas vacías."},
    {"kind": "li", "text": "Incorporación de notificaciones push mediante Service Workers y la Web Push API, transformando la aplicación en una PWA instalable que pueda alertar al usuario de nuevas interacciones incluso con el navegador cerrado."},
    {"kind": "li", "text": "Desarrollo de una aplicación móvil con React Native que comparta la capa de acceso a la API REST con el cliente web, manteniendo una única fuente de verdad para los tipos TypeScript y los esquemas de validación Zod."},
    {"kind": "li", "text": "Internacionalización del producto mediante la integración con el sistema de i18n routing de Next.js, ampliando el alcance a comunidades hispanohablantes de Latinoamérica y otros mercados europeos."},
    {"kind": "li", "text": "Suite de tests end-to-end automatizados con Playwright que cubra los flujos críticos —registro, publicación, votación, bloqueo, reporte— y se integre en el pipeline de Vercel como gate previo al deploy a producción."},
    {"kind": "li", "text": "Capa de caché con Redis para los feeds más solicitados, reduciendo la carga sobre la base de datos en escenarios de alto tráfico simultáneo."},
    {"kind": "li", "text": "Aplicación uniforme de la sidebar persistente a la totalidad de las páginas del sitio, eliminando la inconsistencia visual actual entre la home, el detalle de post y las páginas de categoría o juego."},
]


# ─────────────────────────────────────────────────────────────────────────────
# BIBLIOGRAFÍA
# ─────────────────────────────────────────────────────────────────────────────
bibliografia = [
    {"kind": "h1", "text": "BIBLIOGRAFÍA"},
    {"kind": "p", "text": "Las referencias siguientes se han consultado para fundamentar las decisiones técnicas y de seguridad adoptadas durante el desarrollo del proyecto. Se presentan en formato APA séptima edición."},
    {"kind": "li_apa", "text": "Vercel Inc. (2024). Next.js Documentation. https://nextjs.org/docs"},
    {"kind": "li_apa", "text": "PostgreSQL Global Development Group. (2024). PostgreSQL 16 Documentation. https://www.postgresql.org/docs/16/"},
    {"kind": "li_apa", "text": "Tailwind Labs. (2024). Tailwind CSS Documentation. https://tailwindcss.com/docs"},
    {"kind": "li_apa", "text": "Microsoft. (2024). TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/intro.html"},
    {"kind": "li_apa", "text": "OWASP Foundation. (2021). OWASP Top 10 — 2021. https://owasp.org/Top10/"},
    {"kind": "li_apa", "text": "Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT) (RFC 7519). Internet Engineering Task Force. https://datatracker.ietf.org/doc/html/rfc7519"},
    {"kind": "li_apa", "text": "Vercel Inc. (2024). Vercel Documentation. https://vercel.com/docs"},
    {"kind": "li_apa", "text": "Neon Inc. (2024). Neon Documentation. https://neon.tech/docs"},
    {"kind": "li_apa", "text": "Panva, F. (2024). jose: JavaScript Object Signing and Encryption for Node.js. GitHub. https://github.com/panva/jose"},
    {"kind": "li_apa", "text": "Colinhacks. (2024). Zod: TypeScript-first schema validation with static type inference. https://zod.dev/"},
    {"kind": "li_apa", "text": "Upstash Inc. (2024). Upstash Redis Documentation. https://upstash.com/docs/redis"},
    {"kind": "li_apa", "text": "Uploadthing. (2024). Uploadthing Documentation. https://docs.uploadthing.com/"},
]


# ─────────────────────────────────────────────────────────────────────────────
# ANEXOS
# ─────────────────────────────────────────────────────────────────────────────
anexos = [
    {"kind": "h1", "text": "ANEXOS"},

    {"kind": "h2", "text": "Anexo 1. Repositorio del proyecto"},
    {"kind": "p", "text": "El código fuente completo del proyecto se encuentra publicado en GitHub bajo la siguiente dirección:"},
    {"kind": "p", "text": "https://github.com/Nikode17/forogaming"},
    {"kind": "p", "text": "El repositorio incluye además los archivos de documentación CLAUDE.md, JOURNAL.md y SDD.md, que ofrecen información complementaria sobre el estado del proyecto, su historia de desarrollo y las decisiones arquitectónicas adoptadas."},

    {"kind": "h2", "text": "Anexo 2. URL de producción"},
    {"kind": "p", "text": "La aplicación se encuentra desplegada y operativa en la siguiente dirección:"},
    {"kind": "p", "text": "https://forogaming.vercel.app"},
    {"kind": "p", "text": "El despliegue está alojado en Vercel y la base de datos en Neon, ambos en planes gratuitos. El registro y la navegación son accesibles sin necesidad de credenciales adicionales."},

    {"kind": "h2", "text": "Anexo 3. Estructura de carpetas del proyecto"},
    {"kind": "p", "text": "El árbol de directorios principal del repositorio se estructura como sigue:"},
    {"kind": "code", "text": (
        "Forogaming/\n"
        "├── migrations/                # Migraciones SQL versionadas (001 a 006)\n"
        "├── public/                    # Recursos estáticos (logo, favicons)\n"
        "├── scripts/                   # Utilidades Node.js (migrate, auditoría, PDFs)\n"
        "├── src/\n"
        "│   ├── app/                   # Rutas y endpoints (App Router de Next.js)\n"
        "│   │   ├── (auth)/            # /login y /register\n"
        "│   │   ├── admin/             # Panel de administración\n"
        "│   │   ├── api/               # 38 endpoints REST\n"
        "│   │   ├── post/[id]/         # Detalle de post\n"
        "│   │   ├── user/[username]/   # Perfil de usuario\n"
        "│   │   └── ...\n"
        "│   ├── components/            # 27 componentes React\n"
        "│   ├── contexts/              # AuthContext, AuthModalContext, SidebarContext\n"
        "│   ├── lib/                   # auth, db, blocks, ratelimit, sanitize, server-auth, validation\n"
        "│   └── types/                 # Interfaces TypeScript del dominio\n"
        "├── CLAUDE.md                  # Documentación operativa\n"
        "├── JOURNAL.md                 # Historia cronológica\n"
        "├── SDD.md                     # Documento de diseño técnico\n"
        "├── next.config.ts             # Configuración Next.js + cabeceras HTTP\n"
        "├── package.json               # Dependencias\n"
        "└── tsconfig.json              # Configuración TypeScript"
    )},

    {"kind": "h2", "text": "Anexo 4. Capturas adicionales"},
    {"kind": "p", "text": "Las capturas presentadas en la sección de Implementación se complementan con las siguientes vistas de detalle de funcionalidades específicas."},
    {"kind": "h4", "text": "Figura 13"},
    {"kind": "p_italic", "text": "Perfil de usuario con stats y tabs de Posts, Favoritos y Amigos"},
    {"kind": "review", "text": "REVISAR: insertar Figura 13 (captura de /user/[username])."},
    {"kind": "h4", "text": "Figura 14"},
    {"kind": "p_italic", "text": "Modal de creación de reporte con motivo y descripción"},
    {"kind": "review", "text": "REVISAR: insertar Figura 14 (captura del ReportModal abierto)."},
    {"kind": "h4", "text": "Figura 15"},
    {"kind": "p_italic", "text": "Vista de usuarios bloqueados desde /settings/blocked"},
    {"kind": "review", "text": "REVISAR: insertar Figura 15 (captura de la lista de bloqueados)."},
]


# ─────────────────────────────────────────────────────────────────────────────
# Volcado
# ─────────────────────────────────────────────────────────────────────────────
data = {
    "diseno_completar": diseno_completar,
    "implementacion": implementacion,
    "conclusiones": conclusiones,
    "innovacion": innovacion,
    "bibliografia": bibliografia,
    "anexos": anexos,
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

# Resumen
total_blocks = sum(len(v) for v in data.values())
review_count = sum(1 for v in data.values() for b in v if b["kind"] == "review")
words = 0
for sec in data.values():
    for b in sec:
        if isinstance(b.get("text"), str):
            words += len(b["text"].split())

print(f"OK -> {OUT}")
print(f"Secciones: {len(data)}")
print(f"Bloques totales: {total_blocks}")
print(f"Placeholders [REVISAR]: {review_count}")
print(f"Palabras totales: {words}")
for k, v in data.items():
    w = sum(len(b["text"].split()) for b in v if isinstance(b.get("text"), str))
    print(f"  {k}: {len(v)} bloques, {w} palabras")
