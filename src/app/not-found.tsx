import { StatusPage } from '@/components/StatusPage'

export default function NotFound() {
  return (
    <StatusPage
      icon="🔍"
      title="Halaman tidak ditemukan"
      body="Link-nya mungkin salah ketik, atau split bill ini sudah dihapus."
    />
  )
}
