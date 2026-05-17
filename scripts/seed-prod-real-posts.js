#!/usr/bin/env node
// Seed 4 posts reales en producción (Neon) + usuario GuideMaster.
// Idempotente: si GuideMaster ya existe, no duplica. Posts SÍ se duplicarían
// si se ejecuta dos veces — comprobamos por título antes.

const { Client } = require('pg')
const bcrypt = require('bcryptjs')

const POSTS = [
  {
    title: 'Cómo derrotar a Malenia en Elden Ring: 5 pasos para la maestra de la espada',
    category: 'guide',
    author: 'GuideMaster',
    body: `<p>Malenia, Hoja de Miquella, es probablemente el jefe opcional más temido de Elden Ring. Su Danza de las Aves Acuáticas castiga cualquier error y su robo de vida convierte cualquier impacto en un beneficio para ella. Tras decenas de intentos he condensado lo que funciona en cinco pasos.</p>

<h3>1. Equipo antisangrado obligatorio</h3>
<p>La fase 2 inflige hemorragia muy rápido. Lleva al menos un escudo medio con la ceniza <em>Barricada</em> (anula consumo de stamina al bloquear) y, si no tienes Lord's Divine Fortification, usa Boluses Lubricantes para purgar acumulación. Una build de fe pura puede tirar del milagro <em>Bestial Vitality</em> para autocurarse pasivamente entre punishes.</p>

<h3>2. Mimic Tear con tu mejor build</h3>
<p>Es la invocación más fuerte del juego para este combate. Equipa tu kit más roto (Rivers of Blood, Moonveil, doble katana sangrante…) justo antes de invocarlo y luego cambia a lo que vayas a usar tú. El Mimic la distrae y permite punishes seguros por la espalda.</p>

<h3>3. Aprende los tres tells de la Danza de las Aves Acuáticas</h3>
<p>Salto al aire = inicio. Tres oleadas: la primera es de avance largo, la segunda gira sobre sí misma, la tercera cae desde arriba. Para esquivarla a pie hay que sprintar perpendicular al inicio, hacer dos rolls cortos hacia ella en la segunda oleada y un roll final atrás cuando aterriza. Es contraintuitivo pero funciona. Si la fight te pilla con poca FP, retírate y come Pickled Turtle Necks para que regenere stamina más rápido.</p>

<h3>4. Fase 2: gestiona el debuff Scarlet Rot</h3>
<p>Al inicio de fase 2 te aplica putrefacción escarlata casi instantáneamente. Tener 2-3 Preserving Boluses listos antes de la transición es vital. Si no los tienes, sube tu Inmunidad con Crepúsculo's Mask o el escudo de Crucible Knight para resistir más.</p>

<h3>5. Paciencia y dos golpes</h3>
<p>El error más común es intentar combos de 3-4 golpes. Malenia castiga el tercer golpe el 90% de las veces. La regla: dos golpes y roll. Aguanta el ritmo durante 6-7 minutos y caerá.</p>

<p>Buena suerte, Renacido.</p>`,
  },
  {
    title: 'Hollow Knight 8 años después: sigue siendo el rey del metroidvania',
    category: 'review',
    author: 'Nikode17',
    body: `<p>Volver a Hollow Knight en 2026, con Silksong ya en el mercado y una docena de imitadores intentando capturar su magia, es un ejercicio de claridad. No es solo que aguante: es que sigue marcando el techo del género.</p>

<h3>Diseño que no envejece</h3>
<p>Team Cherry tomó decisiones radicales que, vistas hoy, parecen evidentes. Sin minimapa hasta comprarlo. Sin tutorial. Sin diálogo expositivo. El jugador aprende Hallownest moviéndose por él, equivocándose, perdiendo Geo y volviendo a por su Shade. La cartografía, gestionada con Cornifer y Iselda, es una mecánica de juego en sí misma — algo que ni los grandes Castlevania consiguieron.</p>

<h3>Combate: el peso del Nail</h3>
<p>El "peso" del Nail es lo que separa a Hollow Knight de sus clones. Cada golpe tiene anticipación, cada salto tiene gravedad. El parry del Mantis Lord se siente más impactante que el de muchos souls. Y los amuletos transforman builds enteros sin convertir el juego en un árbol de habilidades genérico: el slot system con notches obliga a elegir, no a acumular.</p>

<h3>OST: Christopher Larkin entendió el ensemble</h3>
<p>La banda sonora de Larkin es uno de los mejores soundtracks de la década. No solo por las piezas individuales (City of Tears, Greenpath, Sealed Vessel), sino por el silencio entre ellas. Hallownest está mayormente vacío de música, y cuando entra, golpea. Compárenlo con Silksong, donde Larkin se permite más pirotecnia: ambos funcionan, pero el silencio del original es lo que hace que esos crescendos te paren.</p>

<h3>Comparación con Silksong</h3>
<p>Silksong es más ágil, más vertical, más combat-heavy. Es excelente. Pero Hollow Knight es contemplativo de un modo que Silksong no intenta ser. El Trial of the Conqueror te machaca; el silencio de Greenpath te abraza. Son juegos hermanos, no padre e hijo.</p>

<h3>Dificultad: justa, no cruel</h3>
<p>Los detractores siempre vuelven a Path of Pain y a Pure Vessel. Tienen razón en que son brutales, pero también opcionales y bien señalizados. El juego base es exigente pero accesible; el endgame es para quien lo busque.</p>

<p>Ocho años después y no veo competencia real. Hollow Knight no es solo el mejor metroidvania moderno: es el techo del género. <strong>10/10.</strong></p>`,
  },
  {
    title: 'El cuadro de Angela en Silent Hill 2 Remake: un detalle que se te escapó',
    category: 'easter_egg',
    author: 'Nikode17',
    body: `<p>Bloober Team metió docenas de detalles ambientales en el remake que el original de 2001 no podía permitirse. Uno de los más perturbadores está en el segundo piso del Brookhaven Hospital, en la habitación que James cruza para llegar al pasillo de las camillas.</p>

<h3>Dónde está</h3>
<p>Entras al hospital por la recepción, subes la escalera principal y giras a la izquierda. La habitación de las enfermeras (la que tiene la mesa con expedientes y la radio cerca) tiene un cuadro torcido en la pared norte, casi tapado por una estantería caída.</p>

<h3>Qué representa</h3>
<p>El cuadro muestra una figura femenina vista desde atrás, frente a un espejo. El reflejo no es ella: es una niña, alrededor de 10 años, mirando al espectador. La iluminación del cuadro cambia con la perspectiva — si lo miras desde la izquierda parece pintura al óleo; desde la derecha, una fotografía.</p>

<h3>La conexión</h3>
<p>Angela Orosco es uno de los personajes secundarios principales del juego. Su trauma — abuso por parte de su padre desde la infancia — es uno de los elementos más explícitos que SH2 trató en 2001 con un valor narrativo poco común para la época. El cuadro condensa esa dualidad: la mujer adulta atrapada con la niña que fue, sin separación posible.</p>

<p>Bloober ha dicho en entrevistas que querían que cada NPC tuviera un "eco visual" en los entornos antes de su encuentro narrativo. James cruza esa habitación 20 minutos antes de conocer a Angela en el cementerio. Si te fijaste, ya conocías parte de su historia.</p>

<h3>Detalle final</h3>
<p>En NG+ el cuadro está en otra posición. Bloober lo confirmó en un tweet borrado: "El cuadro se mueve solo. Era un guiño a Pyramid Head, no un bug." Háganle caso o no, pero pasen por la habitación dos veces y díganme qué encuentran.</p>`,
  },
  {
    title: 'Por qué los JRPG modernos duran 80+ horas y cómo gestionarlo sin quemarte',
    category: 'general',
    author: 'GuideMaster',
    body: `<p>Persona 5 Royal: 120 horas para completar. Yakuza: Infinite Wealth: 90 horas. Like a Dragon: Gaiden, supuestamente "corto", roza las 30. Si te gustan los JRPG modernos y trabajas o estudias, has caído en un patrón que se repite: empezar con ilusión, llegar al 40% en dos semanas, y abandonar.</p>

<h3>Por qué pasó esto</h3>
<p>Hay dos tendencias que se solaparon. Por un lado, los presupuestos AAA japoneses se inflaron — para justificar el precio de 70€, los juegos necesitan "horas de contenido" como métrica de marketing. Por otro, el modelo gacha (Genshin, Star Rail) entrenó al jugador medio a aceptar progresión muy lenta. Cuando un JRPG single-player de Atlus compite con un free-to-play que ofrece 200 horas, infla su propio scope.</p>

<h3>El problema: sidequests obligatorias-no-obligatorias</h3>
<p>Yakuza es el ejemplo más claro. Las substories son opcionales, sí, pero son lo mejor del juego. Saltártelas es jugar la mitad. Persona 5 lo hace peor: los Confidants son técnicamente opcionales pero unlockean mecánicas de combate críticas. El jugador siente que "no puede" saltárselos.</p>

<h3>Cómo gestionarlo</h3>
<p>Tres reglas que llevo aplicando desde 2023:</p>
<p><strong>1. Date un budget de horas antes de empezar.</strong> Si tienes 40 horas reales disponibles este mes y el juego son 100, asúmelo y juega <em>tu</em> juego, no el completo. Cómpralo en oferta si te ayuda con el FOMO.</p>
<p><strong>2. La historia principal es la columna vertebral.</strong> Sigue la main quest. Las sidequests son "snacks", no platos principales. Si te llaman, las haces; si no, sigues. El juego está diseñado para terminarse así.</p>
<p><strong>3. Permítete dejarlo a medias.</strong> Esto es el más difícil. Un JRPG inacabado al 40% no es un fracaso: es 40 horas bien aprovechadas. La cultura del "platino o nada" es enemiga del disfrute real.</p>

<h3>Excepciones</h3>
<p>Hay juegos que sí justifican las 80h porque su loop es genuinamente disfrutable cada minuto. Persona 5 Royal lo consigue durante 100 horas. La mayoría no. Aprende a distinguirlos antes de comprometerte.</p>

<p>El tiempo es finito. Los JRPG no.</p>`,
  },
]

