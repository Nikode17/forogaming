'use client'

import { useState, useEffect } from 'react'

const GAMES = [
  {
    name: 'Cyberpunk 2077',
    genre: 'RPG · Acción',
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900.jpg',
    neon: '#00f5ff',
  },
  {
    name: 'Elden Ring',
    genre: 'Souls · Mundo abierto',
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
    neon: '#ff8c00',
  },
  {
    name: 'God of War',
    genre: 'Acción · Aventura',
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/library_600x900.jpg',
    neon: '#ff2d55',
  },
  {
    name: 'Red Dead Redemption 2',
    genre: 'Mundo abierto · Western',
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900.jpg',
    neon: '#ffd60a',
  },
  {
    name: 'The Witcher 3',
    genre: 'RPG · Fantasía',
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900.jpg',
    neon: '#bf5af2',
  },
]

// Recorte angular estilo cyberpunk — esquinas cortadas en diagonal
const CLIP = 'polygon(18px 0%, 100% 0%, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0% 100%, 0% 18px)'

function Card({
  game,
  size,
  onClick,
}: {
  game: (typeof GAMES)[0]
  size: 'active' | 'side' | 'far'
  onClick?: () => void
}) {
  const dims = {
    active: { w: 210, h: 310 },
    side:   { w: 150, h: 220 },
    far:    { w: 96,  h: 140 },
  }[size]

  const opacity = { active: 1, side: 0.55, far: 0.22 }[size]
  const blur    = size === 'far' ? 'blur(1px)' : ''

  const glow =
    size === 'active'
      ? `drop-shadow(0 0 10px ${game.neon}) drop-shadow(0 0 28px ${game.neon}99)`
      : size === 'side'
      ? `drop-shadow(0 0 5px ${game.neon}66)`
      : 'none'

  return (
    <div
      onClick={onClick}
      className="shrink-0 transition-all duration-500"
      style={{
        width: dims.w,
        height: dims.h,
        clipPath: CLIP,
        opacity,
        filter: [glow, blur].filter(Boolean).join(' ') || undefined,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <img
        src={game.cover}
        alt={game.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
      {/* Overlay gradiente neón en esquina superior */}
      {size === 'active' && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${game.neon}28 0%, transparent 45%)`,
            clipPath: CLIP,
          }}
        />
      )}
    </div>
  )
}

export default function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  const n = GAMES.length

  const go = (idx: number) => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setActive(((idx % n) + n) % n)
      setFading(false)
    }, 220)
  }

  // Auto-avance
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % n), 4500)
    return () => clearInterval(t)
  }, [n])

  const game = GAMES[active]
  const idx  = (i: number) => ((active + i) % n + n) % n

  return (
    <section className="relative w-full bg-gray-950 overflow-hidden py-10">
      {/* Fondo con glow dinámico según el juego activo */}
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${game.neon}22 0%, transparent 70%)`,
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, white 3px, white 4px)',
        }}
      />

      {/* Línea decorativa superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-all duration-700"
        style={{ background: `linear-gradient(90deg, transparent, ${game.neon}, transparent)` }}
      />
      {/* Línea decorativa inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-all duration-700"
        style={{ background: `linear-gradient(90deg, transparent, ${game.neon}, transparent)` }}
      />

      <div className="relative flex flex-col items-center gap-7">
        {/* Fila de tarjetas */}
        <div className="flex items-center justify-center gap-5">
          {/* Far left */}
          <div className="hidden xl:block">
            <Card game={GAMES[idx(-2)]} size="far" onClick={() => go(active - 2)} />
          </div>

          {/* Left */}
          <div className="hidden sm:block">
            <Card game={GAMES[idx(-1)]} size="side" onClick={() => go(active - 1)} />
          </div>

          {/* Center — activa */}
          <div
            className="relative transition-all duration-300"
            style={{ opacity: fading ? 0.4 : 1, transform: fading ? 'scale(0.96)' : 'scale(1)' }}
          >
            <Card game={game} size="active" />
          </div>

          {/* Right */}
          <div className="hidden sm:block">
            <Card game={GAMES[idx(1)]} size="side" onClick={() => go(active + 1)} />
          </div>

          {/* Far right */}
          <div className="hidden xl:block">
            <Card game={GAMES[idx(2)]} size="far" onClick={() => go(active + 2)} />
          </div>
        </div>

        {/* Nombre y género con efecto neón */}
        <div
          className="text-center transition-opacity duration-300 px-4"
          style={{ opacity: fading ? 0 : 1 }}
        >
          <h2
            className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-white mb-1"
            style={{ textShadow: `0 0 18px ${game.neon}, 0 0 40px ${game.neon}66` }}
          >
            {game.name}
          </h2>
          <p
            className="text-xs tracking-[0.25em] uppercase font-semibold"
            style={{ color: game.neon }}
          >
            {game.genre}
          </p>
        </div>

        {/* Dots de navegación */}
        <div className="flex items-center gap-2">
          {GAMES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="rounded-full transition-all duration-400"
              style={{
                width:      i === active ? 28 : 8,
                height:     8,
                background: i === active ? game.neon : '#374151',
                boxShadow:  i === active ? `0 0 8px ${game.neon}` : 'none',
              }}
              aria-label={`Ir a ${GAMES[i].name}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
