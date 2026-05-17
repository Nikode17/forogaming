'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import SidebarUserZone from '@/components/SidebarUserZone'

interface SidebarGame {
  id: string
  name: string
  slug: string
  cover_url: string | null
  post_count: number
}

interface SidebarProps {
  games?: SidebarGame[]
}

interface CategoryItem {
  label: string
  value: string | null  // null = "Todas" (sin filtro)
  icon: string
}

const CATEGORIES: CategoryItem[] = [
  { label: 'Todas',       value: null,         icon: '🏠' },
  { label: 'Guías',       value: 'guide',      icon: '📖' },
  { label: 'Easter Eggs', value: 'easter-egg', icon: '🥚' },
  { label: 'Reviews',     value: 'review',     icon: '⭐' },
  { label: 'General',     value: 'general',    icon: '💬' },
]

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Nuevo',    value: 'new' },
  { label: 'Top',      value: 'top' },
  { label: 'Trending', value: 'trending' },
]

const STORAGE_KEY = 'sidebar-collapsed'
const GAMES_OPEN_KEY = 'respawn.sidebar.games-open'
const DEBOUNCE_MS = 300

export default function Sidebar({ games = [] }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { mobileOpen, closeMobile } = useSidebar()

  const [collapsed, setCollapsed] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hidratación localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === '1') setCollapsed(true)
    const storedGames = localStorage.getItem(GAMES_OPEN_KEY)
    if (storedGames === '0') setGamesOpen(false)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed, hydrated])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(GAMES_OPEN_KEY, gamesOpen ? '1' : '0')
  }, [gamesOpen, hydrated])

  // Sync del search input cuando el query param cambia externamente (ej. navegación)
  useEffect(() => {
    const urlQ = searchParams.get('q') ?? ''
    if (urlQ !== searchValue) setSearchValue(urlQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // ─── Helpers de navegación con preservación de params ───
  const buildHref = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete('page')  // resetear paginación al cambiar filtros
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname, searchParams]
  )

  const navigateWith = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      router.push(buildHref(mutate))
    },
    [router, buildHref]
  )

  // ─── Búsqueda con debounce ───
  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      navigateWith((p) => {
        if (value.trim()) p.set('q', value.trim())
        else p.delete('q')
      })
    }, DEBOUNCE_MS)
  }

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  // ─── Estado actual de filtros (lectura) ───
  const activeCategory = searchParams.get('category')  // null si "Todas"
  const activeGame = searchParams.get('game')
  const activeSort = searchParams.get('sort') ?? 'new'

  // ─── Expandir desde colapsada al buscar ───
  const expandAndFocusSearch = () => {
    setCollapsed(false)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  // ─── Render del contenido (compartido por desktop y mobile overlay) ───
  const renderContent = (isMobile = false) => {
    const isExpanded = isMobile || !collapsed
    return (
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* SEARCH */}
        <div className={`p-3 border-b border-gray-800 shrink-0 ${isExpanded ? '' : 'flex justify-center'}`}>
          {isExpanded ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar en el feed…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={expandAndFocusSearch}
              title="Buscar"
              aria-label="Buscar"
              className="w-10 h-10 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* SORT */}
        <div className={`p-3 border-b border-gray-800 shrink-0 ${isExpanded ? '' : 'flex justify-center'}`}>
          {isExpanded ? (
            <div className="inline-flex w-full bg-gray-800 border border-gray-700 rounded-lg p-1">
              {SORT_OPTIONS.map((opt) => {
                const active = activeSort === opt.value
                return (
                  <Link
                    key={opt.value}
                    href={buildHref((p) => {
                      if (opt.value === 'new') p.delete('sort')
                      else p.set('sort', opt.value)
                    })}
                    onClick={isMobile ? closeMobile : undefined}
                    className={`flex-1 text-center text-xs font-medium px-2 py-1.5 rounded transition-colors ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div title={`Orden: ${SORT_OPTIONS.find((s) => s.value === activeSort)?.label}`}
                 className="w-10 h-10 flex items-center justify-center text-xs font-bold text-indigo-400">
              {activeSort === 'new' ? 'N' : activeSort === 'top' ? 'T' : '↑'}
            </div>
          )}
        </div>

        {/* USER ZONE (solo si hay sesión) — inserta antes de CATEGORÍAS */}
        <SidebarUserZone
          isCollapsed={!isExpanded}
          onNavigate={isMobile ? closeMobile : undefined}
        />

        {/* CATEGORÍAS */}
        <nav className="p-3 border-b border-gray-800 shrink-0">
          {isExpanded && (
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Categorías
            </h3>
          )}
          <ul className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const active = (cat.value === null && !activeCategory) || cat.value === activeCategory
              return (
                <li key={cat.label}>
                  <Link
                    href={buildHref((p) => {
                      if (cat.value === null) p.delete('category')
                      else p.set('category', cat.value)
                    })}
                    onClick={isMobile ? closeMobile : undefined}
                    title={isExpanded ? undefined : cat.label}
                    className={`flex items-center gap-3 ${isExpanded ? 'px-3' : 'px-0 justify-center'} py-2 text-sm rounded-md transition-colors ${
                      active ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.icon}</span>
                    {isExpanded && <span className="truncate">{cat.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* JUEGOS POPULARES (collapsible cuando isExpanded) */}
        <nav className="p-3 flex-1 min-h-0">
          {isExpanded && (
            <button
              type="button"
              onClick={() => setGamesOpen((v) => !v)}
              aria-expanded={gamesOpen}
              className="w-full flex items-center justify-between mb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
            >
              <span>Juegos populares</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${gamesOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
          {(!isExpanded || gamesOpen) && (
            <>
              <ul className="space-y-0.5">
                {games.slice(0, 10).map((game) => {
                  const active = activeGame === game.slug
                  return (
                    <li key={game.id}>
                      <Link
                        href={buildHref((p) => p.set('game', game.slug))}
                        onClick={isMobile ? closeMobile : undefined}
                        title={isExpanded ? undefined : `${game.name} (${game.post_count})`}
                        className={`flex items-center gap-2 ${isExpanded ? 'px-2' : 'px-0 justify-center'} py-1.5 text-sm rounded-md transition-colors ${
                          active ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {game.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={game.cover_url} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                            🎮
                          </div>
                        )}
                        {isExpanded && (
                          <>
                            <span className="truncate flex-1">{game.name}</span>
                            <span className="text-[10px] text-gray-500 tabular-nums">{game.post_count}</span>
                          </>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {isExpanded && games.length > 0 && (
                <Link
                  href="/games"
                  onClick={isMobile ? closeMobile : undefined}
                  className="block mt-3 px-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ver todos los juegos →
                </Link>
              )}
            </>
          )}
        </nav>

        {/* TOGGLE colapsado/expandido (desktop only) */}
        {!isMobile && (
          <div className="border-t border-gray-800 p-2 shrink-0">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              className="w-full flex items-center justify-center h-8 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* DESKTOP — sticky, persistente */}
      <aside
        className={`hidden lg:flex flex-col sticky top-14 self-start bg-gray-900 border-r border-gray-800 transition-[width] duration-200 ${
          collapsed ? 'w-14' : 'w-[280px]'
        }`}
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >
        {renderContent(false)}
      </aside>

      {/* MOBILE — overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} aria-label="Cerrar" />
          <aside className="relative w-[280px] h-full bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
              <span className="text-sm font-semibold text-gray-200">Menú</span>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Cerrar menú"
                className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
