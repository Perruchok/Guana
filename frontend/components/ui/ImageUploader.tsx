'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface ImageUploaderProps {
  currentImage: string | null
  onUpload: (file: File) => Promise<void>
  label?: string
  hint?: string
  loading?: boolean
}

export default function ImageUploader({
  currentImage,
  onUpload,
  label = 'Imagen',
  hint = 'JPG, PNG o WebP · Máx 5MB',
  loading = false,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    setError(null)
    try {
      await onUpload(file)
    } catch (err: any) {
      setError(err.detail || 'Error al subir la imagen')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-ink">
        {label}
      </label>

      {currentImage ? (
        <div className="relative group">
          <div className="relative w-full h-48 bg-pale rounded-sm overflow-hidden">
            <Image
              src={currentImage}
              alt="Current image"
              fill
              className="object-cover"
              unoptimized={true}
            />
          </div>
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-sm">
              <div className="animate-spin">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={openFileDialog}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-1 text-xs text-stone hover:text-ink disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cambiar imagen
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-terracota bg-cream'
              : 'border-border bg-pale hover:border-terracota hover:bg-cream'
          }`}
        >
          <svg className="w-10 h-10 text-stone mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-ink mb-1">
            Arrastra una imagen aquí o haz clic
          </p>
          <p className="text-xs text-stone">
            {hint}
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        disabled={loading}
        className="hidden"
      />
    </div>
  )
}