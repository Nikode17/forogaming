import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Forogaming — Guías, Easter Eggs & Reviews',
  description: 'Comunidad de videojuegos: guías paso a paso, easter eggs y reviews',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-gray-100 min-h-screen overflow-x-hidden">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  )
}
