'use client'

import React, { useRef, useState } from 'react'
import { compressImage, type CompressedImage } from '@/lib/image'

interface ScanCaptureProps {
  onUseImage: (image: CompressedImage) => void
  onManual: () => void
  onBack: () => void
}

const TIPS = [
  { icon: '💡', text: 'Pastikan pencahayaan terang, hindari pantulan lampu.' },
  { icon: '📄', text: 'Ratakan struk, hindari lipatan tebal.' },
  { icon: '🔲', text: 'Seluruh struk masuk ke dalam frame.' },
]

export function ScanCapture({ onUseImage, onManual, onBack }: ScanCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CompressedImage | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const compressed = await compressImage(file)
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl)
        return compressed
      })
    } catch {
      setError('Gambar tidak didukung atau terlalu besar. Coba foto ulang.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-on-surface">Ambil Struk</h1>
        <p className="text-sm text-on-surface-variant">
          Foto struk belanja atau restoran. Foto tidak disimpan.
        </p>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!preview ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="w-full py-4 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>📷</span> Ambil Foto
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => galleryRef.current?.click()}
            className="w-full py-4 bg-surface-container text-on-surface font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>🖼️</span> Pilih dari Galeri
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.previewUrl} alt="Pratinjau struk" className="w-full h-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(preview.previewUrl)
              setPreview(null)
            }}
            className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
          >
            Ambil Ulang
          </button>
          <button
            type="button"
            onClick={() => onUseImage(preview)}
            className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl text-sm shadow-md"
          >
            Pindai Struk →
          </button>
        </div>
      )}

      {busy && <p className="text-xs text-primary text-center">Menyiapkan gambar…</p>}
      {error && (
        <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs">{error}</div>
      )}

      <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {TIPS.map((tip) => (
          <div key={tip.text} className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="text-base">{tip.icon}</span>
            <span>{tip.text}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-xs text-on-surface-variant py-2">
          ← Kembali
        </button>
        <button type="button" onClick={onManual} className="text-xs text-primary font-medium py-2 hover:underline">
          Gak punya struk? Atur jumlahnya sendiri
        </button>
      </div>
    </div>
  )
}
