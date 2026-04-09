'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface IGDBResult {
  igdb_id: number
  name: string
  slug: string
  cover_url: string | null
  summary: string | null
  genres: string[]
  year: number | null
}

interface SelectedGame {
  id: string      // UUID de nuestra DB
  name: string
  cover_url: string | null
}

interface Props {
  value: SelectedGame | null
  onChange: (game: SelectedGame | null) => void
}

export default function GameSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IGDBResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json() as { data: IGDBResult[] }
        setResults(data.data ?? [])
        setOpen(true)
      }
    } catch {
      // silenciar
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 350)
  }

  async function selectGame(game: IGDBResult) {
    setOpen(false)
    setQuery('')
    setResults([])

    // Upsert en nuestra DB y obtener UUID
    try {
      const res = await fetch('/api/games/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igdb_id: game.igdb_id,
          name: game.name,
          cover_url: game.cover_url,
          summary: game.summary,
        }),
      })
      if (res.ok) {
        const data = await res.json() as { id: string }
        onChange({ id: data.id, name: game.name, cover_url: game.cover_url })
      }
    } catch {
      // silenciar
    }
  }

  // Si hay un juego seleccionado, mostrarlo
  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-800 border border-indigo-600/50 rounded-lg">
        {value.cover_url ? (
          <img src={value.cover_url} alt={value.name} className="w-10 h-14 object-cover rounded" />
        ) : (
          <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">?</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-100 truncate">{value.name}</p>
          <p className="text-xs text-indigo-400">Juego seleccionado</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          aria-label="Quitar juego"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Busca un juego en IGDB..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {results.map((game) => (
            <button
              key={game.igdb_id}
              type="button"
              onClick={() => selectGame(game)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
            >
              {game.cover_url ? (
                <img src={game.cover_url} alt={game.name} className="w-8 h-11 object-cover rounded shrink-0" />
              ) : (
                <div className="w-8 h-11 bg-gray-700 rounded shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">{game.name}</p>
                <p className="text-xs text-gray-500">
                  {game.year ?? '—'}
                  {game.genres.length > 0 && ` · ${game.genres.slice(0, 2).join(', ')}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
