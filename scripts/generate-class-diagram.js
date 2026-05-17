#!/usr/bin/env node
// scripts/generate-class-diagram.js
// Genera class-diagram-respawn.pdf en el Escritorio

const puppeteer = require('puppeteer')
const path = require('path')
const os = require('os')

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUTPUT_PATH = path.join(os.homedir(), 'Desktop', 'class-diagram-respawn.pdf')

// ─── Layout reference ────────────────────────────────────────────────────────
// Row 1 (y=55..240):  User(20,55,160,155)  Post(335,55,165,185)  Comment(650,55,165,145)
// Row 2 (y=295..420): Game(20,295,160,120) Vote(335,310,165,110) Message(650,295,165,120)
// Row 3 (y=465..580): [gap]                Friendship(335,465,165,115)
//
// Relations (zero crossing strategy):
//  1. User→Post      straight horizontal  (180,110)→(335,115)
//  2. Post→Comment   near-horizontal      (500,95)→(650,90)
//  3. User→Comment   routed ABOVE row 1   M100,55 L100,35 L732,35 L732,55
//  4. Game→Post      L-shape in gap       M97,295 L97,252 L417,252 L417,240
//  5. Post→Vote      straight vertical    (417,240)→(417,310)
//  6. User→Friendship routed in left gap  M180,170 L295,170 L295,460 L335,478

