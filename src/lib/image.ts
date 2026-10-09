/**
 * Client-side image compression before upload.
 *
 * Receipts are shrunk in the browser (longest side 1600 px, JPEG 0.8) so the
 * `POST /api/scan` body stays well under the 1.5 MB limit.
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 1_500_000

export interface CompressedImage {
  blob: Blob
  previewUrl: string
  width: number
  height: number
}

type Drawable = ImageBitmap | HTMLImageElement

function fitInside(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function loadDrawable(file: File): Promise<{ drawable: Drawable; cleanup: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { drawable: bitmap, cleanup: () => bitmap.close() }
    } catch {
      // fall through to <img>
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('decode'))
      el.src = url
    })
    return { drawable: img, cleanup: () => URL.revokeObjectURL(url) }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

function drawToJpeg(source: Drawable, width: number, height: number, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('canvas'))
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode'))),
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Compress an image file. Throws on unsupported types or decode failure.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('unsupported_type')

  const { drawable, cleanup } = await loadDrawable(file)
  try {
    const width = drawable instanceof HTMLImageElement ? drawable.naturalWidth : drawable.width
    const height = drawable instanceof HTMLImageElement ? drawable.naturalHeight : drawable.height

    const ladder = [
      { maxSide: 1600, quality: 0.8 },
      { maxSide: 1600, quality: 0.6 },
      { maxSide: 1280, quality: 0.6 },
    ]

    let result: { blob: Blob; width: number; height: number } | null = null
    for (const step of ladder) {
      const size = fitInside(width, height, step.maxSide)
      const blob = await drawToJpeg(drawable, size.width, size.height, step.quality)
      result = { blob, ...size }
      if (blob.size <= MAX_BYTES) break
    }

    if (!result) throw new Error('compress')
    return {
      blob: result.blob,
      previewUrl: URL.createObjectURL(result.blob),
      width: result.width,
      height: result.height,
    }
  } finally {
    cleanup()
  }
}
