import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import Navbar from '@/components/Navbar'
import ChatWidget from '@/components/ChatWidget'
import AuthModal from '@/components/AuthModal'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Respawn — Guías, Easter Eggs & Reviews',
  description: 'Comunidad de videojuegos: guías paso a paso, easter eggs y reviews',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <AuthProvider>
          <AuthModalProvider>
            <SidebarProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <ChatWidget />
              <AuthModal />
            </SidebarProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
