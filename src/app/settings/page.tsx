'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUploadThing } from '@/lib/uploadthing'

export default function SettingsPage() {
  const router = useRouter()
  const { user, accessToken, isLoading, updateUser } = useAuth()

  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const { startUpload } = useUploadThing('avatarUploader', {
    headers: { Authorization: `Bearer ${accessToken ?? ''}` },
    onClientUploadComplete: async (res) => {
      const url = res[0]?.serverData?.url ?? res[0]?.ufsUrl
      if (url) {
        await updateAvatarInDb(url)
      }
      setUploadingAvatar(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    },
    onUploadError: () => {
      setSaveMsg({ type: 'error', text: 'Error al subir el avatar. Intenta de nuevo.' })
      setUploadingAvatar(false)
    },
  })

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [isLoading, user, router])

  // Cargar bio actual desde la API (no está en el JWT)
  useEffect(() => {
    if (!user || !accessToken) return
    fetch('/api/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { bio?: string | null } | null) => {
        if (data?.bio) setBio(data.bio)
      })
      .catch(() => {})
  }, [user, accessToken])

  async function updateAvatarInDb(url: string) {
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ avatar_url: url }),
      })
      if (res.ok) {
        updateUser({ avatar_url: url })
        setSaveMsg({ type: 'ok', text: 'Avatar actualizado.' })
      } else {
        setSaveMsg({ type: 'error', text: 'Error al guardar el avatar.' })
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Error de conexión.' })
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return
    setUploadingAvatar(true)
    setSaveMsg(null)
    await startUpload([avatarFile])
  }

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bio: bio.trim() || null }),
      })
      if (res.ok) {
        setSaveMsg({ type: 'ok', text: 'Perfil guardado.' })
      } else {
        const data = await res.json() as { error?: { message: string } }
        setSaveMsg({ type: 'error', text: data.error?.message ?? 'Error al guardar.' })
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Error de conexión.' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const currentAvatar = avatarPreview ?? user.avatar_url

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-8">Configuración de perfil</h1>

      {saveMsg && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm border ${
            saveMsg.type === 'ok'
              ? 'bg-green-900/40 border-green-800 text-green-300'
              : 'bg-red-900/40 border-red-800 text-red-300'
          }`}
        >
          {saveMsg.text}
        </div>
      )}

      {/* Avatar */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Avatar</h2>

        <div className="flex items-center gap-6">
          {/* Preview */}
          <div className="shrink-0">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-2 border-gray-700">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-3">
              JPG, PNG o GIF · Máximo 2 MB
            </label>

            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 hover:border-indigo-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Elegir imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {avatarFile && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-gray-400 truncate max-w-[180px]">{avatarFile.name}</span>
                <button
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {uploadingAvatar ? 'Subiendo...' : 'Subir avatar'}
                </button>
                <button
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Información del perfil</h2>

        <form onSubmit={handleSaveBio} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-600">El nombre de usuario no se puede cambiar.</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
              Biografía
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="Cuéntanos algo sobre ti..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-y"
              style={{ minHeight: '100px' }}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">{bio.length}/500</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
