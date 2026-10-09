import { ImageResponse } from 'next/og'

export const alt = 'SplitBillin — split bill online gratis dengan scan struk otomatis'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Link preview shown when the site is shared on WhatsApp and social media. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#006948',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>SplitBillin</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, lineHeight: 1.1 }}>
            Bagi tagihan tanpa ribet.
          </div>
          <div style={{ display: 'flex', fontSize: 38, marginTop: 24, color: '#85f8c4' }}>
            Foto struk, hitung otomatis, bagikan satu link.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#d6fbe9' }}>
          Gratis · Tanpa daftar · splitbillin.my.id
        </div>
      </div>
    ),
    size,
  )
}
