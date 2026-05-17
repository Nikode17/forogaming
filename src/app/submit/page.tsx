'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import GameSearch from '@/components/GameSearch'
import ImageGalleryEditor, { type EditorImage } from '@/components/ImageGalleryEditor'

interface SelectedGame {
  id: string
  name: string
  cover_url: string | null
}

export default function SubmitPage() {
  const router = useRouter()
  const { user, accessToken, isLoading } = useAuth()

  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: 'general' as 'guide' | 'easter-egg' | 'review' | 'general',
    body: '',
    is_published: true,
    steps: [] as Array<{ step_num: number; title: string; body: string; image_url: string }>,
  })

  // Imágenes del post (subidas ya, controladas por <ImageGalleryEditor />)
  const [images, setImages] = useState<EditorImage[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('El titulo es obligatorio.')
      return
    }
    if (!form.body.trim()) {
      setError('El contenido es obligatorio.')
      return
    }

    setSubmitting(true)
    try {
      // Imágenes ya están subidas (las subió <ImageGalleryEditor /> contra Uploadthing).
      // Aquí solo enviamos URL + position derivada del orden actual del array.
      const media = images.map((img, i) => ({
        type: 'image' as const,
        url: img.url,
        position: i,
      }))

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          game_id: selectedGame?.id ?? null,
          media,
          steps: form.category === 'guide' ? form.steps : [],
        }),
      })
      const data = (await res.json()) as { data?: { id: string }; error?: { message: string } }
      if (res.ok && data.data) {
        router.push(`/post/${data.data.id}`)
      } else {
        setError(data.error?.message ?? 'Error al publicar')
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { step_num: prev.steps.length + 1, title: '', body: '', image_url: '' },
      ],
    }))
  }

  const removeStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, step_num: i + 1 })),
    }))
  }

  const updateStep = (index: number, field: 'title' | 'body' | 'image_url', value: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Crear nuevo post</h1>

      {error && (
        <div className="bg-red-900/50 border border-red-800 rounded-lg px-4 py-3 mb-6 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titulo */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Titulo
          </label>
          <input
            id="title"
            type="text"
            maxLength={500}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Escribe un titulo descriptivo..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {form.title.length}/500
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
            Categoria
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                category: e.target.value as typeof form.category,
              }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            <option value="general">General</option>
            <option value="guide">Guia</option>
            <option value="easter-egg">Easter Egg</option>
            <option value="review">Review</option>
          </select>
        </div>

        {/* Juego */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Juego <span className="text-gray-500 font-normal">(opcional)</span>
          </label>
          <GameSearch value={selectedGame} onChange={setSelectedGame} />
          <p className="mt-1 text-xs text-gray-600">Busca cualquier juego de la base de datos IGDB.</p>
        </div>

        {/* Contenido */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-1">
            Contenido
          </label>
          <textarea
            id="body"
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="Escribe el contenido de tu post..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-y"
            style={{ minHeight: '200px' }}
          />
        </div>

        {/* Imágenes (opcional, hasta 10) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Imágenes <span className="text-gray-500 font-normal">(opcional, hasta 10)</span>
          </label>
          <ImageGalleryEditor images={images} onChange={setImages} maxImages={10} />
        </div>

        {/* Steps (solo para guias) */}
        {form.category === 'guide' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Pasos de la guia
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                + Anadir paso
              </button>
            </div>

            {form.steps.length === 0 && (
              <p className="text-sm text-gray-500 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                No hay pasos. Haz clic en &ldquo;Anadir paso&rdquo; para agregar instrucciones a tu guia.
              </p>
            )}

            <div className="space-y-4">
              {form.steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {step.step_num}
                      </span>
                      Paso {step.step_num}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    placeholder="Titulo del paso"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-2"
                  />
                  <textarea
                    value={step.body}
                    onChange={(e) => updateStep(index, 'body', e.target.value)}
                    placeholder="Descripcion del paso..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-y"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publicar ahora */}
        <div className="flex items-center gap-2">
          <input
            id="is_published"
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
          />
          <label htmlFor="is_published" className="text-sm text-gray-300">
            Publicar ahora
          </label>
        </div>

        {/* Boton submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {submitting ? 'Publicando...' : 'Publicar post'}
          </button>
        </div>
      </form>
    </div>
  )
}
