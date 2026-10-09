'use client'

import { useEffect } from 'react'
import { StatusPage } from '@/components/StatusPage'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      icon="🛠️"
      title="Ada yang tidak beres"
      body="Maaf, halaman ini gagal dimuat. Data kamu aman. Coba lagi sebentar lagi."
    >
      <button
        type="button"
        onClick={reset}
        className="w-full py-3 bg-surface-container text-on-surface font-semibold rounded-xl text-sm"
      >
        Coba lagi
      </button>
    </StatusPage>
  )
}
