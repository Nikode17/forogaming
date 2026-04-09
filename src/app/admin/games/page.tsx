'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Game {
  id: string
  name: string
  slug: string
  cover_url: string | null
  description: string | null
  post_count: number
  created_at: string
}

const EMPTY_FORM = { name: '', slug: '', cover_url: '', description: '' }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminGamesPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()

  const [games, setGames] = useState<Game[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirigir si no es admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [isLoading, user, router])

  const fetchGames = useCallback(async () => {
    setLoadingGames(true)
    try {
      const res = await fetch('/api/games')
      if (res.ok) {
        const data = (await res.json()) as { data: Game[] }
        setGames(data.data ?? [])
      }
    } finally {
      setLoadingGames(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') fetchGames()
  }, [user, fetchGames])

  function openCreate() {
    setEditingGame(null)
    setForm(EMPTY_FORM)
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  function openEdit(game: Game) {
    setEditingGame(game)
    setForm({
      name: game.name,
      slug: game.slug,
      cover_url: game.cover_url ?? '',
      description: game.description ?? '',
    })
    setError(null)
    setSuccess(null)
    setShowForm(true)
  }

  function handleNameChange(value: string) {
    setForm(f => ({
      ...f,
      name: value,
      // Auto-generar slug solo al crear
      ...(editingGame === null ? { slug: slugify(value) } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      cover_url: form.cover_url.trim() || null,
      description: form.description.trim() || null,
    }

    try {
      let res: Response
      if (editingGame) {
        res = await fetch(`/api/games/${editingGame.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(body),
        })
      }

      const data = await res.json() as { error?: { message: string } }
      if (!res.ok) {
        setError(data.error?.message ?? 'Error al guardar el juego')
      } else {
        setSuccess(editingGame ? 'Juego actualizado correctamente.' : 'Juego creado correctamente.')
        setShowForm(false)
        setEditingGame(null)
        setForm(EMPTY_FORM)
        await fetchGames()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  function cancelForm() {
    setShowForm(false)
    setEditingGame(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin" className="hover:text-indigo-400 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-gray-300">Juegos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Gestión de juegos</h1>
          <p className="text-sm text-gray-400 mt-1">
            {games.length} {games.length === 1 ? 'juego' : 'juegos'} en el catálogo
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Nuevo juego
        </button>
      </div>

      {/* Mensajes globales */}
      {success && !showForm && (
        <div className="mb-4 bg-green-900/40 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Formulario crear / editar */}
      {showForm && (
        <div className="mb-6 bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-5">
            {editingGame ? `Editar: ${editingGame.name}` : 'Nuevo juego'}
          </h2>

          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
                maxLength={255}
                placeholder="Ej: The Witcher 3"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Slug <span className="text-red-400">*</span>
                <span className="text-gray-500 font-normal ml-2">(URL: /game/slug)</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                required
                maxLength={255}
                placeholder="the-witcher-3"
                pattern="[a-z0-9-]+"
                title="Solo letras minúsculas, números y guiones"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
              />
            </div>

            {/* Cover URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                URL de portada
                <span className="text-gray-500 font-normal ml-2">(opcional)</span>
              </label>
              <input
                type="url"
                value={form.cover_url}
                onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              {form.cover_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={form.cover_url}
                    alt="Preview"
                    className="w-12 h-12 rounded object-cover border border-gray-700"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-xs text-gray-500">Vista previa</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Descripción
                <span className="text-gray-500 font-normal ml-2">(opcional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                maxLength={5000}
                placeholder="Breve descripción del juego..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {submitting ? 'Guardando...' : editingGame ? 'Guardar cambios' : 'Crear juego'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de juegos */}
      {loadingGames ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="text-5xl mb-4">🎮</div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay juegos todavía</h3>
          <p className="text-sm text-gray-500 mb-5">Crea el primer juego para que los usuarios puedan publicar posts asociados.</p>
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            + Crear primer juego
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(game => (
            <div
              key={game.id}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              {/* Portada */}
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-800 flex items-center justify-center">
                {game.cover_url ? (
                  <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🎮</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-100 truncate">{game.name}</h3>
                  <span className="text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full shrink-0">
                    {game.post_count} {game.post_count === 1 ? 'post' : 'posts'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">/game/{game.slug}</p>
                {game.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">{game.description}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/game/${game.slug}`}
                  target="_blank"
                  className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Ver →
                </Link>
                <button
                  onClick={() => openEdit(game)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-900/30 border border-indigo-800/40 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