const svg = `
<svg width="900" height="600" viewBox="0 0 900 600"
     xmlns="http://www.w3.org/2000/svg"
     font-family="Calibri,'Segoe UI',sans-serif" font-size="9">

  <defs>
    <!-- solid arrowhead -->
    <marker id="a" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L9,3.5 z" fill="#444"/>
    </marker>
    <!-- open diamond (aggregation) -->
    <marker id="dia" markerWidth="10" markerHeight="10" refX="0" refY="5" orient="auto">
      <path d="M0,5 L4,2 L8,5 L4,8 z" fill="none" stroke="#444" stroke-width="1"/>
    </marker>
  </defs>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- ROW 1                                                                  -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->

  <!-- ── USER (blue) ── -->
  <rect x="20" y="55" width="160" height="155" rx="4" fill="#eef4ff" stroke="#1e40af" stroke-width="1.5"/>
  <rect x="20" y="55" width="160" height="24" rx="4" fill="#1e40af"/>
  <rect x="20" y="67" width="160" height="12" fill="#1e40af"/>
  <text x="100" y="71" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">User</text>
  <line x1="20" y1="79" x2="180" y2="79" stroke="#1e40af" stroke-width="1"/>
  <text x="27" y="93"  fill="#1a1a2a">+ id: string (UUID)</text>
  <text x="27" y="107" fill="#1a1a2a">+ username: string</text>
  <text x="27" y="121" fill="#1a1a2a">+ email: string</text>
  <text x="27" y="135" fill="#1a1a2a">+ password_hash: string</text>
  <text x="27" y="149" fill="#1a1a2a">+ role: UserRole</text>
  <text x="27" y="163" fill="#1a1a2a">+ avatar_url: string | null</text>
  <text x="27" y="177" fill="#1a1a2a">+ is_banned: boolean</text>
  <text x="27" y="191" fill="#1a1a2a">+ created_at: Date</text>

  <!-- ── POST (blue) ── -->
  <rect x="335" y="55" width="165" height="185" rx="4" fill="#eef4ff" stroke="#1e40af" stroke-width="1.5"/>
  <rect x="335" y="55" width="165" height="24" rx="4" fill="#1e40af"/>
  <rect x="335" y="67" width="165" height="12" fill="#1e40af"/>
  <text x="417" y="71" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">Post</text>
  <line x1="335" y1="79" x2="500" y2="79" stroke="#1e40af" stroke-width="1"/>
  <text x="342" y="93"  fill="#1a1a2a">+ id: string (UUID)</text>
  <text x="342" y="107" fill="#1a1a2a">+ title: string</text>
  <text x="342" y="121" fill="#1a1a2a">+ body: string</text>
  <text x="342" y="135" fill="#1a1a2a">+ category: PostCategory</text>
  <text x="342" y="149" fill="#1a1a2a">+ author_id: string</text>
  <text x="342" y="163" fill="#1a1a2a">+ game_id: string | null</text>
  <text x="342" y="177" fill="#1a1a2a">+ is_published: boolean</text>
  <text x="342" y="191" fill="#1a1a2a">+ is_deleted: boolean</text>
  <text x="342" y="205" fill="#1a1a2a">+ created_at: Date</text>
  <text x="342" y="219" fill="#6b7280" font-style="italic">«steps · media · votes»</text>

  <!-- ── COMMENT (blue) ── -->
  <rect x="650" y="55" width="165" height="145" rx="4" fill="#eef4ff" stroke="#1e40af" stroke-width="1.5"/>
  <rect x="650" y="55" width="165" height="24" rx="4" fill="#1e40af"/>
  <rect x="650" y="67" width="165" height="12" fill="#1e40af"/>
  <text x="732" y="71" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">Comment</text>
  <line x1="650" y1="79" x2="815" y2="79" stroke="#1e40af" stroke-width="1"/>
  <text x="657" y="93"  fill="#1a1a2a">+ id: string (UUID)</text>
  <text x="657" y="107" fill="#1a1a2a">+ post_id: string</text>
  <text x="657" y="121" fill="#1a1a2a">+ author_id: string</text>
  <text x="657" y="135" fill="#1a1a2a">+ body: string</text>
  <text x="657" y="149" fill="#1a1a2a">+ parent_id: string | null</text>
  <text x="657" y="163" fill="#1a1a2a">+ is_deleted: boolean</text>
  <text x="657" y="177" fill="#1a1a2a">+ created_at: Date</text>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- ROW 2                                                                  -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->

  <!-- ── GAME (green) ── -->
  <rect x="20" y="295" width="160" height="120" rx="4" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <rect x="20" y="295" width="160" height="24" rx="4" fill="#16a34a"/>
  <rect x="20" y="307" width="160" height="12" fill="#16a34a"/>
  <text x="100" y="311" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">Game</text>
  <line x1="20" y1="319" x2="180" y2="319" stroke="#16a34a" stroke-width="1"/>
  <text x="27" y="333" fill="#1a1a2a">+ id: string (UUID)</text>
  <text x="27" y="347" fill="#1a1a2a">+ name: string</text>
  <text x="27" y="361" fill="#1a1a2a">+ slug: string</text>
  <text x="27" y="375" fill="#1a1a2a">+ cover_url: string | null</text>
  <text x="27" y="389" fill="#1a1a2a">+ igdb_id: number | null</text>
  <text x="27" y="403" fill="#1a1a2a">+ post_count: number</text>

  <!-- ── VOTE (orange) ── -->
  <rect x="335" y="310" width="165" height="110" rx="4" fill="#fff7ed" stroke="#ea580c" stroke-width="1.5"/>
  <rect x="335" y="310" width="165" height="24" rx="4" fill="#ea580c"/>
  <rect x="335" y="322" width="165" height="12" fill="#ea580c"/>
  <text x="417" y="326" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">Vote</text>
  <line x1="335" y1="334" x2="500" y2="334" stroke="#ea580c" stroke-width="1"/>
  <text x="342" y="348" fill="#1a1a2a">+ user_id: string</text>
  <text x="342" y="362" fill="#1a1a2a">+ target_type: post | comment</text>
  <text x="342" y="376" fill="#1a1a2a">+ target_id: string</text>
  <text x="342" y="390" fill="#1a1a2a">+ value: 1 | −1</text>
  <text x="342" y="404" fill="#6b7280" font-style="italic">«PK compuesta»</text>

  <!-- ── MESSAGE (purple) ── -->
  <rect x="650" y="295" width="165" height="120" rx="4" fill="#fdf4ff" stroke="#9333ea" stroke-width="1.5"/>
  <rect x="650" y="295" width="165" height="24" rx="4" fill="#9333ea"/>
  <rect x="650" y="307" width="165" height="12" fill="#9333ea"/>
  <text x="732" y="311" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">Message</text>
  <line x1="650" y1="319" x2="815" y2="319" stroke="#9333ea" stroke-width="1"/>
  <text x="657" y="333" fill="#1a1a2a">+ id: string (UUID)</text>
  <text x="657" y="347" fill="#1a1a2a">+ sender_id: string</text>
  <text x="657" y="361" fill="#1a1a2a">+ recipient_id: string</text>
  <text x="657" y="375" fill="#1a1a2a">+ body: string</text>
  <text x="657" y="389" fill="#1a1a2a">+ created_at: Date</text>
  <text x="657" y="403" fill="#1a1a2a">+ read_at: Date | null</text>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- ROW 3                                                                  -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->

  <!-- ── FRIENDSHIP (amber) ── -->
  <rect x="335" y="465" width="165" height="115" rx="4" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
  <rect x="335" y="465" width="165" height="24" rx="4" fill="#d97706"/>
  <rect x="335" y="477" width="165" height="12" fill="#d97706"/>
  <text x="417" y="481" text-anchor="middle" fill="white" font-weight="700" font-size="10.5">Friendship</text>
  <line x1="335" y1="489" x2="500" y2="489" stroke="#d97706" stroke-width="1"/>
  <text x="342" y="503" fill="#1a1a2a">+ id: string (UUID)</text>
  <text x="342" y="517" fill="#1a1a2a">+ user_id_1: string</text>
  <text x="342" y="531" fill="#1a1a2a">+ user_id_2: string</text>
  <text x="342" y="545" fill="#1a1a2a">+ status: pending | accepted</text>
  <text x="342" y="559" fill="#1a1a2a">+ created_at: Date</text>
  <text x="342" y="573" fill="#6b7280" font-style="italic">«unique (user_id_1, user_id_2)»</text>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- RELATIONS                                                               -->
  <!--                                                                         -->
  <!-- Strategy to avoid all crossings:                                        -->
  <!--  • User→Comment goes ABOVE row 1 at y=35                               -->
  <!--  • Game→Post L-routes through the inter-row gap at y=252               -->
  <!--  • User→Friendship L-routes through the left inter-column gap at x=295 -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->

  <!-- 1. User → Post  (1:N, solid) ─────────────────────────────────────── -->
  <line x1="180" y1="110" x2="335" y2="116"
        stroke="#1e40af" stroke-width="1.3" marker-end="url(#a)"/>
  <text x="188" y="105" fill="#1e40af" font-size="8.5" font-weight="700">1</text>
  <text x="316" y="127" fill="#1e40af" font-size="8.5" font-weight="700">N</text>

  <!-- 2. Post → Comment  (1:N, solid) ──────────────────────────────────── -->
  <line x1="500" y1="92" x2="650" y2="88"
        stroke="#1e40af" stroke-width="1.3" marker-end="url(#a)"/>
  <text x="504" y="86" fill="#1e40af" font-size="8.5" font-weight="700">1</text>
  <text x="635" y="83" fill="#1e40af" font-size="8.5" font-weight="700">N</text>

  <!-- 3. User → Comment  (1:N, dashed) — routes ABOVE all row-1 boxes ─── -->
  <!--    Path: User.top-center up to y=35, across to Comment.top-center    -->
  <path d="M100,55 L100,35 L732,35 L732,55"
        fill="none" stroke="#1e40af" stroke-width="1.2"
        stroke-dasharray="5,3" marker-end="url(#a)"/>
  <text x="108" y="32" fill="#1e40af" font-size="8.5" font-weight="700">1</text>
  <text x="737" y="32" fill="#1e40af" font-size="8.5" font-weight="700">N</text>

  <!-- 4. Game → Post  (1:N, solid) — L-shape through inter-row gap ──────── -->
  <!--    Path: Game.top up to y=252 (gap), right to Post.bottom x=400      -->
  <path d="M97,295 L97,252 L400,252 L400,240"
        fill="none" stroke="#16a34a" stroke-width="1.3" marker-end="url(#a)"/>
  <text x="88" y="283" fill="#16a34a" font-size="8.5" font-weight="700">1</text>
  <text x="404" y="248" fill="#16a34a" font-size="8.5" font-weight="700">N</text>

  <!-- 5. Post → Vote  (1:N, solid) — straight vertical ─────────────────── -->
  <line x1="417" y1="240" x2="417" y2="310"
        stroke="#ea580c" stroke-width="1.3" marker-end="url(#a)"/>
  <text x="421" y="258" fill="#ea580c" font-size="8.5" font-weight="700">1</text>
  <text x="421" y="303" fill="#ea580c" font-size="8.5" font-weight="700">N</text>

  <!-- 6. User → Friendship  (N:N, dashed) — L-shape in left gap ──────────  -->
  <!--    User.right→ right to x=295 (gap between col1 and col2)             -->
  <!--    then down to y=478 → right to Friendship.left                      -->
  <path d="M180,170 L295,170 L295,478 L335,478"
        fill="none" stroke="#d97706" stroke-width="1.2"
        stroke-dasharray="5,3" marker-end="url(#a)"/>
  <text x="186" y="165" fill="#d97706" font-size="8.5" font-weight="700">N</text>
  <text x="320" y="474" fill="#d97706" font-size="8.5" font-weight="700">N</text>

</svg>
`

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Calibri, 'Segoe UI', sans-serif;
    font-size: 12pt;
    background: #fff;
    padding: 32px 40px 32px 40px;
  }
  h1 {
    font-size: 15pt;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 6px;
  }
  .subtitle {
    font-size: 10pt;
    color: #555;
    margin-bottom: 24px;
    font-style: italic;
  }
  .svg-container {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #fafafa;
    display: inline-block;
  }
  .legend {
    margin-top: 20px;
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
    font-size: 9pt;
    color: #444;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .legend-line {
    width: 32px;
    height: 2px;
  }
  .legend-line.solid   { background: #1e40af; }
  .legend-line.dashed  {
    border-top: 2px dashed #1e40af;
    background: none;
    height: 0;
  }
  .legend-line.green   { background: #16a34a; }
  .legend-line.orange  { background: #ea580c; }
  .legend-line.amber   { border-top: 2px dashed #d97706; background: none; height: 0; }
  .fig {
    font-size: 9pt;
    color: #555;
    margin-top: 12px;
    text-align: center;
  }
</style>
</head>
<body>
  <h1>3.1 Diagrama de clases — Respawn</h1>
  <p class="subtitle">
    Entidades del dominio modeladas como interfaces TypeScript.
    Las relaciones muestran asociaciones y cardinalidades principales.
  </p>

  <div class="svg-container">
    ${svg}
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-line solid"></div>
      <span>Asociación directa (1:N)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line dashed"></div>
      <span>Asociación indirecta / N:N (dashed)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line green"></div>
      <span>Game → Post (opcional)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line orange"></div>
      <span>Post → Vote (1:N)</span>
    </div>
  </div>

  <p class="fig">
    <strong>Figura 3.</strong>
    <em>Diagrama de clases del dominio de Respawn (interfaces TypeScript).</em>
    Elaboración propia.
  </p>
</body>
</html>`

;(async () => {
  console.log('[class-diagram] Generando PDF...')

  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      args: ['--no-sandbox'],
      headless: true,
    })
  } catch {
    browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
  }

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
  })

  await browser.close()
  console.log('[class-diagram] ✅ PDF generado:', OUTPUT_PATH)
})()