const MEDIA = {
  'Cómo derrotar a Malenia en Elden Ring: 5 pasos para la maestra de la espada': [
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_hero.jpg',
  ],
  'Hollow Knight 8 años después: sigue siendo el rey del metroidvania': [
    'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg',
  ],
  'El cuadro de Angela en Silent Hill 2 Remake: un detalle que se te escapó': [
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2124490/header.jpg',
  ],
  'Por qué los JRPG modernos duran 80+ horas y cómo gestionarlo sin quemarte': [
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1687950/header.jpg',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/1687950/library_hero.jpg',
  ],
}

;(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await c.connect()

  // Paso 1: GuideMaster (idempotente por username)
  const pwdHash = await bcrypt.hash('Test1234', 10)
  const gmRes = await c.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ('GuideMaster', 'guidemaster@local.test', $1, 'user')
     ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, username`,
    [pwdHash]
  )
  const guideMaster = gmRes.rows[0]
  console.log('GuideMaster:', guideMaster.id)

  // Nikode17 ya existe en prod (usuario real)
  const nikRes = await c.query(`SELECT id FROM users WHERE username = 'Nikode17'`)
  if (nikRes.rows.length === 0) {
    throw new Error('Nikode17 no existe en prod — abort')
  }
  const nikode = nikRes.rows[0]
  console.log('Nikode17:', nikode.id)

  const authorIds = { GuideMaster: guideMaster.id, Nikode17: nikode.id }

  // Verificar que la categoría 'easter_egg' existe en el enum post_category
  const enumCheck = await c.query(`
    SELECT array_agg(e.enumlabel) AS vals FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
    WHERE t.typname = 'post_category'
  `)
  const allowed = enumCheck.rows[0].vals
  console.log('Categorías permitidas:', allowed)

  // Sembrar posts en transacción
  const results = []
  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i]

    // Anti-dup: skip si ya existe un post con ese título
    const dup = await c.query('SELECT id FROM posts WHERE title = $1 LIMIT 1', [p.title])
    if (dup.rows.length > 0) {
      console.log(`SKIP (ya existe): "${p.title.slice(0, 50)}…" → ${dup.rows[0].id}`)
      results.push({ id: dup.rows[0].id, title: p.title, author: p.author, skipped: true })
      continue
    }

    // Categoría real en BD (algunos enums usan 'easter-egg' con guion)
    let cat = p.category
    if (cat === 'easter_egg' && !allowed.includes('easter_egg') && allowed.includes('easter-egg')) {
      cat = 'easter-egg'
    }

    // created_at desfasado entre últimas 24h (i=0 más reciente, i=3 más antiguo)
    const offsetMinutes = i * 360 + Math.floor(Math.random() * 60) // 0, 6h, 12h, 18h aprox
    const createdAt = new Date(Date.now() - offsetMinutes * 60 * 1000).toISOString()

    const insertRes = await c.query(
      `INSERT INTO posts (title, body, category, author_id, is_published, is_deleted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, FALSE, $5, $5)
       RETURNING id`,
      [p.title, p.body, cat, authorIds[p.author], createdAt]
    )
    const postId = insertRes.rows[0].id

    // Insertar media
    const urls = MEDIA[p.title] || []
    for (let pos = 0; pos < urls.length; pos++) {
      await c.query(
        `INSERT INTO post_media (post_id, type, url, position) VALUES ($1, 'image', $2, $3)`,
        [postId, urls[pos], pos]
      )
    }

    console.log(`OK: "${p.title.slice(0, 50)}…" → ${postId} (${urls.length} img)`)
    results.push({ id: postId, title: p.title, author: p.author, mediaCount: urls.length, skipped: false })
  }

  // Verificación final
  console.log('\n=== VERIFICACIÓN ===')
  const verify = await c.query(`
    SELECT p.id, p.title, p.category, u.username AS author, p.created_at,
           (SELECT COUNT(*) FROM post_media pm WHERE pm.post_id = p.id) AS img_count
    FROM posts p JOIN users u ON u.id = p.author_id
    WHERE p.title = ANY($1::text[])
    ORDER BY p.created_at DESC
  `, [POSTS.map(p => p.title)])
  console.table(verify.rows.map(r => ({
    id: r.id.slice(0, 8) + '…',
    title: r.title.slice(0, 45) + (r.title.length > 45 ? '…' : ''),
    cat: r.category,
    author: r.author,
    imgs: Number(r.img_count),
    created: new Date(r.created_at).toISOString().slice(0, 19),
  })))

  console.log('\n=== URLS PÚBLICAS ===')
  for (const r of verify.rows) {
    console.log(`https://forogaming.vercel.app/post/${r.id}  — ${r.title.slice(0, 60)}`)
  }

  await c.end()
})().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
