'use client'

import { useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/contexts/AuthContext'
import { useUploadThing } from '@/lib/uploadthing'

export interface EditorImage {
  url: string
  key?: string
}

interface ImageGalleryEditorProps {
  images: EditorImage[]
  onChange: (images: EditorImage[]) => void
  maxImages?: number
}

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB — alineado con Uploadthing server cap

export default function ImageGalleryEditor({
  images,
  onChange,
  maxImages = 10,
}: ImageGalleryEditorProps) {
  const { accessToken } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadCount, setUploadCount] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const isFull = images.length >= maxImages
  const remaining = maxImages - images.length

  const { startUpload } = useUploadThing('postImageUploader', {
    headers: { Authorization: `Bearer ${accessToken ?? ''}` },
    onUploadError: () => {
      setWarning('Error al subir alguna imagen. Intenta de nuevo.')
      setUploadCount(null)
    },
  })

  // ── Identificador estable por imagen para dnd-kit ──
  // Uploadthing devuelve `key` único. Si por algún motivo falta, caemos a la URL.
  const idOf = (img: EditorImage) => img.key ?? img.url

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = images.findIndex((img) => idOf(img) === active.id)
    const newIndex = images.findIndex((img) => idOf(img) === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(images, oldIndex, newIndex))
  }

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  // ── Procesar archivos (sea por drop o por input) ──
  const processFiles = async (fileList: FileList | File[]) => {
    setWarning(null)
    const allFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (allFiles.length === 0) return

    // Validación tamaño cliente (el server vuelve a validar a 4MB)
    const tooBig = allFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES)
    const validBySize = allFiles.filter((f) => f.size <= MAX_FILE_SIZE_BYTES)
    if (tooBig.length > 0) {
      const names = tooBig.map((f) => f.name).join(', ')
      setWarning(`Archivos descartados por superar 4 MB: ${names}`)
    }

    if (validBySize.length === 0) return

    // Validación cap total
    if (images.length + validBySize.length > maxImages) {
      setWarning(`Solo puedes subir ${remaining} imágen${remaining === 1 ? '' : 'es'} más (máx ${maxImages}).`)
      return
    }

    setUploadCount(validBySize.length)
    try {
      const result = await startUpload(validBySize)
      if (result && result.length > 0) {
        const uploaded: EditorImage[] = []
        for (const r of result) {
          const url = (r.serverData as { url?: string })?.url ?? r.ufsUrl
          if (url) uploaded.push({ url, key: r.key })
        }
        if (uploaded.length > 0) onChange([...images, ...uploaded])
      }
    } finally {
      setUploadCount(null)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    void processFiles(e.target.files)
    e.target.value = '' // permite re-seleccionar el mismo archivo
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (isFull || uploadCount !== null) return
    if (e.dataTransfer.files) void processFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isFull && uploadCount === null) setIsDragOver(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  // ── Render ──

  const dropzoneClasses = (() => {
    const base = 'flex flex-col items-center justify-center w-full h-[120px] border-2 border-dashed rounded-lg transition-colors text-center px-4'
    if (isFull) return `${base} border-neutral-700 bg-neutral-900 opacity-50 cursor-not-allowed`
    if (isDragOver) return `${base} border-blue-500 bg-blue-500/10 cursor-copy`
    return `${base} border-neutral-700 bg-neutral-900 hover:border-neutral-500 cursor-pointer`
  })()

  const dropzoneText = (() => {
    if (uploadCount !== null) return `Subiendo ${uploadCount} ${uploadCount === 1 ? 'imagen' : 'imágenes'}…`
    if (isFull) return `Has alcanzado el máximo de ${maxImages} imágenes`
    return 'Arrastra imágenes aquí o pulsa el botón'
  })()

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      <div
        className={dropzoneClasses}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => {
          if (!isFull && uploadCount === null) fileInputRef.current?.click()
        }}
        role="button"
        tabIndex={0}
        aria-disabled={isFull || uploadCount !== null}
        aria-label="Subir imágenes"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isFull && uploadCount === null) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        {uploadCount !== null ? (
          <>
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-sm text-gray-300">{dropzoneText}</span>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
              <line x1="19" y1="4" x2="19" y2="10" />
              <line x1="16" y1="7" x2="22" y2="7" />
            </svg>
            <span className="text-sm text-gray-400 mb-2">{dropzoneText}</span>
            {!isFull && (
              <button
                type="button"
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                Seleccionar archivos
              </button>
            )}
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          hidden
          onChange={onInputChange}
        />
      </div>

      {warning && (
        <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900/50 rounded px-3 py-2">
          {warning}
        </p>
      )}

      {/* Texto informativo */}
      {images.length >= 2 && (
        <p className="text-xs text-gray-500">
          La primera imagen será la portada que aparece en el feed. Arrastra para reordenar.
        </p>
      )}

      {/* Grid de thumbnails */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(idOf)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <SortableThumbnail
                  key={idOf(img)}
                  id={idOf(img)}
                  url={img.url}
                  isCover={index === 0}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SortableThumbnail — un thumbnail con drag-handle implícito en toda la caja
// ─────────────────────────────────────────────────────────────────────────────
interface SortableThumbnailProps {
  id: string
  url: string
  isCover: boolean
  onRemove: () => void
}

function SortableThumbnail({ id, url, isCover, onRemove }: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative aspect-square rounded overflow-hidden bg-neutral-900 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 border-2 border-blue-500 z-10' : ''
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />

      {isCover && (
        <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded pointer-events-none">
          Portada
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Eliminar imagen"
        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
