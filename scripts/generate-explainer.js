#!/usr/bin/env node
// scripts/generate-explainer.js
// Genera explicacion-respawn.pdf en el Escritorio del usuario

const puppeteer = require('puppeteer')
const path = require('path')
const os = require('os')

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUTPUT_PATH = path.join(os.homedir(), 'Desktop', 'explicacion-respawn.pdf')

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Respawn — Cómo funciona todo</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 11.5pt;
    line-height: 1.8;
    color: #1e1e2e;
    background: #fff;
  }

  /* ── Portada ── */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    color: white;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 48pt;
    font-weight: 900;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #e879f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
  }
  .cover .subtitle {
    font-size: 16pt;
    color: #a5b4fc;
    margin-bottom: 48px;
  }
  .cover .box {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 28px 44px;
    text-align: left;
    color: #c7d2fe;
    font-size: 11pt;
    line-height: 2;
  }
  .cover .box strong { color: #818cf8; }

  /* ── Páginas ── */
  .page {
    padding: 48px 56px;
    page-break-after: always;
    max-width: 800px;
    margin: 0 auto;
  }
  .page:last-child { page-break-after: avoid; }

  /* ── Cabeceras de sección ── */
  .section-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 3px solid #4f46e5;
  }
  .section-num {
    width: 44px; height: 44px;
    background: #4f46e5;
    color: white;
    font-size: 18pt;
    font-weight: 900;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 20pt;
    font-weight: 800;
    color: #1e1e2e;
  }

  h2 { font-size: 14pt; font-weight: 700; color: #312e81; margin: 28px 0 10px; }
  h3 { font-size: 12pt; font-weight: 700; color: #4338ca; margin: 20px 0 8px; }
  p { margin-bottom: 12px; color: #374151; }
  ul, ol { padding-left: 22px; margin-bottom: 14px; color: #374151; }
  li { margin-bottom: 6px; }

  /* ── Cajas ── */
  .analogy {
    background: #f0f4ff;
    border-left: 4px solid #6366f1;
    border-radius: 0 10px 10px 0;
    padding: 14px 18px;
    margin: 16px 0;
    color: #312e81;
    font-style: italic;
  }
  .analogy::before { content: '💡 Analogía: '; font-weight: 700; font-style: normal; }

  .info {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    border-radius: 0 10px 10px 0;
    padding: 14px 18px;
    margin: 16px 0;
    color: #065f46;
  }

  .warn {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    border-radius: 0 10px 10px 0;
    padding: 14px 18px;
    margin: 16px 0;
    color: #78350f;
  }

  .step {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 14px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
  }
  .step-num {
    width: 28px; height: 28px;
    background: #4f46e5;
    color: white;
    font-weight: 700;
    font-size: 10pt;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .step-text { flex: 1; color: #374151; }
  .step-text strong { color: #1e1e2e; }

  code {
    background: #f1f5f9;
    color: #4f46e5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 9.5pt;
  }

  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10.5pt; }
  th { background: #4f46e5; color: white; padding: 10px 14px; text-align: left; }
  td { padding: 9px 14px; border-bottom: 1px solid #e2e8f0; color: #374151; }
  tr:nth-child(even) td { background: #f8fafc; }

  .footer-note {
    text-align: center;
    font-size: 9pt;
    color: #9ca3af;
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  /* Índice */
  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dotted #d1d5db;
    color: #374151;
  }
  .toc-item .num { color: #4f46e5; font-weight: 700; margin-right: 10px; }
  .toc-item .pg { color: #9ca3af; }

  .highlight { background: #fef3c7; padding: 1px 4px; border-radius: 3px; }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <h1>Respawn</h1>
  <p class="subtitle">Cómo funciona todo — explicado sin tecnicismos</p>
  <div class="box">
    <div><strong>Para quién es esto:</strong> Cualquier persona que quiera entender cómo está construida la web, sin necesidad de saber programar.</div>
    <div><strong>Qué encontrarás aquí:</strong> Explicaciones con analogías del mundo real de cada parte del proyecto.</div>
    <div><strong>Fecha:</strong> Abril de 2026</div>
  </div>
</div>

<!-- ÍNDICE -->
<div class="page">
  <div class="section-header">
    <div class="section-num" style="font-size:12pt;">📋</div>
    <div class="section-title">Índice</div>
  </div>

  <div class="toc-item"><span><span class="num">1.</span> ¿Qué es Respawn y para qué sirve?</span></div>
  <div class="toc-item"><span><span class="num">2.</span> ¿Cómo funciona una web? (el concepto básico)</span></div>
  <div class="toc-item"><span><span class="num">3.</span> Las herramientas usadas para construirla</span></div>
  <div class="toc-item"><span><span class="num">4.</span> La base de datos — donde vive toda la información</span></div>
  <div class="toc-item"><span><span class="num">5.</span> El sistema de usuarios — registro y login</span></div>
  <div class="toc-item"><span><span class="num">6.</span> Los posts y comentarios</span></div>
  <div class="toc-item"><span><span class="num">7.</span> El sistema de votos y trending</span></div>
  <div class="toc-item"><span><span class="num">8.</span> Los mensajes directos (chat)</span></div>
  <div class="toc-item"><span><span class="num">9.</span> El sistema de amigos</span></div>
  <div class="toc-item"><span><span class="num">10.</span> Las imágenes (avatares y fotos de posts)</span></div>
  <div class="toc-item"><span><span class="num">11.</span> El catálogo de juegos (IGDB)</span></div>
  <div class="toc-item"><span><span class="num">12.</span> La seguridad — cómo se protege la web</span></div>
  <div class="toc-item"><span><span class="num">13.</span> Cómo la web llega a internet (despliegue)</span></div>
  <div class="toc-item"><span><span class="num">14.</span> El recorrido completo de una acción — ejemplo real</span></div>
</div>

<!-- 1. QUÉ ES RESPAWN -->
<div class="page">
  <div class="section-header">
    <div class="section-num">1</div>
    <div class="section-title">¿Qué es Respawn y para qué sirve?</div>
  </div>

  <p>Respawn es una <strong>comunidad web de videojuegos</strong>. Es un lugar donde los jugadores pueden:</p>
  <ul>
    <li>Publicar <strong>guías</strong> para ayudar a otros a completar partes difíciles de un juego</li>
    <li>Compartir <strong>easter eggs</strong> (secretos escondidos que los desarrolladores dejan en los juegos)</li>
    <li>Escribir <strong>reviews</strong> (opiniones y análisis) de videojuegos</li>
    <li>Comentar y debatir con otros jugadores</li>
    <li>Seguir a otros usuarios, hacerse amigos y enviarse mensajes</li>
  </ul>

  <div class="analogy">
    Imagina Reddit (el foro gigante de internet) pero especializado 100% en videojuegos, con un catálogo de juegos integrado y un sistema de mensajería privada. Eso es Respawn.
  </div>

  <h2>¿Qué puede hacer cada tipo de usuario?</h2>
  <table>
    <thead><tr><th>Tipo</th><th>Qué puede hacer</th></tr></thead>
    <tbody>
      <tr><td><strong>Invitado</strong> (sin cuenta)</td><td>Leer posts, ver perfiles, explorar juegos</td></tr>
      <tr><td><strong>Usuario registrado</strong></td><td>Todo lo anterior + publicar, comentar, votar, chatear, seguir usuarios, tener amigos</td></tr>
      <tr><td><strong>Moderador</strong></td><td>Todo lo anterior + eliminar contenido inapropiado, reportes</td></tr>
      <tr><td><strong>Admin</strong></td><td>Control total: añadir juegos, banear usuarios, panel de administración</td></tr>
    </tbody>
  </table>

  <h2>Las páginas principales</h2>
  <ul>
    <li><strong>Inicio (/):</strong> Feed de posts con carousel de juegos, estadísticas de la comunidad y strip de juegos activos</li>
    <li><strong>/post/[id]:</strong> Un post completo con sus comentarios anidados</li>
    <li><strong>/game/[slug]:</strong> Página de un juego con su información de IGDB y posts relacionados</li>
    <li><strong>/user/[username]:</strong> Perfil de usuario con cover, estadísticas y tabs</li>
    <li><strong>/messages:</strong> Lista de conversaciones y chat privado</li>
    <li><strong>/friends:</strong> Lista de amigos y solicitudes pendientes</li>
    <li><strong>/settings:</strong> Configuración de perfil (avatar y bio)</li>
    <li><strong>/admin:</strong> Panel de administración (solo admins)</li>
  </ul>
</div>

<!-- 2. CÓMO FUNCIONA UNA WEB -->
<div class="page">
  <div class="section-header">
    <div class="section-num">2</div>
    <div class="section-title">¿Cómo funciona una web? (el concepto básico)</div>
  </div>

  <p>Antes de entrar en detalles de Respawn, es importante entender cómo funciona cualquier web moderna. Hay dos protagonistas principales:</p>

  <h2>El cliente y el servidor</h2>

  <div class="analogy">
    Piensa en un restaurante. <strong>Tú eres el cliente</strong> — entras, te sientas y pides comida. <strong>La cocina es el servidor</strong> — recibe tu pedido, lo prepara y te lo envía. El camarero es internet, que lleva los mensajes de un lado a otro.
  </div>

  <p>En el mundo web:</p>
  <ul>
    <li><strong>El cliente</strong> es tu navegador (Chrome, Edge, Firefox). Es lo que ves en pantalla.</li>
    <li><strong>El servidor</strong> es un ordenador que está siempre encendido en algún lugar del mundo. Guarda todos los datos y los envía cuando alguien los pide.</li>
    <li><strong>Internet</strong> es el canal de comunicación entre ambos.</li>
  </ul>

  <h2>¿Qué pasa cuando abres Respawn?</h2>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Escribes la URL</strong> en el navegador (respawn.vercel.app). Tu navegador pregunta a internet "¿dónde vive esta web?"</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>DNS (la guía telefónica de internet)</strong> responde con la dirección IP del servidor de Vercel donde está alojada la web.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Tu navegador contacta el servidor</strong> de Vercel y dice "dame la página de inicio".</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text"><strong>El servidor prepara la respuesta</strong>: consulta la base de datos para obtener los posts más recientes, los juegos populares, las estadísticas...</div></div>
  <div class="step"><div class="step-num">5</div><div class="step-text"><strong>El servidor envía el HTML</strong> (el código que describe cómo se ve la página) a tu navegador.</div></div>
  <div class="step"><div class="step-num">6</div><div class="step-text"><strong>Tu navegador lo renderiza</strong> — convierte ese código en la página visual que ves en pantalla.</div></div>

  <h2>¿Qué es el código?</h2>
  <p>El código es simplemente un <strong>conjunto de instrucciones escritas en un lenguaje que los ordenadores entienden</strong>. En Respawn usamos principalmente dos lenguajes:</p>
  <ul>
    <li><strong>TypeScript/JavaScript:</strong> El lenguaje principal. Controla tanto lo que ves (botones, animaciones) como la lógica del servidor (guardar datos, verificar contraseñas).</li>
    <li><strong>SQL:</strong> El lenguaje para hablar con la base de datos. Se usa para decir "dame todos los posts de este usuario" o "guarda este comentario".</li>
  </ul>

  <div class="analogy">
    El código es como una receta de cocina muy detallada. El ordenador sigue las instrucciones al pie de la letra — no improvisa, no interpreta, hace exactamente lo que le dices.
  </div>
</div>

<!-- 3. HERRAMIENTAS -->
<div class="page">
  <div class="section-header">
    <div class="section-num">3</div>
    <div class="section-title">Las herramientas usadas para construirla</div>
  </div>

  <p>Respawn no está construida desde cero con código puro. Como cualquier proyecto moderno, usa <strong>herramientas ya existentes</strong> que hacen el trabajo pesado. Aquí están las principales:</p>

  <h2>Next.js — El "marco" de la aplicación</h2>
  <div class="analogy">
    Si construir una web fuera construir una casa, Next.js sería el esqueleto prefabricado — los pilares, el tejado, la estructura. Tú añades las paredes y la decoración, pero la estructura ya está hecha.
  </div>
  <p>Next.js es un <strong>framework</strong> (marco de trabajo) que facilita enormemente construir webs. Se encarga de muchas cosas automáticamente: el enrutamiento (qué página se muestra según la URL), la optimización de imágenes, el servidor...</p>

  <h2>React — Los componentes visuales</h2>
  <div class="analogy">
    Imagina que la web está hecha de piezas de LEGO. Cada pieza es un "componente": el navbar es una pieza, el botón de seguir es otra, la tarjeta de un post es otra. React te permite construir y reutilizar estas piezas.
  </div>
  <p>React es la librería que permite dividir la interfaz en <strong>componentes reutilizables</strong>. El navbar que ves arriba es un componente. El botón de votar es otro. Cada uno tiene su propia lógica y se puede usar en múltiples lugares.</p>

  <h2>PostgreSQL — La base de datos</h2>
  <div class="analogy">
    Es como Excel pero mucho más potente y diseñado para miles de usuarios simultáneos. Guarda toda la información: usuarios, posts, comentarios, mensajes...
  </div>

  <h2>Vercel — El hosting (donde vive la web)</h2>
  <p>Vercel es el servicio donde está alojada Respawn. Es como un servicio de alquiler de servidores. Cuando subes código nuevo a GitHub, Vercel lo detecta y actualiza la web automáticamente en segundos.</p>

  <h2>Neon — La base de datos en la nube</h2>
  <p>Neon es el servicio donde vive la base de datos PostgreSQL. Es una base de datos "serverless" — solo se activa cuando alguien la usa, lo que reduce costes enormemente.</p>

  <h2>Uploadthing — Para subir imágenes</h2>
  <p>Cuando subes una foto de perfil o una imagen en un post, Uploadthing se encarga de recibirla, verificar que es válida y guardarla en sus servidores. Devuelve una URL pública para que se pueda mostrar en la web.</p>

  <h2>IGDB — El catálogo de juegos</h2>
  <p>IGDB (Internet Games Database) es como la Wikipedia de los videojuegos. Cuando buscas un juego en Respawn, la web consulta la API de IGDB para obtener la portada, la descripción, el género y la puntuación del juego.</p>

  <div class="info">
    <strong>Coste total de todo esto:</strong> 0 € al mes. Todos estos servicios tienen planes gratuitos suficientes para el volumen actual del proyecto.
  </div>
</div>

<!-- 4. BASE DE DATOS -->
<div class="page">
  <div class="section-header">
    <div class="section-num">4</div>
    <div class="section-title">La base de datos — donde vive toda la información</div>
  </div>

  <div class="analogy">
    Imagina que la base de datos es un almacén con estanterías. Cada estantería es una "tabla" y guarda un tipo concreto de información. En una estantería están todos los usuarios, en otra todos los posts, en otra todos los comentarios...
  </div>

  <p>La base de datos de Respawn tiene las siguientes tablas principales:</p>

  <h2>Tabla: usuarios (users)</h2>
  <p>Guarda un registro por cada persona registrada en la web. Cada fila tiene:</p>
  <table>
    <thead><tr><th>Campo</th><th>Qué guarda</th><th>Ejemplo</th></tr></thead>
    <tbody>
      <tr><td>id</td><td>Un código único que identifica al usuario</td><td>a3f7-bc12-...</td></tr>
      <tr><td>username</td><td>El nombre visible</td><td>Nikode17</td></tr>
      <tr><td>email</td><td>El correo electrónico</td><td>nick@mail.com</td></tr>
      <tr><td>password_hash</td><td>La contraseña cifrada (nunca en texto)</td><td>$2b$10$abc...</td></tr>
      <tr><td>role</td><td>Su nivel de permisos</td><td>admin / user</td></tr>
      <tr><td>avatar_url</td><td>Dirección de su foto de perfil</td><td>https://utfs.io/...</td></tr>
      <tr><td>bio</td><td>Su descripción personal</td><td>"Fan de los RPGs"</td></tr>
    </tbody>
  </table>

  <h2>Tabla: posts</h2>
  <p>Un registro por cada post publicado. Guarda el título, el contenido, a qué usuario pertenece, en qué categoría está y a qué juego está asociado.</p>

  <h2>Tabla: comentarios (comments)</h2>
  <p>Cada comentario tiene un campo especial: <code>parent_id</code>. Si un comentario es una respuesta a otro, guarda el ID del comentario padre. Así se construye el árbol de respuestas anidadas.</p>

  <div class="analogy">
    Los comentarios anidados son como una conversación de WhatsApp donde puedes responder a mensajes concretos. Cada respuesta "apunta" al mensaje al que responde.
  </div>

  <h2>Tabla: votos (votes)</h2>
  <p>Registra quién votó qué y si fue positivo o negativo. Para que una persona no pueda votar dos veces, la base de datos tiene una restricción que lo impide automáticamente.</p>

  <h2>Tabla: mensajes directos (direct_messages)</h2>
  <p>Guarda cada mensaje de chat con: quién lo envió, a quién va dirigido, el texto y si ya fue leído.</p>

  <h2>Tabla: solicitudes de amistad (friend_requests)</h2>
  <p>Registra las solicitudes de amistad con tres estados posibles: <em>pendiente</em>, <em>aceptada</em> o <em>rechazada</em>.</p>

  <h2>¿Cómo se relacionan las tablas?</h2>
  <div class="analogy">
    Piensa en una biblioteca. Los libros son una tabla, los autores otra. Cada libro tiene un campo "autor_id" que apunta a su fila correspondiente en la tabla de autores. Así, cuando quieres saber quién escribió un libro, no copias el nombre en cada libro — simplemente buscas por el ID. En Respawn funciona igual: cada post tiene un "author_id" que apunta al usuario que lo escribió.
  </div>
</div>

<!-- 5. USUARIOS, REGISTRO Y LOGIN -->
<div class="page">
  <div class="section-header">
    <div class="section-num">5</div>
    <div class="section-title">El sistema de usuarios — registro y login</div>
  </div>

  <h2>¿Cómo funciona el registro?</h2>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Rellenas el formulario</strong> con nombre de usuario, email y contraseña.</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>El servidor valida los datos</strong>: ¿el email tiene formato correcto? ¿el usuario ya existe? ¿la contraseña tiene al menos 8 caracteres?</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>La contraseña se cifra</strong> con un algoritmo llamado bcrypt antes de guardarse. Nadie, ni los administradores, puede ver tu contraseña real.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Se crea tu registro</strong> en la tabla de usuarios y quedas automáticamente conectado.</div></div>

  <div class="analogy">
    El cifrado de contraseñas es como pasar un texto por una picadora. El resultado (el "hash") no se puede convertir de vuelta al original. Cuando haces login, la web pica tu contraseña de nuevo y compara si los resultados coinciden — sin necesitar ver la contraseña original.
  </div>

  <h2>¿Cómo funciona el login? Los "tokens JWT"</h2>
  <p>Cuando haces login correctamente, el servidor te da dos cosas:</p>

  <div class="analogy">
    Imagina que vas a un parque de atracciones. Al entrar, te ponen una <strong>pulsera temporal</strong> que caduca en 15 minutos (el "access token"). También te dan un <strong>ticket de renovación</strong> que dura 7 días (el "refresh token"). Cuando la pulsera caduca, muestras el ticket y te dan una pulsera nueva, sin tener que volver a la taquilla con tu DNI.
  </div>

  <ul>
    <li><strong>Access Token (dura 15 minutos):</strong> Un código cifrado que demuestra que eres tú. Lo envías en cada petición al servidor para demostrar que estás autenticado. Si alguien te lo roba, solo le sirve 15 minutos.</li>
    <li><strong>Refresh Token (dura 7 días):</strong> Se guarda en una cookie especial llamada "httpOnly" que JavaScript no puede leer — solo el navegador la maneja. Sirve para obtener un nuevo access token automáticamente cuando el anterior caduca, sin que tengas que volver a hacer login.</li>
  </ul>

  <h2>¿Por qué no guardar la sesión para siempre?</h2>
  <p>Si los tokens duraran indefinidamente, alguien que robara tu token tendría acceso para siempre. Con tokens de corta duración, el daño potencial es mucho más limitado.</p>

  <h2>El middleware — el portero de la discoteca</h2>
  <div class="analogy">
    Antes de que cualquier petición llegue a las APIs protegidas, pasa por el middleware. Este es como el portero de una discoteca: revisa si llevas la pulsera válida y, si es así, te deja pasar. Si no, te manda de vuelta.
  </div>
  <p>El middleware verifica el access token en cada petición y, si es válido, añade automáticamente el ID del usuario a la petición para que las APIs sepan quién está haciendo la llamada.</p>
</div>

<!-- 6. POSTS Y COMENTARIOS -->
<div class="page">
  <div class="section-header">
    <div class="section-num">6</div>
    <div class="section-title">Los posts y comentarios</div>
  </div>

  <h2>Crear un post</h2>
  <p>Cuando escribes un post en Respawn, introduces: título, categoría, contenido, imágenes opcionales y el juego al que está relacionado. Al darle a publicar:</p>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>El servidor recibe los datos</strong> y los valida: ¿el título no está vacío? ¿la categoría es válida? ¿el contenido no supera el límite?</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Se sanitiza el contenido</strong> — se eliminan posibles fragmentos de código malicioso que alguien pudiera intentar colar en el texto.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Se guarda en la base de datos</strong> con un ID único, la fecha de creación y el ID del autor.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Se redirige al post recién creado</strong> y aparece en el feed.</div></div>

  <h2>¿Qué es la sanitización?</h2>
  <div class="analogy">
    Imagina que alguien escribe en un formulario: <em>"Mi nombre es &lt;script&gt;robarContraseñas()&lt;/script&gt;"</em>. Si la web mostrara eso tal cual, ejecutaría código malicioso. La sanitización actúa como un filtro que elimina esas partes peligrosas antes de guardar el texto.
  </div>

  <h2>Los comentarios anidados</h2>
  <p>Los comentarios en Respawn pueden tener hasta 4 niveles de profundidad. Cada comentario puede ser una respuesta a otro:</p>

  <pre style="background:#f1f5f9; padding:14px; border-radius:8px; font-size:9pt; color:#374151; line-height:1.6;">
  Comentario A (nivel 1)
  └── Respuesta de B a A (nivel 2)
      └── Respuesta de C a B (nivel 3)
          └── Respuesta de D a C (nivel 4)
  Comentario E (nivel 1, independiente)
  </pre>

  <p>En la base de datos, cada comentario tiene un campo <code>parent_id</code> que apunta al comentario al que responde. Si es un comentario raíz (nivel 1), ese campo está vacío. El servidor reconstruye el árbol completo antes de enviarlo al navegador.</p>

  <h2>El soft-delete — borrado "falso"</h2>
  <div class="analogy">
    Cuando un moderador "elimina" un post o comentario, en realidad no lo borra de la base de datos. Es como esconder un documento en un cajón en vez de tirarlo a la papelera. El campo <code>is_deleted</code> cambia de "false" a "true" y la web deja de mostrarlo, pero los datos siguen ahí por si necesitan recuperarse.
  </div>
</div>

<!-- 7. VOTOS Y TRENDING -->
<div class="page">
  <div class="section-header">
    <div class="section-num">7</div>
    <div class="section-title">El sistema de votos y trending</div>
  </div>

  <h2>¿Cómo funcionan los votos?</h2>
  <p>Cada post y comentario puede recibir votos positivos (👍) y negativos (👎). Las reglas son:</p>
  <ul>
    <li>Cada usuario solo puede votar una vez por post/comentario</li>
    <li>Puedes cambiar tu voto (de positivo a negativo o viceversa)</li>
    <li>Puedes retirar tu voto haciendo clic de nuevo</li>
    <li>No puedes votar tus propios posts</li>
  </ul>

  <p>La base de datos tiene una restricción técnica que garantiza que no puede haber dos votos del mismo usuario al mismo post — esto se verifica a nivel de base de datos, no solo en el código, así que es imposible de manipular.</p>

  <h2>El sistema de Trending — ¿cómo se decide qué es popular?</h2>
  <div class="analogy">
    Imagina que tienes dos noticias: una con 1000 votos de hace un mes, y otra con 50 votos de hace una hora. ¿Cuál es más "trending"? La segunda, porque está generando actividad ahora mismo. El algoritmo de trending pondera tanto los votos como la frescura.
  </div>

  <p>Respawn usa un algoritmo similar al de Reddit para calcular el score de trending:</p>

  <div style="background:#f1f5f9; padding:16px; border-radius:8px; text-align:center; font-size:12pt; margin:16px 0;">
    <strong>Score = Votos netos ÷ (Horas desde publicación + 2) ^ 1.8</strong>
  </div>

  <p>Esto significa que un post con muchos votos recientes sube rápido, pero con el tiempo va bajando inevitablemente para dar paso a contenido más fresco. El "+2" en la fórmula evita que los posts nuevísimos (0 horas) tengan un score infinito.</p>

  <p>Este cálculo se hace en una <strong>vista SQL</strong> — básicamente una consulta guardada que la base de datos ejecuta automáticamente cuando se le pide el ranking, sin necesitar código adicional.</p>

  <h2>Likes vs Votos — ¿cuál es la diferencia?</h2>
  <table>
    <thead><tr><th>Votos</th><th>Likes</th></tr></thead>
    <tbody>
      <tr><td>Afectan el ranking del post</td><td>No afectan el ranking</td></tr>
      <tr><td>Pueden ser positivos o negativos</td><td>Solo positivos</td></tr>
      <tr><td>Determinan el orden en el feed</td><td>Son solo una reacción emocional</td></tr>
    </tbody>
  </table>
</div>

<!-- 8. MENSAJES -->
<div class="page">
  <div class="section-header">
    <div class="section-num">8</div>
    <div class="section-title">Los mensajes directos (chat)</div>
  </div>

  <h2>El chat popup estilo Facebook</h2>
  <p>Respawn tiene un sistema de mensajería privada accesible desde cualquier página mediante el botón flotante en la esquina inferior derecha. En escritorio aparece como un popup de 360px; en móvil sube como un panel desde la parte inferior de la pantalla.</p>

  <h2>¿Cómo se envía un mensaje?</h2>

  <div class="step"><div class="step-num">1</div><div class="step-text">Escribes el mensaje y pulsas enviar.</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text">El navegador envía el texto al servidor con tu token de autenticación.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text">El servidor verifica que estás autenticado y que no te estás enviando mensajes a ti mismo.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text">El mensaje se guarda en la tabla <code>direct_messages</code> con timestamp (marca de tiempo exacta).</div></div>
  <div class="step"><div class="step-num">5</div><div class="step-text">El navegador recarga inmediatamente los mensajes para mostrar el que acabas de enviar.</div></div>

  <h2>El "polling" — cómo llegan los mensajes en tiempo real</h2>
  <div class="analogy">
    Imagina que estás esperando una carta. En vez de esperar sentado a que el cartero llame, cada 3 segundos vas a la puerta a comprobar si ya llegó. Eso es el polling — la web pregunta al servidor cada 3 segundos "¿hay mensajes nuevos?"
  </div>

  <p>El chat de Respawn usa polling: cada 3 segundos, el navegador pregunta al servidor si han llegado mensajes nuevos desde el último que se recibió. Es más sencillo que las alternativas (WebSockets) y suficiente para el volumen actual.</p>

  <h2>El bug de los mensajes duplicados y cómo se solucionó</h2>
  <p>Hubo un problema: los mensajes aparecían duplicados. La causa era sutil: PostgreSQL guarda las fechas con precisión de microsegundos (millonésimas de segundo), pero JavaScript solo maneja milisegundos (milésimas). Al usar la fecha del último mensaje como referencia para pedir los nuevos, el mismo mensaje se volvía a incluir.</p>
  <p><strong>Solución:</strong> Se añade 1 milisegundo a la fecha de referencia antes de pedirle al servidor los mensajes nuevos. Así el servidor devuelve solo los que llegaron después. Además, se filtra por IDs duplicados como segunda línea de defensa.</p>

  <h2>La marca de leído (✓)</h2>
  <p>Cuando abres una conversación, el servidor marca automáticamente como leídos todos los mensajes que te enviaron. El tick (✓) que ves junto a tus mensajes indica que el destinatario ya los ha leído.</p>
</div>

<!-- 9. SISTEMA DE AMIGOS -->
<div class="page">
  <div class="section-header">
    <div class="section-num">9</div>
    <div class="section-title">El sistema de amigos</div>
  </div>

  <h2>¿Cómo funciona?</h2>
  <p>El sistema de amigos de Respawn funciona con solicitudes bidireccionales, igual que en Facebook o Discord:</p>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Envías una solicitud</strong> a otro usuario desde su perfil o buscándole por nombre.</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>El otro usuario recibe la solicitud</strong> — aparece un badge en su navbar indicando que tiene solicitudes pendientes.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Acepta o rechaza</strong> desde la página de amigos.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text">Si acepta, <strong>ambos se añaden a la lista de amigos</strong> del otro.</div></div>

  <h2>El auto-aceptado</h2>
  <p>Si el usuario B envía una solicitud a A mientras A ya tenía una solicitud pendiente a B, el sistema lo detecta y los añade automáticamente como amigos sin que ninguno tenga que aceptar manualmente. Tiene sentido: si ambos quieren ser amigos del otro, ¿para qué pedir confirmación extra?</p>

  <h2>Diferencia entre "seguir" y "amistad"</h2>
  <table>
    <thead><tr><th>Seguir (Follow)</th><th>Amistad</th></tr></thead>
    <tbody>
      <tr><td>Unidireccional — puedes seguir a alguien sin que te siga</td><td>Bidireccional — ambos tienen que aceptar</td></tr>
      <tr><td>Como Twitter/Instagram</td><td>Como Facebook</td></tr>
      <tr><td>No requiere aprobación</td><td>Requiere solicitud y aceptación</td></tr>
      <tr><td>Sirve para ver el contenido de alguien</td><td>Acceso a mensajes y lista de amigos común</td></tr>
    </tbody>
  </table>

  <h2>La búsqueda de usuarios</h2>
  <p>Al hacer clic en "Agregar amigo", se abre un modal (ventana emergente) con un buscador. Al escribir, la web consulta automáticamente la base de datos con búsqueda por nombre. Los resultados aparecen en tiempo real con un pequeño retraso intencional de 350ms para no saturar el servidor con cada tecla pulsada. Este técnica se llama "debouncing".</p>

  <div class="analogy">
    El debouncing es como esperar a que alguien termine de hablar antes de responder, en vez de interrumpirle después de cada palabra.
  </div>
</div>

<!-- 10. IMÁGENES -->
<div class="page">
  <div class="section-header">
    <div class="section-num">10</div>
    <div class="section-title">Las imágenes (avatares y fotos de posts)</div>
  </div>

  <h2>¿Por qué no guardar las imágenes en la base de datos?</h2>
  <div class="analogy">
    Guardar imágenes en una base de datos es como guardar muebles dentro de los cajones de un archivador. Es posible, pero para eso están los almacenes. Las bases de datos están optimizadas para texto y números, no para archivos pesados.
  </div>
  <p>Las imágenes se guardan en <strong>Uploadthing</strong>, un servicio externo especializado en almacenamiento de archivos. La base de datos solo guarda la URL (la dirección web) donde vive la imagen.</p>

  <h2>El proceso de subir un avatar</h2>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Seleccionas la imagen</strong> en tu dispositivo desde la página de configuración.</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>El navegador verifica</strong> que es una imagen válida y no supera los 2 MB.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Uploadthing recibe el archivo</strong> directamente desde tu navegador, lo analiza y lo guarda en sus servidores.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Uploadthing devuelve la URL</strong> pública donde se puede acceder a la imagen.</div></div>
  <div class="step"><div class="step-num">5</div><div class="step-text"><strong>La URL se guarda en la base de datos</strong> como el avatar del usuario.</div></div>
  <div class="step"><div class="step-num">6</div><div class="step-text"><strong>El navbar se actualiza</strong> automáticamente para mostrar la nueva foto sin necesidad de recargar la página.</div></div>

  <h2>Límites de tamaño</h2>
  <table>
    <thead><tr><th>Tipo de imagen</th><th>Límite</th></tr></thead>
    <tbody>
      <tr><td>Avatar de perfil</td><td>2 MB</td></tr>
      <tr><td>Imágenes en posts</td><td>8 MB</td></tr>
    </tbody>
  </table>

  <div class="info">
    Uploadthing solo acepta imágenes (JPG, PNG, GIF, WEBP). No se pueden subir archivos ejecutables ni documentos, lo que evita que alguien use la web para distribuir malware.
  </div>
</div>

<!-- 11. IGDB -->
<div class="page">
  <div class="section-header">
    <div class="section-num">11</div>
    <div class="section-title">El catálogo de juegos (IGDB)</div>
  </div>

  <h2>¿Qué es IGDB?</h2>
  <p>IGDB (Internet Games Database) es una base de datos de videojuegos mantenida por Twitch/Amazon. Tiene información de más de 200.000 juegos: portadas, descripciones, géneros, puntuaciones, capturas de pantalla...</p>

  <div class="analogy">
    IGDB es a los videojuegos lo que IMDb es a las películas — la referencia más completa y actualizada.
  </div>

  <h2>¿Cómo se integra con Respawn?</h2>
  <p>Cuando un administrador quiere añadir un juego al catálogo de Respawn, busca en IGDB. La web de Respawn hace una consulta a la API de IGDB y muestra los resultados. El admin selecciona el juego correcto y se guardan sus datos en la base de datos de Respawn.</p>

  <p>Esto significa que Respawn no tiene que mantener su propia base de datos de juegos con portadas, descripciones y géneros — IGDB lo hace por ella.</p>

  <h2>¿Cómo funciona la autenticación con IGDB?</h2>
  <p>Para usar la API de IGDB, Respawn necesita identificarse. El proceso:</p>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Respawn tiene unas credenciales</strong> (Client ID y Client Secret) obtenidas al registrarse como desarrollador en Twitch.</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Cuando necesita consultar IGDB</strong>, el servidor de Respawn primero obtiene un token de acceso temporal de Twitch usando esas credenciales.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Ese token se guarda en memoria</strong> para reutilizarlo hasta que expire, evitando pedir uno nuevo en cada búsqueda.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Con el token</strong>, Respawn consulta IGDB y obtiene la información del juego.</div></div>

  <h2>Las páginas de juego</h2>
  <p>Cada juego en Respawn tiene su propia página con: la portada de IGDB, la descripción, el género, la puntuación media y todos los posts de la comunidad relacionados con ese juego.</p>
</div>

<!-- 12. SEGURIDAD -->
<div class="page">
  <div class="section-header">
    <div class="section-num">12</div>
    <div class="section-title">La seguridad — cómo se protege la web</div>
  </div>

  <h2>Las amenazas más comunes en webs</h2>
  <p>Toda web pública está expuesta a personas que intentan aprovecharse de ella. Las más comunes son:</p>

  <h3>SQL Injection — "el truco del cajero"</h3>
  <div class="analogy">
    Imagina que el cajero del banco te pregunta tu nombre para una gestión. En vez de decir "Juan", dices "Juan; transfiere todo el dinero a mi cuenta". Si el sistema no está protegido, ejecutaría esa instrucción. En webs, esto se hace con código SQL malicioso.
  </div>
  <p><strong>Cómo está protegida Respawn:</strong> Todas las consultas a la base de datos usan "consultas parametrizadas" — el código y los datos van por canales separados, así que es imposible inyectar instrucciones maliciosas.</p>

  <h3>XSS — "el código escondido"</h3>
  <div class="analogy">
    Alguien publica un comentario que contiene código JavaScript disfrazado de texto. Si la web lo muestra sin filtrar, ese código se ejecuta en el navegador de todos los que lean el comentario y puede robar sus cookies o contraseñas.
  </div>
  <p><strong>Cómo está protegida Respawn:</strong> Todo el contenido que los usuarios escriben pasa por un sanitizador que elimina cualquier código ejecutable antes de guardarse.</p>

  <h3>Clickjacking — "el iframe trampa"</h3>
  <p>Un atacante pone Respawn en un iframe invisible sobre su web. El usuario cree que hace clic en algo inocente pero en realidad está clicando en Respawn.</p>
  <p><strong>Cómo está protegida:</strong> La cabecera <code>X-Frame-Options: DENY</code> prohíbe que Respawn se pueda incrustar en iframes.</p>

  <h2>Las cabeceras de seguridad HTTP</h2>
  <p>Son instrucciones que el servidor envía al navegador para decirle cómo debe comportarse. Respawn tiene estas configuradas:</p>
  <table>
    <thead><tr><th>Cabecera</th><th>Qué hace</th></tr></thead>
    <tbody>
      <tr><td>Content-Security-Policy</td><td>Solo ejecuta scripts y carga imágenes de dominios de confianza</td></tr>
      <tr><td>X-Frame-Options: DENY</td><td>Impide el clickjacking</td></tr>
      <tr><td>Strict-Transport-Security</td><td>Fuerza HTTPS — nunca HTTP sin cifrar</td></tr>
      <tr><td>X-Content-Type-Options</td><td>El navegador no "adivina" tipos de archivo</td></tr>
      <tr><td>Referrer-Policy</td><td>No filtra URLs al hacer clic en enlaces externos</td></tr>
      <tr><td>Permissions-Policy</td><td>Desactiva cámara, micrófono y geolocalización</td></tr>
    </tbody>
  </table>

  <h2>HTTPS — la comunicación cifrada</h2>
  <div class="analogy">
    Sin HTTPS, los datos viajan por internet como postales — cualquiera que los intercepte puede leerlos. Con HTTPS, viajan dentro de un sobre sellado con un candado que solo el destinatario puede abrir.
  </div>
  <p>Vercel activa HTTPS automáticamente en todos los despliegues con un certificado SSL gratuito renovado cada 90 días.</p>
</div>

<!-- 13. DESPLIEGUE -->
<div class="page">
  <div class="section-header">
    <div class="section-num">13</div>
    <div class="section-title">Cómo la web llega a internet (despliegue)</div>
  </div>

  <h2>El flujo de trabajo</h2>
  <div class="analogy">
    Imagina que el código es un libro que estás escribiendo. GitHub es la editorial que guarda todas las versiones del manuscrito. Vercel es la imprenta que lo convierte en un libro físico disponible en las librerías (internet).
  </div>

  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Se escribe o modifica el código</strong> en el ordenador local usando un editor de texto especializado (VS Code).</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Se hace un "commit"</strong> — se toma una foto del estado actual del código con un mensaje descriptivo de qué cambió y por qué.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Se hace un "push"</strong> — esa foto se sube a GitHub, donde queda guardada permanentemente junto a todas las versiones anteriores.</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Se despliega en Vercel</strong> con el comando <code>npx vercel --prod</code>. Vercel descarga el código, lo compila y lo publica en sus servidores.</div></div>
  <div class="step"><div class="step-num">5</div><div class="step-text"><strong>En ~45 segundos</strong> los cambios están disponibles para cualquier usuario del mundo en la URL de producción.</div></div>

  <h2>¿Qué es GitHub?</h2>
  <p>GitHub es una plataforma donde se guarda el código con control de versiones. Cada cambio queda registrado con quién lo hizo, cuándo y por qué. Si algo sale mal, se puede volver a cualquier versión anterior con un solo comando.</p>

  <div class="analogy">
    GitHub es como el "historial de cambios" de un documento de Google Docs, pero para código y mucho más potente. Puedes ver exactamente qué línea cambió quién y cuándo.
  </div>

  <h2>Las variables de entorno</h2>
  <p>La web necesita contraseñas y claves secretas para conectarse a los servicios externos (base de datos, Uploadthing, IGDB...). Estas claves <strong>nunca se incluyen en el código</strong> — eso sería como publicar la llave de tu casa en internet. En cambio, se guardan como "variables de entorno" — configuraciones secretas que solo el servidor conoce.</p>

  <h2>Coste de mantener la web</h2>
  <table>
    <thead><tr><th>Servicio</th><th>Coste mensual</th></tr></thead>
    <tbody>
      <tr><td>Vercel (hosting)</td><td>0 € (plan gratuito)</td></tr>
      <tr><td>Neon (base de datos)</td><td>0 € (plan gratuito)</td></tr>
      <tr><td>Uploadthing (imágenes)</td><td>0 € (plan gratuito)</td></tr>
      <tr><td>IGDB (juegos)</td><td>0 € (API gratuita)</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>0 €/mes</strong></td></tr>
    </tbody>
  </table>
</div>

<!-- 14. EJEMPLO COMPLETO -->
<div class="page">
  <div class="section-header">
    <div class="section-num">14</div>
    <div class="section-title">El recorrido completo de una acción — ejemplo real</div>
  </div>

  <p>Para que todo lo anterior tenga sentido junto, veamos qué pasa exactamente cuando un usuario publica un comentario en un post:</p>

  <h2>Escenario: María quiere comentar en un post de guía de Elden Ring</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-text">
      <strong>María abre Respawn en su navegador.</strong> El navegador pide la página al servidor de Vercel. El servidor consulta la base de datos para obtener los posts recientes y devuelve el HTML. El navegador lo muestra.
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-text">
      <strong>María hace clic en el post de Elden Ring.</strong> El navegador pide la página del post. El servidor busca el post en la base de datos por su ID, también busca todos sus comentarios y los organiza en árbol. Devuelve todo junto.
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-text">
      <strong>María escribe su comentario y pulsa "Publicar".</strong> El navegador envía el texto al servidor junto con el access token de María (su "pulsera" de autenticación).
    </div>
  </div>

  <div class="step">
    <div class="step-num">4</div>
    <div class="step-text">
      <strong>El middleware verifica el token.</strong> Comprueba que la pulsera es válida y no ha caducado. Extrae el ID de María del token y lo pasa al siguiente paso.
    </div>
  </div>

  <div class="step">
    <div class="step-num">5</div>
    <div class="step-text">
      <strong>El servidor valida el comentario.</strong> ¿Está vacío? ¿Supera los 10.000 caracteres? ¿El post al que responde existe y no está borrado?
    </div>
  </div>

  <div class="step">
    <div class="step-num">6</div>
    <div class="step-text">
      <strong>Se sanitiza el texto.</strong> Se eliminan posibles scripts maliciosos del comentario.
    </div>
  </div>

  <div class="step">
    <div class="step-num">7</div>
    <div class="step-text">
      <strong>Se guarda en la base de datos.</strong> Se crea una nueva fila en la tabla de comentarios con el texto, el ID de María, el ID del post y la fecha y hora exacta.
    </div>
  </div>

  <div class="step">
    <div class="step-num">8</div>
    <div class="step-text">
      <strong>El servidor devuelve el comentario guardado.</strong> El navegador de María lo añade al árbol de comentarios visualmente, sin necesidad de recargar toda la página.
    </div>
  </div>

  <div class="step">
    <div class="step-num">9</div>
    <div class="step-text">
      <strong>Otro usuario que esté leyendo el mismo post</strong> verá el comentario de María la próxima vez que su navegador recargue los datos de la página.
    </div>
  </div>

  <div class="info" style="margin-top:24px;">
    <strong>Todo esto ocurre en menos de 500 milisegundos</strong> — medio segundo desde que María pulsa "Publicar" hasta que ve su comentario en pantalla.
  </div>

  <h2>Resumen visual de la arquitectura</h2>
  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-top:20px; font-family:monospace; font-size:9.5pt; line-height:2; color:#374151;">
    Navegador (Chrome/Edge/Firefox)<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;↕ HTTPS — todo cifrado<br/>
    Vercel (servidor) — Next.js 16<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;↕ Middleware verifica JWT<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;↕ API Routes procesan la lógica<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;↕ SQL parametrizado<br/>
    Neon PostgreSQL (base de datos)<br/>
    <br/>
    Servicios externos:<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;Uploadthing → imágenes y avatares<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;IGDB → metadatos de juegos<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;GitHub → código fuente versionado
  </div>

  <div class="footer-note">
    Respawn — Documentación explicativa · Abril 2026<br/>
    Generada automáticamente con Puppeteer
  </div>
</div>

</body>
</html>`

async function generate() {
  console.log('[explainer] Iniciando generación del PDF explicativo...')
  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    })
    console.log(`[explainer] ✅ PDF generado en: ${OUTPUT_PATH}`)
  } catch (err) {
    console.error('[explainer] ❌ Error:', err.message)
    process.exit(1)
  } finally {
    if (browser) await browser.close()
  }
}

generate()
